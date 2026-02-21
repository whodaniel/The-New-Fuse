# Bolt's Journal

## 2026-02-20 - Broken Dependencies Block Testing
**Learning:** `apps/frontend/src/hooks/useWebSocket.ts` imports `@your-org/security/react` which is missing, and `../services/websocket.service` which doesn't exist (should be `WebSocketService`). This prevents `vitest` from running tests even if the hook is mocked, due to import analysis.
**Action:** When testing components using this hook, `vi.mock` alone is insufficient if the file is parsed. A temporary fix or environment alias is needed. The optimization can be verified by temporarily fixing the import, then reverting.
