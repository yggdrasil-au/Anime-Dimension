import path from 'node:path';

const root = Deno.cwd();
const dbPath = path.resolve(root, 'subModules/db/anime-dimension.sqlite3');
const wasmPath = path.resolve(root, 'node_modules/sql.js/dist/sql-wasm.wasm');
const distDataDir = path.resolve(root, 'www/dist/data');
const tooltipsDir = path.join(distDataDir, 'tooltips');

async function pathExists(filePath) {
    try {
        await Deno.stat(filePath);
        return true;
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            return false;
        }
        throw error;
    }
}

async function main() {
    console.log('Generating offline data...');

    if (!(await pathExists(dbPath))) {
        console.error(`Database not found at ${dbPath}`);
        Deno.exit(1);
    }

    await Deno.mkdir(distDataDir, { recursive: true });
    await Deno.mkdir(tooltipsDir, { recursive: true });

    // Load SQL.js
    const SQLMod = await import('sql.js');
    const initSqlJs = SQLMod.default || SQLMod;
    const SQL = await initSqlJs({ wasmBinary: await Deno.readFile(wasmPath) });
    const filebuffer = await Deno.readFile(dbPath);
    const db = new SQL.Database(filebuffer);

    // Inspect columns
    const columnsQuery = db.exec("PRAGMA table_info(anime)");
    const columns = columnsQuery[0].values.map(v => v[1]);
    const hasCol = (name) => columns.includes(name);

    console.log('Anime table columns:', columns);

    const selectCols = [
        'a.id as internal_id', 'e.external_numeric_id as anilist_id', 'a.slug', 'a.title', 'a.thumbnail_url',
        'a."year"', 'a."type"', 'a.synopsis'
    ];

    if (hasCol('rating')) selectCols.push('a.rating');
    if (hasCol('studio')) selectCols.push('a.studio');
    if (hasCol('alt_title')) selectCols.push('a.alt_title');
    if (hasCol('notes')) selectCols.push('a.notes');

    // Join external_id table to get the true AniList ID
    const sql = `
        SELECT ${selectCols.join(', ')}
        FROM anime a
        JOIN external_id e ON a.id = e.anime_id
        JOIN source_system ss ON e.source_id = ss.id
        WHERE a.slug IS NOT NULL AND ss.code = 'anilist'
        ORDER BY a.title
    `;
    const stmt = db.prepare(sql);

    // Tag query
    const tagStmt = db.prepare('SELECT t.name FROM tag t JOIN anime_tag at ON at.tag_id = t.id WHERE at.anime_id = ? ORDER BY t.name');

// Use the comprehensive view to capture inherited season links
    const streamStmt = db.prepare('SELECT service_code, service_text_id, service_numeric_id, service_url FROM v_anilist_streaming WHERE anilist_id = ?');

    const animeLite = [];
    let tooltipCount = 0;

    // Process rows
    while (stmt.step()) {
        const row = stmt.getAsObject();

        // Tags (Uses Internal ID)
        const tags = [];
        tagStmt.bind([row.internal_id]);
        while (tagStmt.step()) {
            tags.push(tagStmt.getAsObject().name);
        }
        tagStmt.reset();

        // Streams and CR ID capture (Uses True Anilist ID)
        const streams = [];
        let currentCrId = null;
        let currentHdId = null;
        if (streamStmt) {
            // Safely grab the integer ID, falling back if the alias dropped
            const anilistId = Number(row.anilist_id || row.external_numeric_id);

            if (!Number.isNaN(anilistId)) {
                streamStmt.bind([anilistId]);
                while (streamStmt.step()) {
                    const r = streamStmt.getAsObject();
                    let platformName = r.service_code;

                    if (r.service_code === 'crunchyroll') {
                        platformName = 'Crunchyroll';
                        if (!currentCrId) {
                            currentCrId = r.service_text_id;
                        }
                    } else if (r.service_code === 'hidive') {
                        platformName = 'HiDive';
                        if (!currentHdId) {
                            currentHdId = r.service_numeric_id;
                        }
                    }

                    streams.push({
                        p: platformName,
                        u: r.service_url
                    });
                }
                streamStmt.reset();
            }
        }

        const availableStreams = streams.map(s => s.p);

        // 1. Add to Anime Lite
        animeLite.push([
            row.slug,
            row.title,
            row.year,
            row.type,
            row.thumbnail_url,
            availableStreams
        ]);

        // 2. Write Tooltip File
        const tooltip = {
            aid: row.anilist_id,
            crid: currentCrId,
            hdid: currentHdId,
            t: row.title,
            ty: row.type,
            y: row.year,
            d: row.synopsis,
            g: tags.length ? tags : undefined
        };

        if (row.thumbnail_url) tooltip.img = row.thumbnail_url;
        if (row.alt_title) tooltip.at = row.alt_title;
        if (row.studio) tooltip.st = row.studio;
        if (row.rating) tooltip.r = row.rating;
        if (row.notes) tooltip.n = row.notes;
        if (streams.length) tooltip.str = streams;

        // Remove undefined/null
        Object.keys(tooltip).forEach(key => tooltip[key] === undefined && delete tooltip[key]);

        await Deno.writeTextFile(path.join(tooltipsDir, `${row.slug}.json`), JSON.stringify(tooltip));
        tooltipCount++;
    }

    stmt.free();
    tagStmt.free();
    if (streamStmt) streamStmt.free();
    db.close();

    console.log(`Processed ${animeLite.length} items.`);

    // Write anime-lite.json
    const animeLitePath = path.join(distDataDir, 'anime-lite.json');
    await Deno.writeTextFile(animeLitePath, JSON.stringify(animeLite));
    const animeLiteSize = (await Deno.stat(animeLitePath)).size / 1024 / 1024;
    console.log(`Written anime-lite.json (${animeLiteSize.toFixed(2)} MB)`);

    console.log(`Written ${tooltipCount} tooltip files.`);
}

main().catch(e => {
    console.error(e);
    Deno.exit(1);
});