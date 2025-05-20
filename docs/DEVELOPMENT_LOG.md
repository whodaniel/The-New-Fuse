## 2025-05-01 (Part 3)

**Goal:** Address TODOs in `MCPRegistryService` / `MCPRegistryServer` (Authentication, Parameter Validation, Configuration).

**Summary:**
Implemented API Key authentication for service-to-API communication, added parameter validation for incoming MCP requests, and documented necessary configuration variables.

**Changes:**
- **Authentication:**
    - Created `ApiKeyAuthGuard` (`packages/api/src/modules/auth/guards/api-key-auth.guard.ts`) to validate `X-API-Key` header against `MCP_REGISTRY_API_KEY` config.
    - Created `AuthModule` (`packages/api/src/modules/auth/auth.module.ts`) to provide and export guards (including placeholders for JWT).
    - Created `ServiceOrUserAuthGuard` (`packages/api/src/modules/auth/guards/service-or-user-auth.guard.ts`) to allow access via *either* JWT or API Key.
    - Updated `AgentModule` (`packages/api/src/modules/agent.module.ts`) to import `AuthModule`.
    - Updated `AgentController` (`packages/api/src/modules/controllers/agent.controller.ts`) to use `ServiceOrUserAuthGuard` and handle potentially missing user context in service calls.
    - Updated `MCPRegistryService` (`packages/api/src/modules/mcp/mcp-registry.service.ts`) to load `MCP_REGISTRY_API_KEY` and send it in the `X-API-Key` header for API calls.
- **Parameter Validation:**
    - Added `ajv` dependency to `apps/api`.
    - Updated `MCPRegistryServer` (`packages/api/src/modules/mcp/mcp-registry.server.ts`):
        - Initialized `ajv`.
        - Pre-compiled parameter schemas for tools into a cache.
        - Added validation logic before executing tools, returning errors for invalid parameters.
- **Configuration:**
    - Added `MCP_REGISTRY_PORT`, `MCP_REGISTRY_API_KEY`, and `API_URL` to `apps/api/.env.example`.

**Next Steps:**
- Proceed to Step 6 of the plan: Implement External Entity Registration.
- **Important Follow-up:** Modify `AgentService` methods (`createAgent`, `findAgents`, `getAgentById`, `updateAgent`, `updateAgentStatus`) to correctly handle authorization and context when `userId` is `undefined` (indicating a service call via API Key). This is crucial for the API Key auth flow to function correctly beyond just the guard level.
- Ensure `JwtAuthGuard` and `JwtStrategy` implementations exist and are correctly configured in `AuthModule`.

**Author:** AI Agent (Claude)
