<instruction>You are an expert software engineer. You are working on a WIP
branch. Please run `git status` and `git diff` to understand the changes and the
current state of the code. Analyze the workspace context and complete the
mission brief.</instruction> <workspace_context> This is a NestJS monorepo for
an AI Agent Orchestration Engine called "The New Fuse". The API is in apps/api
or apps/backend using NestJS. We need RESTful endpoints for agent management.
</workspace_context> <mission_brief>

## Task: Create/Audit Agent Management API Endpoints

Ensure complete RESTful API endpoints exist for agent management.

### Steps:

1. Find existing agent controller:
   - `find apps -name "*agent*controller*" -o -name "*agent*.controller.ts"`
   - Check apps/api/src/ or apps/backend/src/
2. Audit existing endpoints and identify gaps
3. Ensure these endpoints exist (create if missing):
   ```
   GET    /api/agents           - List all agents (with pagination)
   GET    /api/agents/:id       - Get agent by ID
   POST   /api/agents           - Create new agent
   PATCH  /api/agents/:id       - Update agent
   DELETE /api/agents/:id       - Soft delete agent
   GET    /api/agents/:id/status - Get agent real-time status
   POST   /api/agents/:id/start  - Start/activate agent
   POST   /api/agents/:id/stop   - Stop/deactivate agent
   GET    /api/agents/search     - Search agents by name/type/capability
   ```
4. Add proper DTOs for request/response validation
5. Add Swagger/OpenAPI decorators for documentation
6. Ensure proper error handling and HTTP status codes

### Success Criteria:

- All CRUD endpoints working
- Proper request validation with DTOs
- Swagger documentation generated
- Consistent error responses </mission_brief>
