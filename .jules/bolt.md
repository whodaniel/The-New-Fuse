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

## 2026-03-03 - O(n) Array Loops in High-Frequency Input Handlers
**Learning:** Functions evaluating entirely new object arrays (`groupMessagesByDate`) or wrapping items blindly (`MessageGroup`) can unintentionally cause an O(n) re-evaluation block that stalls input rendering. Even though nested items (`HistoricalMessage`) were memoized, the array transformation itself on keystroke (triggered by state in parent `ChatContainer`) was a major CPU block.
**Action:** When a parent container has high-frequency updates (e.g., text inputs), always ensure derived complex arrays and mapping wrapper components are shielded with `useMemo` and `React.memo` respectively, to prevent unnecessary object instantiations from freezing the main thread.
## 2026-03-03 - Debounce Derived State Anti-pattern
**Learning:** Debouncing a value and updating a shared state object in `useEffect` works, but using `setFilters({ ...filters, search: debouncedSearchTerm })` inside an effect triggered by typing breaks programmatic external filter updates (like a "Clear Filters" button). The local state overrides the external state change because the delayed `debouncedSearchTerm` triggers an overwrite.
**Action:** Always synchronize the parent component's state downward into the local state (`useEffect(() => setSearchTerm(externalValue), [externalValue])`), and use a functional updater (`setFilters(prev => ...)`) to apply the debounced local state upward safely without breaking external modifications.
