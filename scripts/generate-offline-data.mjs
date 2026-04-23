import path from 'node:path';

const root = Deno.cwd();
const dbPath = path.resolve(root, 'subModules/db/anime-dimension.sqlite3');
const wasmPath = path.resolve(root, '../../../node_modules/sql.js/dist/sql-wasm.wasm');
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
        // For CI/CD where DB might not exist, we might want to skip or fail.
        // Assuming it exists for now as per context.
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

    // Build Query
    // We want: id, slug, title, year, type, synopsis (as description)
    // Optional: rating, studio, alt_title (if they exist)
    
    const selectCols = [
        'id', 'slug', 'title', 'thumbnail_url', 
        '"year"', '"type"', 'synopsis'
    ];
    
    if (hasCol('rating')) selectCols.push('rating');
    if (hasCol('studio')) selectCols.push('studio');
    if (hasCol('alt_title')) selectCols.push('alt_title');
    if (hasCol('notes')) selectCols.push('notes'); // Assuming notes might be in anime table or separate? existing code doesn't show notes
    
    const sql = `SELECT ${selectCols.join(', ')} FROM anime WHERE slug IS NOT NULL ORDER BY title`;
    const stmt = db.prepare(sql);
    
    // Tag query
    const tagStmt = db.prepare('SELECT t.name FROM tag t JOIN anime_tag at ON at.tag_id = t.id WHERE at.anime_id = ? ORDER BY t.name');

    const animeLite = [];
    let tooltipCount = 0;
    
    // Process rows
    while (stmt.step()) {
        const row = stmt.getAsObject();
        
        // Tags
        const tags = [];
        tagStmt.bind([row.id]);
        while (tagStmt.step()) {
            tags.push(tagStmt.getAsObject().name);
        }
        tagStmt.reset();

        // 1. Add to Anime Lite
        // [slug, title, year, type, thumbnailUrl]
        animeLite.push([
            row.slug,
            row.title,
            row.year,
            row.type,
            row.thumbnail_url
        ]);

        // 2. Write Tooltip File
        // t: title (redundant if in lite, but useful for standalone)
        // at: alt_title
        // ty: type
        // y: year
        // st: studio
        // r: rating
        // d: description
        // g: tags (genres)
        // n: notes
        
        const tooltip = {
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

        // Remove undefined/null
        Object.keys(tooltip).forEach(key => tooltip[key] === undefined && delete tooltip[key]);
        
        await Deno.writeTextFile(path.join(tooltipsDir, `${row.slug}.json`), JSON.stringify(tooltip));
        tooltipCount++;
    }
    
    stmt.free();
    tagStmt.free();
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
