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
import fs from 'node:fs'

const buildCore = await import('@yggdrasil-au/build-core').catch(() => import('../../../../Tools/build-core/index.mjs'))

const root = process.cwd()
const distRoot = path.resolve(root, 'www/dist')
const distHtmlDir = path.resolve(distRoot, 'astrobuild')
const distHtmlApiDir = path.resolve(distHtmlDir, 'api')

// --- Argument Parsing ---
const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run') || args.has('--check')
const verbose = args.has('--verbose') || args.has('-v')

// Actions - all off by default
const doSetProd = args.has('--production') || args.has('--prod')
const doSetDev = args.has('--dev') || args.has('--development')
const doPrepare = args.has('--prepare')
const doSplit = args.has('--split')
const doUpdateApi = args.has('--update-api')

// --- Logging ---
function log(...msg) { console.log('[assets]', ...msg) }
function vlog(...msg) { if (verbose) console.log('[assets]', ...msg) }
function warn(...msg) { console.warn('[assets]', ...msg) }

// --- Asset Manager Setup ---
const { createAssetManager, copyPath, emptyDir, ensureDir, pathExists, removePath } = buildCore

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
    let content = await fs.promises.readFile(apiJsPath, 'utf-8')

    const prodLine = "export const PUBLIC_API_BASE = 'https://api.anime-dimension.com';"
    const devLine = "export const PUBLIC_API_BASE = 'http://localhost:5050';"

    if (mode === 'production') {
        if (content.includes(devLine)) {
            content = content.replace(devLine, prodLine)
            if (dryRun) log('[dry-run] would update api.js for production API base')
            else {
                await fs.promises.writeFile(apiJsPath, content, 'utf-8')
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
                await fs.promises.writeFile(apiJsPath, content, 'utf-8')
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

    if (dryRun) log('[dry-run] ensure', path.resolve(root, 'source/web'))
    else await ensureDir(path.resolve(root, 'source/web'))

    await assets.stageWebOnlyTopLevelIntoDist()
    await assets.split({ cleanupCapSync: true, cleanupWebsite: false })
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

    // 4. Update API Project
    if (doUpdateApi) {
        await extractApiWebsiteFromDist()
        actionTaken = true
    }

    if (!actionTaken) {
        console.log('No action arguments provided.')
        console.log('Usage: node asset-handler.mjs [--production|--dev] [--prepare] [--split] [--update-api]')
    }
}

try {
    await main()
} catch (error) {
    console.error('[assets] Failed:', error?.message || error)
    process.exitCode = 1
}