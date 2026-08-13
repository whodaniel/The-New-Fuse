# Build and Deployment Guide

## Cleanup and Standardization

The repository has been cleaned up to remove dependency on non-SaaS packages.
The following packages/directories were removed:

- `apps/extension` (VSCode/Chrome extension remnants)
- `apps/client` (Desktop/Electron app remnants)
- `apps/web` (Progressive Web App remnants)
- `apps/ide-ide` (SkIDEancer IDE remnants)

Scripts referencing these packages (e.g., `clean:chrome`) have been removed from
`package.json`.

## Correct Build Path

The correct way to build the project for deployment is to use `turbo` to handle
the dependency graph, or rely on the standardized `Dockerfile.cloud_runtime` which
handles the build in layers.

### Local Build

To build locally, use the following commands:

1.  **Install Dependencies:**

    ```bash
    pnpm install
    ```

    _Note: In memory-constrained environments, you may need
    `pnpm install --ignore-scripts` followed by manual generation steps._

2.  **Generate Drizzle Client:**

    ```bash
    pnpm --filter @the-new-fuse/database run db:generate
    ```

3.  **Build All Core Packages:**
    ```bash
    pnpm run build
    ```
    This runs `turbo run build` which builds all packages in the correct
    topological order.

### Deployment Build (CloudRuntime)

The `Dockerfile.cloud_runtime` is the source of truth for deployment. It accepts a
`SERVICE_PATH` argument to build a specific service.

The build process in Docker is:

1.  Install dependencies.
2.  Build `@the-new-fuse/types`.
3.  Build all packages in `packages/`.
4.  Build `@the-new-fuse/ui-consolidated` (if needed).
5.  Build the target application (`apps/${SERVICE_PATH}`) and its dependencies.

### MCP Servers

The `apps/mcp-servers` directory contains standalone scripts
(`gemini-mcp-server.js`) that run directly with `node`. They are not part of the
pnpm workspace build pipeline but may depend on installed packages.

## Troubleshooting

- **Native Modules:** If you encounter issues with `canvas` or other native
  modules, ensure you have system dependencies installed (e.g., `libcairo2-dev`
  on Linux). The `pnpm run fix:native-modules` script can help clean and rebuild
  these.
- **Sandbox/CI Limits:** Large generated files (like Drizzle client) are ignored
  in `.gitignore`. Ensure `packages/database/generated/` is properly ignored to
  prevent file limit issues in restricted environments.
