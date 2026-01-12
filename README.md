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
- **Icons**: Bootstrap Icons
- **Build Tools**: Vite, PostCSS

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

## Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- pnpm (Package Manager)
- .NET SDK 10 LTS (for backend development)
- [Dev Tools](https://github.com/yggdrasil-au/WebDev-Tools)

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    pnpm install
    ```

### Development

To start the development environment:

```bash
pnpm dev
```
This command typically runs the build process and starts a watcher/server.

### Building

To build the project for production:

```bash
pnpm build
```
This cleans the output directory and compiles the Astro project to `www/dist`.

For a full production build including asset generation:
```bash
pnpm production
```

## Scripts

- `pnpm dev`: Runs the development workflow.
- `pnpm build`: Compiles the project.
- `pnpm production`: Full build with asset generation and linting.
- `pnpm appAssetsGen`: Generates PWA and Android assets using `capacitor-assets`.
- `pnpm capSync`: Syncs the web app with Capacitor native platforms.

## License

This project is licensed under the **Apache-2.0** License. See the `LICENSE` file for details.
