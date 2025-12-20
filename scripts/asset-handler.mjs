// Sites\Anime-Dimension\main\scripts\asset-handler.mjs
// Handles web-only assets and splits www/dist into platform-specific outputs.
// Delegates shared logic to @yggdrasil-au/build-core while keeping AD-only steps here.
// Flags:
//   --prepare  => copy source/assets -> dist, copy bootstrap-icons -> dist
//   --split    => stage source/web into dist, split + prune
//   --update-api => extract /api/** into Anime-dimension-api project
//   --check/--dry-run  => dry run (no changes), --verbose/-v for extra logs

import path from 'node:path'

const buildCore = await import('@yggdrasil-au/build-core').catch(() => import('../../../../Tools/build-core/index.mjs'))

const { createAssetManager, copyPath, emptyDir, ensureDir, pathExists, removePath } = buildCore

const root = process.cwd()
const distRoot = path.resolve(root, 'www/dist')
const distHtmlDir = path.resolve(distRoot, 'astrobuild')
const distHtmlApiDir = path.resolve(distHtmlDir, 'api')

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run') || args.has('--check')
const verbose = args.has('--verbose') || args.has('-v')
const doPrepare = args.has('--prepare') || (!args.has('--prepare') && !args.has('--split')) // default runs both
const doSplit = args.has('--split') || (!args.has('--prepare') && !args.has('--split'))
const updateApiWww = args.has('--update-api') // AD-only: extract API website to Anime-dimension-api project

function log(...msg) { console.log('[assets]', ...msg) }
function vlog(...msg) { if (verbose) console.log('[assets]', ...msg) }
function warn(...msg) { console.warn('[assets]', ...msg) }

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

async function extractApiWebsiteFromDist() {
    const apiDir = (await pathExists(distHtmlApiDir))
        ? distHtmlApiDir
        : ((await pathExists(path.join(distRoot, 'api'))) ? path.join(distRoot, 'api') : null)

    if (!apiDir) {
        vlog('No html/api directory found in dist; skipping API website extraction')
        return { found: false }
    }

    const apiProjectWww = path.resolve(root, 'subModules', 'Anime-Dimension-api', 'api', 'www')
    if (dryRun) log('[dry-run] ensure empty', apiProjectWww)
    else await emptyDir(apiProjectWww)

    const destApiDir = path.join(apiProjectWww, 'api')
    if (dryRun) log('[dry-run] copy', apiDir, '->', destApiDir)
    else await copyPath(apiDir, destApiDir, { overwrite: true, dereference: true })

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

    log('Extracted /api/** pages to Anime-dimension-api/api/www and pruned from dist')
    return { found: true, dest: apiProjectWww }
}

async function main() {
    if (doPrepare) {
        await assets.prepare()
    }

    if (doSplit) {
        if (!(await pathExists(distRoot))) {
            warn(`Build output not found at ${distRoot}. Run your build first.`)
        }

        if (dryRun) log('[dry-run] ensure', path.resolve(root, 'source/web'))
        else await ensureDir(path.resolve(root, 'source/web'))

        await assets.stageWebOnlyTopLevelIntoDist()
        await assets.split({ cleanupCapSync: true, cleanupWebsite: false })
    }

    if (updateApiWww) {
        await extractApiWebsiteFromDist()
    }
}

try {
    await main()
} catch (error) {
    console.error('[assets] Failed:', error?.message || error)
    process.exitCode = 1
}
