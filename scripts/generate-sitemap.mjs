import path from 'node:path';

// --- CONFIGURATION ---
const BASE_URL = 'https://anime-dimension.com';
const INPUT_DIR = path.resolve('./www/website');
const OUTPUT_PATHS = [
    path.resolve('./source/web/sitemap.xml'),
    path.resolve('./www/website/sitemap.xml')
];

// --- IGNORE PATTERNS ---
const IGNORE_FOLDERS = [
    'admin/',
    'Error/',
    'capError/',
    'webfonts/',
    'users/',
    'manifest/',
    'js/',
    'data/',
    'css/'
];

const IGNORE_FILES = new Set([
    'dev.html',
    'service-worker.js',
    'service-worker.js.map',
    'service-worker.min.js',
    'service-worker.min.js.map',
]);

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

// Helper to recursively find all files in a directory
async function walkDir(dir, callback) {
    for await (const entry of Deno.readDir(dir)) {
        const dirPath = path.join(dir, entry.name);

        if (entry.isDirectory) {
            await walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    }
}

async function generateSitemap() {
    if (!(await pathExists(INPUT_DIR))) {
        console.error(`❌ Input directory does not exist: ${INPUT_DIR}`);
        console.log('Please ensure your project has been built before running this script.');
        return;
    }

    const urls = [];

    await walkDir(INPUT_DIR, (filePath) => {
        // Only index HTML files
        if (filePath.endsWith('.html')) {
            let relativePath = path.relative(INPUT_DIR, filePath);

            // Normalize slashes for web URLs (fixes Windows backslashes)
            relativePath = relativePath.replace(/\\/g, '/');

            // Check against IGNORE_FOLDERS
            const shouldIgnoreFolder = IGNORE_FOLDERS.some(folder => relativePath.startsWith(folder));
            if (shouldIgnoreFolder) {
                return;
            }

            // Check against IGNORE_FILES
            const fileName = path.basename(relativePath);
            if (IGNORE_FILES.has(fileName)) {
                return;
            }

            // Clean up URLs by removing 'index.html'
            if (relativePath.endsWith('index.html')) {
                relativePath = relativePath.slice(0, -10);
            }

            // Construct the final URL
            const url = new URL(relativePath, BASE_URL).href;

            // Avoid duplicate trailing slashes
            const cleanUrl = url.endsWith('/') && url !== `${BASE_URL}/` ? url.slice(0, -1) : url;

            urls.push(cleanUrl);
        }
    });

    // Generate XML structure
    const today = new Date().toISOString().split('T')[0];
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>\n    <loc>${url}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`).join('\n')}
</urlset>`;

    // Write to all output locations
    for (const outputPath of OUTPUT_PATHS) {
        const outDir = path.dirname(outputPath);

        // Ensure the target directory exists
        await Deno.mkdir(outDir, { recursive: true });

        await Deno.writeTextFile(outputPath, sitemapXml);
        console.log(`✅ Sitemap successfully generated at: ${outputPath}`);
    }
}

await generateSitemap();