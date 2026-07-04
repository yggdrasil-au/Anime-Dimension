# Anime-Dimension

Anime-Dimension is a comprehensive, multi-platform web application designed for discovering and tracking western and eastern animated works, including TV shows and movies. It features user reviews, ratings, and recommendations, offering a responsive experience across desktop, tablet, and mobile devices.

## Overview

This project is a modern web application built with **Astro** for high-performance static content delivery, styled with **Bootstrap 5** and **SCSS**, and powered by **TypeScript**. It leverages **Capacitor** for cross-platform deployment (Android, PWA).

The backend API is a separate ASP.NET Core application (located in `subModules/Anime-Dimension-api`) that handles user authentication, data management, and dynamic content.

## Features

- **Anime Database**: Extensive database of animated works.
- **User Tracking**: Track watched shows, ratings, and reviews.
- **Multi-Platform**: Optimized for Web, PWA, and Android.
- **Responsive Design**: Mobile-first approach using Bootstrap 5.
- **Dark Mode**: Built-in dark/night mode support.
- **Performance**: Static Site Generation (SSG) via Astro.

## Tech Stack

### Frontend
- **Framework**: [Astro](https://astro.build/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Bootstrap 5](https://getbootstrap.com/), SCSS
- **Icons**: Bootstrap Icons and FontAwesome
- **Build Tools**: Internal WebDev Tools in Tools/ folder

### Mobile / Cross-Platform
- **Runtime**: [Capacitor](https://capacitorjs.com/)
- **Storage**: `jeep-sqlite` for local storage handling

### Backend (Submodule)
- **Framework**: ASP.NET Core Web API (.NET 10.0)
- **Database**: SQLite (Entity Framework Core)

## Project Structure

```
Sites/
    main/Anime-Dimension/
    ├── buildConfig/        # Configuration for Astro, PostCSS, etc.
    ├── source/             # Application source code
    │   ├── assets/         # Static assets (images, icons)
    │   ├── html/           # Astro pages and components
    │   ├── scss/           # Global SCSS and Bootstrap overrides
    │   ├── ts/             # TypeScript application logic
    │   └── web/            # Web-specific resources (manifests)
    ├── subModules/         # Sub-repositories (API, Database Orchestrator)
    ├── www/                # Build output directory
    ├── capacitor.config.ts # Capacitor configuration
    └── package.json        # Project dependencies and scripts
Tools/
    ...WebDev Tools           # Shared development tools and scripts
```

## Workspace Layout Requirement

This repository is public, but the original development layout lives inside a larger private workspace.

The project expects two categories of external shared content:

- a local `Tools/` directory at the site root, normally provided by a symlink to a shared workspace `Tools/` folder
- several checked-in symlinks that point to shared files under `Sites/Shared/main`

If you clone this repository by itself and do nothing else, those symlinks will not resolve unless you recreate the expected layout or replace the links with real files.

## Setup Options

### Option 1: Recreate the Original Workspace Layout

This is the best option if you maintain multiple sites that reuse the same shared workspace resources.

```text
WebDev/
├── Sites/
│   ├── Anime-Dimension/
│   │   └── main/   # clone this repository here
│   └── Shared/
│       └── main/   # provide the shared files referenced by the symlinks in this repo
└── Tools/          # clone WebDev-Tools here
```

Steps:

1. Clone this repository into `WebDev/Sites/Anime-Dimension/main`.
2. Clone `https://github.com/yggdrasil-au/WebDev-Tools` into `WebDev/Tools`.
3. Provide a compatible `WebDev/Sites/Shared/main` tree so the checked-in shared symlinks resolve correctly.
4. Keep the repository symlinks intact.

Examples of shared symlink targets used by this project include:

- `scripts/generate-sitemap.ts`
- `scripts/watch-updates.ts`
- `source/BuildConfigs/_togglePersistence.js`
- `source/BuildConfigs/_togglePersistence.d.ts`
- `source/html/components/_0-Head.astro`
- `source/scss/bootstrap.scss`
- `source/scss/fontawesome.scss`
- `source/ts/head/eventbus.ts`
- `source/ts/head/ionic.ts`
- `source/ts/head/register-service-worker.ts`

### Option 2: Standalone Public Layout

This is usually the better option if you only want to work on this one website.

Instead of relying on the original workspace symlink for `Tools/`, replace it with a real checkout of the public tools repository inside this project.

```text
Anime-Dimension/
├── Tools/          # clone WebDev-Tools here as a real directory
├── buildConfig/
├── scripts/
├── source/
├── deno.jsonc
└── ...
```

Steps:

1. Clone this repository anywhere you want.
2. Remove or replace the `Tools` symlink at the project root.
3. Clone `https://github.com/yggdrasil-au/WebDev-Tools` into `./Tools`.
4. Replace any broken `Sites/Shared/main` symlinks with real local files, or recreate a compatible sibling `Shared/main` tree that satisfies those symlink targets.

On Windows, make sure Git and the OS are configured to preserve symlinks. If symlink checkout is unavailable, recreate the shared links as real files instead.

## Prerequisites

- Git with symlink support enabled
- Deno 2.x
- Node.js LTS
- .NET SDK 10 or later if you need backend or `.NET`-driven scripts
- `https://github.com/yggdrasil-au/WebDev-Tools`

## Installation

After the layout is in place:

```bash
deno install
```

## Development

From the site root:

```bash
deno task yaml-run dev
```

From the workspace root, if you recreated the original multi-site layout:

```bash
deno task --filter anime-dimension yaml-run dev
```

## Building

Build the site:

```bash
deno task yaml-run build
```

Full production build:

```bash
deno task yaml-run production
```

The script definitions live in `scripts.yaml`, and the `yaml-run` task itself is defined in `deno.jsonc`.

## Common Scripts

- `deno task yaml-run dev`: Development workflow with watcher/server tasks.
- `deno task yaml-run build`: Standard website build.
- `deno task yaml-run production`: Production build with optimization and validation steps.
- `deno task yaml-run dotnet:run`: Starts the backend API workflow when applicable.
- `deno task yaml-run appAssetsGen`: Generates PWA and Android assets.

## License

This project is licensed under the **Apache-2.0** License. See the `LICENSE` file for details.
