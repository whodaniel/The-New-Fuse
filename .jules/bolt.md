# Bolt's Journal

## 2026-02-20 - Broken Dependencies Block Testing
**Learning:** `apps/frontend/src/hooks/useWebSocket.ts` imports `@your-org/security/react` which is missing, and `../services/websocket.service` which doesn't exist (should be `WebSocketService`). This prevents `vitest` from running tests even if the hook is mocked, due to import analysis.
**Action:** When testing components using this hook, `vi.mock` alone is insufficient if the file is parsed. A temporary fix or environment alias is needed. The optimization can be verified by temporarily fixing the import, then reverting.

## 2026-02-20 - Inline Component Re-renders in Long Lists
**Learning:** Defining inline components like `MessageBubble` inside the parent component `MultiAgentChatUI` causes O(n) re-renders. Every keystroke triggers a render of the parent, which creates a new reference for the inline component, invalidating all existing rendered instances in the list even if their props didn't change.
**Action:** Extract list item components outside of their parent component and wrap them with `React.memo` to ensure list items only re-render when their explicit props (like `msg` and `agents`) change, vastly improving performance in input-heavy parent components.

## 2024-03-09 - React.memo Shallow Comparison vs Reference Props
**Learning:** Extracting an item inside a list map to `React.memo` effectively limits re-renders, but the shallow comparison will still fail if new references (like dynamically evaluated props) are passed. For example, passing `slug` from `useParams()` just to compute `workspace.slug === slug` down in the child meant `slug` still changed when the user routed anywhere, invalidating the memo cache for every list item.
**Action:** When extracting components to prevent list O(n) re-renders, pre-compute primitive comparisons in the map loop (like passing a boolean `isActive={workspace.slug === slug}`) rather than passing down unstable values like route path strings or complex object references.
