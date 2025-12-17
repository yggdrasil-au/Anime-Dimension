***

## 🚀 Build and Deploy Workflow Specification

This document outlines the unified build and deployment process. The core idea is to generate a primary build output and then split it into a full version for the website and a lean, pruned version for mobile deployment via Capacitor.

---

### 📂 Key Directory Paths

* `source/web`
    * Contains **web-only assets** like `robots.txt`, `.htaccess`, sitemaps, etc. These are merged into the final web build but excluded from the mobile bundle.
* `www/dist`
    * The **primary build output directory**. All compiled CSS, JS, HTML, and assets from the source files land here first.
* `www/website`
    * The **final, complete website output**. This is a copy of `www/dist` plus the web-only assets from `source/web`. This directory is what you deploy to your web server.
* `www/capacitorsync`
    * The **pruned mobile web bundle**. This is a lightweight version of `www/dist`, optimized for Capacitor by removing web-only files, source maps, and unminified assets.

---

### 🛠️ Asset Handler (`scripts/asset-handler.mjs`)

This script manages the preparation and splitting of build artifacts. It's the engine behind the two-output system.

#### **Behavior**

* **Prepare Phase** (`--prepare`)
    * Ensures the `www/dist` directory exists.
    * Copies `source/assets` ➡️ `www/dist/assets`.
    * Copies `node_modules/bootstrap-icons/*` ➡️ `www/dist/css/assets/icons`.
    * Optionally mirrors key assets to the `public/` directory for the Astro dev server when run with the `--public` flag.

* **Split Phase** (`--split`)
    1.  Copies files from `source/web` into the root of `www/dist`.
    2.  Duplicates the entire `www/dist` directory into `www/website` and `www/capacitorsync`.
    3.  Extracts API-related files (`html/api/**` or `dist/api/**`) to a separate project directory and removes them from `www/dist`.
    4.  **Prunes the `www/capacitorsync` directory** by removing:
        * All files that originated from `source/web`.
        * Standard web files: `robots.txt`, `sitemap*.xml`, `.htaccess`, `.well-known/**`, etc.
        * Experimental content: `experimental/**`.
        * Source maps: `**/*.map`.
        * All JavaScript files except minified ones (`**/*.min.js`).
        * All CSS files except `css/main.min.css` and shared assets in `css/assets/**`.

#### **Usage**

The script is integrated into `npm` scripts for easy use:

* `npm run assets:prepare`: Prepares the `www/dist` directory with assets.
* `npm run assets:prepare-public`: Same as prepare, but also mirrors assets to `public/` for the dev server.
* `npm run assets:handle`: Executes the split and prune logic.
* **Flags**:
    * `--check`: Performs a dry run, logging planned actions without making changes.
    * `--verbose` or `-v`: Enables detailed logging.

---

### 🏗️ Build Commands

* `npm run build`
    * A full, clean build. Runs `clean` then `compile`.
* `npm run compile`
    * The main compilation pipeline:
        1.  Compiles SCSS and TypeScript.
        2.  Runs `assets:prepare`.
        3.  Runs Astro build (which uses `assets:prepare-public`).
        4.  Flattens output.
        5.  Runs `assets:handle` to split and prune the final outputs.

> **Final Outputs:** After a build, `www/website` contains the full site for deployment, and `www/capacitorsync` contains the lean bundle for mobile. `www/dist` remains as the intermediate state.

---

### 📱 Capacitor Configuration

* **Config File**: `capacitor.config.ts`
* **Web Directory**: The `webDir` property is set to `www/capacitorsync`.
* **Sync Command**: Run `npm run capSync` after a build to sync the mobile assets with Capacitor.

---

### 🛰️ Deployment (`scripts/deploy.mjs`)

Deployment is handled via an SFTP script.

* **Configuration**: Set your deployment credentials and paths in a `.env.deploy` file.
    * `DEPLOY_LOCAL_DIR=www/website` (Recommended)
    * `DEPLOY_REMOTE_DIR=/var/www/your/path`
    * SSH/SFTP connection details.
* **Commands**:
    * `npm run deploy:check`: Validates your deployment configuration.
    * `npm run deploy`: Runs a production build and deploys the `www/website` directory.

---

### 💻 Development Workflow

#### **Unified Watcher**

A single command provides a live-reloading development experience:

* `npm run watch`
    * This command runs `scripts/watch-updates.mjs`, which monitors the `source/` directory for changes to `.scss`, `.ts`, and `.astro` files and triggers the minimal required rebuild tasks.

#### **Dev Server Options**

1.  **Local Apache Server**
    * **Script**: `npm run dev-apache`
    * **How it works**: Performs a full `build` and then starts the `watch` task.
    * **Configuration**: Point your Apache `DocumentRoot` to `www/website`.
    > **Note**: The watcher updates `www/dist` and `public`. For changes to appear on your Apache server, you either need to run `npm run assets:handle` manually or point Apache to `www/dist` during development.

2.  **Astro Dev Server**
    * **Script**: `npm run dev`
    * **How it works**: Runs `clean-public`, `watch`, and the Astro dev server (`docs-serve`) concurrently.
    * **Port**: Defaults to `3000`. Ensure this doesn't conflict with other services (like Apache).

---

### ✨ Future Improvements

* Make pruning rules configurable via an external JSON file.
* Add an image optimization step for the `www/website` build.
* Implement a build step that reports the final size of `www/capacitorsync`.
* Improve the deploy script with cache-busting and diff-based uploads.
* Integrate subresource integrity (SRI) hashes for critical assets.