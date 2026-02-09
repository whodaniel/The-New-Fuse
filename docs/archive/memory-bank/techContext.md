# Tech Context

*   **Primary Technologies:**
    *   **Backend:** Node.js, TypeScript, NestJS
    *   **Frontend:** React, Material UI
    *   **Database:** PostgreSQL with Prisma ORM
    *   **State Management/Cache:** Redis
    *   **Communication:** WebSockets (`ws` library - key for VS Code to Chrome extension, as noted in FTUE Report May 2025), REST APIs, gRPC, Redis Pub/Sub, Event Streams
    *   **Developer Tools:** VS Code Extension
    *   **Containerization:** Docker (Docker Compose)
*   **Development Setup:**
    *   Clone repository, ensure `.env` files are present (`apps/backend/.env`, `apps/frontend/.env`).
    *   Uses Yarn 3.x with Corepack (enabled in Dockerfiles).
    *   Primary build/watch command: `./consolidated-build.sh --watch --skip-tests`
    *   Docker quick start: `COMPOSE_BAKE=true docker-compose -f compose.yaml up -d --build` (Frontend: localhost:3000, Backend: localhost:3001)
*   **Technical Constraints:** [Specific constraints not explicitly detailed yet, but likely involves adherence to MCP and security protocols.]
*   **Dependencies:** Key libraries include NestJS, React, Material UI, Prisma, Redis client, `ws`. (A full dependency list would require inspecting `package.json` files). Includes integration with Google's ADK via a Python Bridge.
*   **Tool Usage Patterns:**
    *   **Documentation:** JSDoc/TSDoc for inline comments. Markdown for guides. Central `docs/DEVELOPMENT_LOG.md` updated via manual edits or `yarn fuse log` commands. `FileChangeLogger` utility and `useFileChangeLogger` hook exist.
    *   **Build:** Uses a consolidated build script (`consolidated-build.sh`). Docker Compose for container orchestration.
    *   **Package Management:** Yarn 3.x with Corepack.
