1. **Understand Goal**: Improve frontend performance by eliminating O(N * M) unnecessary re-renders in `TimelineView`.
2. **Identify Bottleneck**: `TimelineView` renders vertical grid columns for each `plan` and `record` by mapping over `dateHeaders`. During dragging (`handleMouseMove` updates state continuously), the entire component re-renders, causing O(days * (plans + records)) new React elements to be created on every mouse move.
3. **Implement Fix**: Memoize `planGridBackground` and `taskGridBackground` using `React.useMemo`. Since the grid background doesn't change on drag, reusing the same element arrays allows React to completely bypass re-creating and diffing these elements during mouse move.
4. **Verification**:
   - Run linter/typecheck.
   - Run tests.
5. **Commit & PR**: Add entry to `.jules/bolt.md` about Gantt/Timeline grid rendering bottlenecks and submit PR with ⚡ Bolt format.
