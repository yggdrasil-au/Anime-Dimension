#!/usr/bin/env node
// Sites\Anime-Dimension\main\scripts\watch-updates.mjs
// Unified watcher for source changes to update www/public outputs.
// Replaces multiple watch-* npm scripts with a single process.

import { spawn } from 'node:child_process';
import { promises as fs, watch as fsWatch } from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';

const root = process.cwd();
const sourceDir = path.join(root, 'source');

// Map file extensions to the task list they should trigger.
// Note: docs-compile already runs asset handling after build via assets:handle in our pipeline.
const TASKS_BY_TYPE = {
    scss: ['css'],
    ts: ['js'],
    astro: ['docs-compile', 'docs-format', 'move-astro-output-to-dist', 'assets:handle'],
};

// Debounce window in ms to coalesce rapid changes.
const DEBOUNCE_MS = 200;

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

/** Run an npm script by name and prefix output lines for visibility. */
function runNpm(scriptName) {
    return new Promise((resolve, reject) => {
        // On Windows some environments can raise EINVAL when spawning .cmd directly.
        // Route through the shell for reliability across PowerShell/CMD.
        // Using a single command string keeps quoting simple for typical script names.
        const command = `${npmCmd} run ${scriptName}`;
        const child = spawn(command, {
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe'],
        });

        const prefix = `[${scriptName}] `;
        if (child.stdout) {
            child.stdout.setEncoding('utf8');
            child.stdout.on('data', (data) => {
                const text = String(data).replace(/\r?\n/g, `\n${prefix}`);
                process.stdout.write(prefix + text);
            });
        }
        if (child.stderr) {
            child.stderr.setEncoding('utf8');
            child.stderr.on('data', (data) => {
                const text = String(data).replace(/\r?\n/g, `\n${prefix}`);
                process.stderr.write(prefix + text);
            });
        }

        child.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Script failed: ${scriptName} (code ${code})`));
        });
        child.on('error', (err) => {
            reject(err);
        });
    });
}

/** Create a merged, ordered task list for a set of change types. */
function buildTaskPlan(changeTypes) {
    const types = new Set(changeTypes);

    // Collect tasks and dedupe while preserving relative ordering priorities.
    const tasks = [];
    const addTasks = (names) => {
        for (const t of names) if (!tasks.includes(t)) tasks.push(t);
    };

    // Order: clean -> compile per type, then shared tasks.
    // If astro is present, skip explicit copy-assets because docs-compile includes it.
    const hasAstro = types.has('astro');

    if (types.has('scss')) {
        addTasks(['css']);
    }
    if (types.has('ts')) {
        addTasks(['js']);
    }

    if (types.has('astro')) {
        addTasks(['clean', 'docs-compile', 'docs-format', 'move-astro-output-to-dist', 'assets:handle']);
    }

    return tasks;
}

let pendingTypes = new Set();
const changedFiles = { scss: new Set(), ts: new Set(), astro: new Set() };
let debounceTimer = null;
let running = false;
let rerunRequested = false;

function scheduleRunFor(type, filePath) {
    pendingTypes.add(type);
    if (filePath) changedFiles[type]?.add(path.relative(root, filePath));
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        if (running) {
            // If a run is in progress, mark for rerun and exit; pendingTypes already updated.
            rerunRequested = true;
            return;
        }
        const typesToProcess = new Set(pendingTypes);
        pendingTypes.clear();
        await runTasks(typesToProcess);
        // If new changes arrived while running, process them now.
        if (rerunRequested) {
            rerunRequested = false;
            const more = new Set(pendingTypes);
            pendingTypes.clear();
            if (more.size > 0) await runTasks(more);
        }
    }, DEBOUNCE_MS);
}

async function runTasks(changeTypes) {
    const taskPlan = buildTaskPlan(changeTypes);
    if (taskPlan.length === 0) return;

    running = true;
    const typeList = Array.from(changeTypes).join(', ');
    const details = Array.from(changeTypes)
        .map(t => `${t}: ${Array.from(changedFiles[t] || []).slice(0, 5).join(', ')}`)
        .join(' | ');
    console.log(`\n[watch] Changes detected in: ${typeList}`);
    if (details.trim()) console.log(`[watch] Files: ${details}${Object.values(changedFiles).some(s=>s.size>5)?' …':''}`);
    console.log(`[watch] Running: ${taskPlan.join(' -> ')}`);

    for (const task of taskPlan) {
        const label = `npm run ${task}`;
        console.log(`[watch] ${label}`);
        try {
            await runNpm(task);
        } catch (error) {
            console.error(`[watch] Task failed: ${task} —`, error?.message ?? error);
            // Continue to next task to avoid getting stuck.
        }
    }

    console.log('[watch] Done. Waiting for changes...');
    // Clear tracked files after a cycle
    for (const key of Object.keys(changedFiles)) changedFiles[key].clear?.();
    running = false;
}

function classifyChange(file) {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.scss') return 'scss';
    if (ext === '.ts') return 'ts';
    if (ext === '.astro') return 'astro';
    return null;
}

async function ensureDirWatchers(baseDir) {
    const watchers = new Map();

    const watchDir = (dir) => {
        if (watchers.has(dir)) return;
        try {
            const w = fsWatch(dir, { persistent: true }, (event, filename) => {
                if (!filename) return; // Some platforms may not provide filename
                const full = path.join(dir, filename.toString());
                // Recurse into new directories when created
                if (event === 'rename') {
                    fs.stat(full).then((st) => {
                        if (st.isDirectory()) watchDir(full);
                    }).catch(() => {});
                }
                const type = classifyChange(full);
                if (type) {
                    console.log(`[watch] ${event}: ${path.relative(root, full)}`);
                    scheduleRunFor(type, full);
                }
            });
            watchers.set(dir, w);
        } catch {
            // Ignore directories that can't be watched
        }
    };

    // Try native recursive watch first when supported
    try {
        const w = fsWatch(baseDir, { persistent: true, recursive: true }, (event, filename) => {
            if (!filename) return;
            const full = path.join(baseDir, filename.toString());
            const type = classifyChange(full);
            if (type) {
                console.log(`[watch] ${event}: ${path.relative(root, full)}`);
                scheduleRunFor(type, full);
            }
        });
        watchers.set(baseDir, w);
        console.log(`[watch] Watching (recursive): ${baseDir}`);
        return watchers;
    } catch {
        // Fallback: enumerate all subdirectories and watch individually
        const dirs = await fg(['**/'], { cwd: baseDir, onlyDirectories: true, dot: false });
        watchDir(baseDir);
        for (const d of dirs) watchDir(path.join(baseDir, d));
        console.log(`[watch] Watching (multi-dir): ${baseDir} and ${dirs.length} subdirectories`);
        return watchers;
    }
}

(async function main() {
    try {
        await fs.access(sourceDir);
    } catch {
        console.error(`[watch] Source directory not found: ${sourceDir}`);
        process.exit(1);
    }

    console.log('[watch] Ready. Watching for .scss, .ts, .astro changes...');
    await ensureDirWatchers(sourceDir);
})();
