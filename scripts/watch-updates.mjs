#!/usr/bin/env -S deno run --allow-read --allow-run
// Sites\Anime-Dimension\main\scripts\watch-updates.mjs
// Unified watcher for source changes to update www/public outputs.
// Replaces multiple watch-* npm scripts with a single process.

import path from 'node:path';

const root = Deno.cwd();
const sourceDir = path.join(root, 'source');
const yamlRunScript = await import('@yggdrasil-au/yaml-run');
const DEBOUNCE_MS = 200;

function classifyChange(file) {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.scss') return 'scss';
    if (ext === '.ts') return 'ts';
    if (ext === '.astro') return 'astro';
    return null;
}

function buildTaskPlan(changeTypes) {
    const types = new Set(changeTypes);
    const tasks = [];

    const addTasks = (names) => {
        for (const task of names) {
            if (!tasks.includes(task)) {
                tasks.push(task);
            }
        }
    };

    if (types.has('scss')) {
        addTasks(['css']);
    }

    if (types.has('ts')) {
        addTasks(['js']);
    }

    if (types.has('astro')) {
        addTasks([
            'clean-www-dist-html',
            'clean-www-website-html',
            'docs-compile',
            'docs-format',
            'move-astro-output-to-dist',
            'assets:handle',
        ]);
    }

    return tasks;
}

async function runYamlRun(scriptName) {
    const child = new Deno.Command(Deno.execPath(), {
        args: [
            'run',
            '--allow-env',
            '--allow-read',
            '--allow-run',
            yamlRunScript,
            scriptName,
        ],
        cwd: root,
        stdout: 'piped',
        stderr: 'piped',
    }).spawn();

    const prefix = `[${scriptName}] `;
    const forward = async (stream, emit) => {
        let buffer = '';
        const decoder = stream.pipeThrough(new TextDecoderStream());

        for await (const chunk of decoder) {
            buffer += chunk;
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() ?? '';

            for (const line of lines) {
                emit(line);
            }
        }

        if (buffer.length > 0) {
            emit(buffer);
        }
    };

    const statusPromise = child.status;
    await Promise.all([
        forward(child.stdout, (line) => console.log(`${prefix}${line}`)),
        forward(child.stderr, (line) => console.error(`${prefix}${line}`)),
    ]);

    const status = await statusPromise;
    if (!status.success) {
        throw new Error(`Script failed: ${scriptName} (code ${status.code})`);
    }
}

const pendingTypes = new Set();
let currentRunningTypes = new Set();
const changedFiles = { scss: new Set(), ts: new Set(), astro: new Set() };
let debounceTimer = null;
let running = false;
let rerunRequested = false;

function scheduleRunFor(type, filePath) {
    if (running && currentRunningTypes.has(type)) {
        return;
    }

    pendingTypes.add(type);
    if (filePath) {
        changedFiles[type]?.add(path.relative(root, filePath));
    }

    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
        if (running) {
            rerunRequested = true;
            return;
        }

        const typesToProcess = new Set(pendingTypes);
        pendingTypes.clear();
        await runTasks(typesToProcess);

        if (rerunRequested) {
            rerunRequested = false;
            const more = new Set(pendingTypes);
            pendingTypes.clear();

            if (more.size > 0) {
                await runTasks(more);
            }
        }
    }, DEBOUNCE_MS);
}

async function runTasks(changeTypes) {
    const taskPlan = buildTaskPlan(changeTypes);
    if (taskPlan.length === 0) {
        return;
    }

    running = true;
    currentRunningTypes = new Set(changeTypes);

    const typeList = Array.from(changeTypes).join(', ');
    const details = Array.from(changeTypes)
        .map((type) => `${type}: ${Array.from(changedFiles[type] || []).slice(0, 5).join(', ')}`)
        .join(' | ');

    console.log(`\n[watch] Changes detected in: ${typeList}`);
    if (details.trim()) {
        console.log(`[watch] Files: ${details}${Object.values(changedFiles).some((set) => set.size > 5) ? ' …' : ''}`);
    }
    console.log(`[watch] Running: ${taskPlan.join(' -> ')}`);

    for (const task of taskPlan) {
        console.log(`[watch] deno run ... yaml-run ${task}`);

        try {
            await runYamlRun(task);
        } catch (error) {
            console.error(`[watch] Task failed: ${task} —`, error?.message ?? error);
        }
    }

    console.log('[watch] Done. Waiting for changes...');

    for (const key of Object.keys(changedFiles)) {
        changedFiles[key].clear();
    }

    currentRunningTypes.clear();
    running = false;
}

async function main() {
    try {
        await Deno.stat(sourceDir);
    } catch {
        console.error(`[watch] Source directory not found: ${sourceDir}`);
        Deno.exit(1);
    }

    console.log('[watch] Ready. Watching for .scss, .ts, .astro changes...');

    for await (const event of Deno.watchFs(sourceDir, { recursive: true })) {
        for (const filePath of event.paths) {
            const type = classifyChange(filePath);
            if (!type) {
                continue;
            }

            console.log(`[watch] ${event.kind}: ${path.relative(root, filePath)}`);
            scheduleRunFor(type, filePath);
        }
    }
}

try {
    await main();
} catch (error) {
    console.error('[watch] Failed:', error?.message || error);
    Deno.exit(1);
}
