# Bolt's Journal

## 2026-02-20 - Broken Dependencies Block Testing
**Learning:** `apps/frontend/src/hooks/useWebSocket.ts` imports `@your-org/security/react` which is missing, and `../services/websocket.service` which doesn't exist (should be `WebSocketService`). This prevents `vitest` from running tests even if the hook is mocked, due to import analysis.
**Action:** When testing components using this hook, `vi.mock` alone is insufficient if the file is parsed. A temporary fix or environment alias is needed. The optimization can be verified by temporarily fixing the import, then reverting.
## 2026-03-03 - Using React.memo in compiled source files
**Learning:** Some .tsx files in the frontend (e.g. apps/frontend/src/components/chat/EnhancedChatBubble.tsx) actually contain compiled code. Trying to use  will throw a runtime error since  doesn't exist for default imports mapped directly to the namespace in standard CommonJS compilation. It's safer to use  directly.
**Action:** Pay close attention to the import structure of compiled files when applying standard React optimizations like  to ensure module variables and properties match the CJS format.
## 2024-03-04 - Using React.memo in compiled source files
**Learning:** Some .tsx files in the frontend (e.g. apps/frontend/src/components/chat/EnhancedChatBubble.tsx) actually contain compiled code. Trying to use `react_1.default.memo` will throw a runtime error since `react_1.default` does not exist for default imports mapped directly to the namespace in standard CommonJS compilation. It is safer to use `react_1.memo` directly.
**Action:** Pay close attention to the import structure of compiled files when applying standard React optimizations like `React.memo` to ensure module variables and properties match the CJS format.
