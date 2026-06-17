// Sites\Anime-Dimension\main\scripts\asset-handler.mjs
// Handles web-only assets and splits www/dist into platform-specific outputs.
// Delegates shared logic to @yggdrasil-au/build-core while keeping AD-only steps here.
// Flags (Explicit activation required):
//   --production / --prod => Set api.js to production API base
//   --dev / --development => Set api.js to dev API base
//   --prepare             => copy source/assets -> dist, copy bootstrap-icons -> dist
//   --split               => stage source/web into dist, split + prune
//   --update-api          => extract /api/** into Anime-dimension-api project
//   --check / --dry-run   => dry run (no changes)
//   --verbose / -v        => extra logs

import path from 'node:path'
import CleanCSS from 'npm:clean-css@5.3.3'

const buildCore = await import('@yggdrasil-au/build-core')
const root = Deno.cwd()
const distRoot = path.resolve(root, 'www/dist')
const distHtmlDir = path.resolve(distRoot, 'astrobuild')
const distHtmlApiDir = path.resolve(distHtmlDir, 'api')

// --- Argument Parsing ---
const args = new Set(Deno.args)
const dryRun = args.has('--dry-run') || args.has('--check')
const verbose = args.has('--verbose') || args.has('-v')

// Actions - all off by default
const doSetProd = args.has('--production') || args.has('--prod')
const doSetDev = args.has('--dev') || args.has('--development')
const doPrepare = args.has('--prepare')
const doSplit = args.has('--split')
const doUpdateApi = args.has('--update-api')
const doMinifyCss = args.has('--minify-css')
const doRelocateCpanelErrors = args.has('--relocate-cpanel-errors')

// --- Logging ---
function log(...msg) { console.log('[assets]', ...msg) }
function vlog(...msg) { if (verbose) console.log('[assets]', ...msg) }
function warn(...msg) { console.warn('[assets]', ...msg) }

// --- Asset Manager Setup ---
const { createAssetManager, copyPath, emptyDir, ensureDir, listFilesRelative, pathExists, removePath } = buildCore

const assets = createAssetManager({
    rootDir: root,
    srcWebRel: 'source/web',
    srcAssetsRel: 'source/assets',
    distRootRel: 'www/dist',
    websiteRel: 'www/website',
    capSyncRel: 'www/capacitorsync',
    icons: {
        fromRel: 'node_modules/bootstrap-icons',
        toRel: 'css/assets/icons',
    },
    verbose,
    dryRun,
})

// --- Logic Blocks ---

async function updateEnvironmentConfig(mode) {
    const apiJsPath = path.resolve(root, 'source', 'BuildConfigs', 'api.js')
    let content = await Deno.readTextFile(apiJsPath)

    const prodLine = "export const PUBLIC_API_BASE = 'https://api.anime-dimension.com';"
    const devLine = "export const PUBLIC_API_BASE = 'http://localhost:5050';"

    if (mode === 'production') {
        if (content.includes(devLine)) {
            content = content.replace(devLine, prodLine)
            if (dryRun) log('[dry-run] would update api.js for production API base')
            else {
                await Deno.writeTextFile(apiJsPath, content)
                log('Updated api.js to use production API base')
            }
        } else {
            log('api.js already set to production API base')
        }
    } else if (mode === 'dev') {
        if (content.includes(prodLine)) {
            content = content.replace(prodLine, devLine)
            if (dryRun) log('[dry-run] would update api.js for dev API base')
            else {
                await Deno.writeTextFile(apiJsPath, content)
                log('Updated api.js to use dev API base')
            }
        } else {
            log('api.js already set to dev API base')
        }
    }
}

