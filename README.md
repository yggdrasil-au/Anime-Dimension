# Anime-Dimension

Anime-Dimension is a web and Capacitor application for discovering and tracking
animated works, including reviews, ratings, and recommendations. The frontend is
an Astro site with Sass and TypeScript; its ASP.NET Core API and database
orchestrator live under `subModules/`.

## Workspace Requirements

The project is designed for the WebDev workspace. Its `Tools/` directory is a
link to the shared tool workspace and selected frontend resources are linked
from `Sites/Shared/main`. Preserve those links, or provide compatible local
copies when working from a standalone checkout.

Required local tooling:

- Deno 2.x with Node-compatible npm package support.
- Node.js as required by Deno npm dependencies and external tooling.
- .NET SDK 10 for the API project and API build tasks.

## Development

Run commands from this directory. [deno.jsonc](deno.jsonc) declares the
`yaml-run` task; [scripts.yaml](scripts.yaml) defines the project's build,
server, API, and deployment flows.

```powershell
deno task yaml-run dev
```

The development task prepares development assets, builds the frontend, starts
the configured Caddy server, and watches for source changes. `www/` contains
generated website and Capacitor output and must not be edited by hand.

| Command                                             | Purpose                                               |
| --------------------------------------------------- | ----------------------------------------------------- |
| `deno task yaml-run build`                          | Produces the standard website build.                  |
| `deno task yaml-run dev`                            | Runs the development build, server, and watcher.      |
| `deno task yaml-run dev-prod`                       | Serves a production-oriented build locally.           |
| `deno task yaml-run lint`                           | Runs TypeScript, stylesheet, and Astro checks.        |
| `deno task yaml-run production`                     | Runs the production website and Capacitor pipeline.   |
| `deno task yaml-run capSync`                        | Synchronizes generated assets with Capacitor targets. |
| `deno task yaml-run dotnet:run`                     | Starts the API in its local debug configuration.      |
| `deno task yaml-run dotnet:build-release-linux`     | Publishes the API for Linux x64.                      |
| `deno task yaml-run dotnet:build-release-linux-arm` | Publishes the API for Linux ARM64.                    |
| `deno task yaml-run dotnet:build-release-win`       | Publishes the API for Windows x64.                    |

## Project Layout

```text
source/             Astro pages, frontend assets, styles, and TypeScript
scripts/            Build, asset, watch, and sitemap helpers
buildConfig/        Astro, server, and deployment configuration
subModules/         Anime-Dimension API, database orchestrator, and data
www/                Generated website and Capacitor output
Tools/              Link to the shared WebDev tool workspace
```

Deployment task names are defined in `scripts.yaml`. Inspect their referenced
configuration and secrets before running any task that contacts remote systems.

## Contribution Notes

- Follow the workspace [Style.md](../../../Style.md) and local project rules.
- Treat changes below `Tools/` and linked resources as shared changes.
- Update source, scripts, or configuration instead of content generated in
  `www/`.
