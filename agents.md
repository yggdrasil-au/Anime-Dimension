# Anime-Dimension Agent Guide

Follow the [workspace agent guide](../../../agents.md) and [Style.md](../../../Style.md). Read any more specific guide before editing nested projects.

## Commands And Source

Run tasks from this `main/` directory with `deno task yaml-run <script-name>`. The task entry is in `deno.jsonc`; task definitions are in `scripts.yaml`. Use `build` for the website build, `dev` for the development server/watch pipeline, and `lint` for the configured checks. Inspect task dependencies before running them. Do not invoke npm commands directly or assume package metadata defines npm scripts.

Edit `source/`, `scripts/`, and `buildConfig/`; treat `www/` and caches as generated output. Read `vars.yaml` and the relevant build configuration for actual paths. `Tools/` and selected shared files may be links: edit their owning source and keep shared code website-agnostic.

## Frontend And Backend Boundaries

- The API is in `subModules/Anime-Dimension-api`; database orchestration is in `subModules/Database-Orchestrator`. Read their manifests and guides before changing backend behavior. Do not assume they share the frontend command model.
- Keep API contracts, browser clients, generated offline data, and related types consistent when changing data shapes. Inspect `scripts/generate-offline-data.mjs` before changing its inputs or output contract.
- Preserve local databases and exports; use separate test output for data-generation checks.
- For frontend changes, select relevant tasks such as `js-lint`, `css-lint`, or `docs-lint`; check both web and Capacitor behavior when shared runtime code changes. Deployment tasks are separate from local validation.