async function extractApiWebsiteFromDist() {
    const apiDir = (await pathExists(distHtmlApiDir)) ? distHtmlApiDir : ((await pathExists(path.join(distRoot, 'api'))) ? path.join(distRoot, 'api') : null)

    if (!apiDir) {
        vlog('No html/api directory found in dist; skipping API website extraction')
        return { found: false }
    }

    const apiProjectWww = path.resolve(root, 'subModules', 'Anime-Dimension-api', 'www')
    if (dryRun) {
        log('[dry-run] ensure empty', apiProjectWww)
    } else {
        await emptyDir(apiProjectWww)
    }

    const destApiDir = path.join(apiProjectWww, 'api')
    if (dryRun) {
        log('[dry-run] copy', apiDir, '->', destApiDir)
    } else {
        await copyPath(apiDir, destApiDir, { overwrite: true, dereference: true })
    }

    const maybeCopy = async (fromRel, toRel = fromRel) => {
        const from = path.join(distRoot, fromRel)
        const to = path.join(apiProjectWww, toRel)
        if (await pathExists(from)) {
            if (dryRun) log('[dry-run] copy', from, '->', to)
            else await copyPath(from, to, { overwrite: true, dereference: true })
            return true
        }
        return false
    }
    await maybeCopy('css', path.join('api', 'css'))
    await maybeCopy(path.join('js', 'api'), path.join('api', 'js'))

    if (dryRun) log('[dry-run] remove', apiDir)
    else await removePath(apiDir)

    log('Extracted /api/** pages to Anime-dimension-api/www/api and pruned from dist')
    return { found: true, dest: apiProjectWww }
}

async function performSplit() {
    if (!(await pathExists(distRoot))) {
        warn(`Build output not found at ${distRoot}. Run your build first.`)
    }

    log('Staging web-only top-level assets into dist...')

    if (dryRun) log('[dry-run] ensure', path.resolve(root, 'source/web'))
    else await ensureDir(path.resolve(root, 'source/web'))

    log('Splitting dist into platform-specific outputs...')

    await assets.stageWebOnlyTopLevelIntoDist()
    await assets.split({ cleanupCapSync: true, cleanupWebsite: false })

    // Remove api folder from website and capacitorsync as it is extracted to subModule
    const apiRel = 'api'
    log('Removing API pages from website and capacitorsync outputs as they are extracted to API submodule...')
    const websiteApi = path.resolve(assets.paths.website, apiRel)
    const capSyncApi = path.resolve(assets.paths.capSync, apiRel)

    if (dryRun) {
        log('[dry-run] remove', websiteApi)
        log('[dry-run] remove', capSyncApi)
    } else {
        log('Removing', websiteApi)
        await removePath(websiteApi)
        log('Removing', capSyncApi)
        await removePath(capSyncApi)
        log('Removed API pages from website and capacitorsync outputs')
    }
}

function createMinifiedCssPath(cssFileAbsPath) {
    const parsed = path.parse(cssFileAbsPath)
    return path.join(parsed.dir, `${parsed.name}.min${parsed.ext}`)
}

function toPosix(p) {
    return p.split(path.sep).join('/')
}

async function runCssMinifyForFiles(cssFilesAbs) {
    let count = 0

    for (const cssFileAbs of cssFilesAbs) {
        const minFileAbs = createMinifiedCssPath(cssFileAbs)
        const minMapFileAbs = `${minFileAbs}.map`

        if (dryRun) {
            log('[dry-run] minify', cssFileAbs, '->', minFileAbs)
            count++
            continue
        }

        // Each file is minified independently so output stays beside the source file.
        const output = new CleanCSS({
            level: 1,
            format: {
                breakWith: 'lf',
            },
            rebase: true,
            rebaseTo: path.dirname(minFileAbs),
            sourceMap: true,
            sourceMapInlineSources: true,
        }).minify([cssFileAbs])

        if (output.errors.length > 0) {
            throw new Error(`CSS minification failed for ${cssFileAbs}: ${output.errors.join(' | ')}`)
        }

        if (output.warnings.length > 0) {
            vlog('clean-css warnings for', cssFileAbs, output.warnings)
        }

        const sourceMap = output.sourceMap?.toString() ?? ''
        const sourceMapMarker = `/*# sourceMappingURL=${path.basename(minMapFileAbs)} */`
        const stylesWithSourceMap = output.styles.includes('sourceMappingURL=')
            ? output.styles
            : `${output.styles}\n${sourceMapMarker}\n`

        await Deno.writeTextFile(minFileAbs, stylesWithSourceMap)

        if (sourceMap.length > 0) {
            await Deno.writeTextFile(minMapFileAbs, sourceMap)
        }

        count++
    }

    return count
}

