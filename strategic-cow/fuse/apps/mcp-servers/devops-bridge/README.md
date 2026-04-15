# DevOps Bridge MCP Server

This MCP server acts as a bridge between the AI and the project's CI/CD
capabilities.

## Capabilities

1.  **`list_system_skills`**: Scans `.github/workflows` to find available
    automation skills (e.g., build, test, deploy).
2.  **`invoke_skill`**: Triggers a GitHub Action workflow via the GitHub API.
3.  **`get_skill_feedback`**: Retrieves logs and status of workflow runs to
    support self-correction.

## Setup

1.  Ensure `GITHUB_TOKEN` is set in your environment.
2.  Install dependencies: `pnpm install`
3.  Build: `pnpm run build`
4.  Run: `node dist/index.js` or use with MCP Inspector.

## Configuration

The server defaults to `whodaniel/fuse` repo. To change, edit `src/index.ts`.
