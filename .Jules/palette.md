## 2024-11-20 - Global Header Missing ARIA Labels
**Learning:** Found that the primary navigation header (`apps/frontend/src/components/layout/Header/index.tsx`) relied on visual icons (Bell, User) without `aria-label` attributes.
**Action:** Always ensure `Button` components from `ui` library with `size="icon"` include `aria-label` for screen reader accessibility.