async function performCssMinify() {
    const cssRoot = path.resolve(root, 'www/dist/css')

    if (!(await pathExists(cssRoot))) {
        warn(`CSS build output not found at ${cssRoot}. Run your CSS build first.`)
        return
    }

    const relFiles = await listFilesRelative(cssRoot, { includeDot: true })
    const mainCssRel = []
    const rtlCssRel = []

    for (const rel of relFiles) {
        const relPosix = toPosix(rel)

        if (!relPosix.endsWith('.css')) {
            continue
        }

        if (relPosix.endsWith('.min.css')) {
            continue
        }

        if (relPosix.endsWith('rtl.css')) {
            rtlCssRel.push(rel)
        } else {
            mainCssRel.push(rel)
        }
    }

    const mainCssAbs = mainCssRel.map((rel) => path.join(cssRoot, rel))
    const rtlCssAbs = rtlCssRel.map((rel) => path.join(cssRoot, rel))

    vlog('main css files:', mainCssRel.length)
    vlog('rtl css files:', rtlCssRel.length)

    const mainCount = await runCssMinifyForFiles(mainCssAbs)
    const rtlCount = await runCssMinifyForFiles(rtlCssAbs)

    log(`CSS minify complete. main=${mainCount}, rtl=${rtlCount}`)
}

async function performRelocateCpanelErrorPages() {
    const websiteRoot = path.resolve(root, 'www/website')
    const cpanelRoot = path.join(websiteRoot, 'cpanelErrorPages')

    if (!(await pathExists(cpanelRoot))) {
        vlog('cpanelErrorPages directory not found, skipping relocation.')
        return
    }

    const relFiles = await listFilesRelative(cpanelRoot, { includeDot: true })
    const candidates = []

    for (const rel of relFiles) {
        const relPosix = toPosix(rel).toLowerCase()

        if (!relPosix.endsWith('.html') && !relPosix.endsWith('.phtml')) {
            continue
        }

        candidates.push(rel)
    }

    if (candidates.length === 0) {
        vlog('no cPanel error pages found to relocate.')
        return
    }

    for (const rel of candidates) {
        const sourceAbs = path.join(cpanelRoot, rel)
        const sourceParsed = path.parse(sourceAbs)
        const destAbs = path.join(websiteRoot, `${sourceParsed.name}.shtml`)

        if (await pathExists(destAbs)) {
            throw new Error(`Conflict while relocating cPanel error page: source="${sourceAbs}" destination="${destAbs}" already exists.`)
        }

        if (dryRun) {
            log('[dry-run] relocate', sourceAbs, '->', destAbs)
            continue
        }

        await Deno.rename(sourceAbs, destAbs)
        vlog('relocated', sourceAbs, '->', destAbs)
    }

    log(`Relocated cPanel error pages: ${candidates.length}`)
}


// --- Main Execution ---

async function main() {
    let actionTaken = false

    // 1. Environment Config (api.js)
    if (doSetProd) {
        await updateEnvironmentConfig('production')
        actionTaken = true
    } else if (doSetDev) {
        await updateEnvironmentConfig('dev')
        actionTaken = true
    }

    // 2. Prepare Assets
    if (doPrepare) {
        await assets.prepare()
        actionTaken = true
    }

    // 3. Split / Post-Processing
    if (doSplit) {
        await performSplit()
        actionTaken = true
    }

    if (doMinifyCss) {
        await performCssMinify()
        actionTaken = true
    }

    // 4. Update API Project
    if (doUpdateApi) {
        await extractApiWebsiteFromDist()
        actionTaken = true
    }

    if (!actionTaken) {
        console.log('No action arguments provided.')
        console.log('Usage: deno run --allow-env --allow-read --allow-run --allow-write scripts/asset-handler.mjs [--production|--dev] [--prepare] [--split] [--minify-css] [--update-api]')
    }
}

try {
    await main()
} catch (error) {
    console.error('[assets] Failed:', error?.message || error)
    Deno.exit(1)
}
