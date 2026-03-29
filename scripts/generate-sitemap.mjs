import fs from 'node:fs';
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

// Helper to recursively find all files in a directory
function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;

    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

function generateSitemap() {
    if (!fs.existsSync(INPUT_DIR)) {
        console.error(`❌ Input directory does not exist: ${INPUT_DIR}`);
        console.log('Please ensure your project has been built before running this script.');
        return;
    }

    const urls = [];

    walkDir(INPUT_DIR, (filePath) => {
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
    OUTPUT_PATHS.forEach(outputPath => {
        const outDir = path.dirname(outputPath);

        // Ensure the target directory exists
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, sitemapXml, 'utf8');
        console.log(`✅ Sitemap successfully generated at: ${outputPath}`);
    });
}

generateSitemap();