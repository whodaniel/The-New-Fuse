# Design System Implementation Plan

## Overview

This document outlines the comprehensive plan to implement the complete design
system across all pages in The New Fuse application.

## Current Status

### ✅ Completed

- [x] Design system CSS created (`design-system.css`)
- [x] Design system components created (`design-system.tsx`)
- [x] Landing page redesigned (`LandingRedesigned.tsx`)
- [x] Design system CSS imported in `globals.css`
- [x] Framer Motion errors fixed

### ❌ Incomplete

- [ ] `/agents/new` - Missing StandardLayout and design system components
- [ ] `/tasks/new` - Missing StandardLayout and design system components
- [ ] All other protected pages need design system integration

## Design System Components Available

### Layout Components

- `StandardLayout` - Main layout wrapper with header, sidebar, footer
- `LandingHeader` - Header for landing pages
- `LandingFooter` - Footer for landing pages

### UI Components

- `Button` - With variants: primary, secondary, outline, ghost, link
- `Card` - With variants: default, glass, gradient
- `GlassCard` - Glassmorphism effect cards
- `Badge` - Status and category badges
- `Alert` - Notification alerts
- `StatCard` - Statistics display cards
- `FeatureCard` - Feature showcase cards
- `AnimatedCard` - Cards with hover animations
- `LoadingSpinner` - Loading indicators
- `ProgressBar` - Progress indicators
- `Toast` - Toast notifications
- `Modal` - Modal dialogs
- `Tabs` - Tabbed interfaces

### Design Tokens

- Color system (primary, secondary, success, warning, danger)
- Typography system (font sizes, weights, line heights)
- Spacing system (xs, sm, md, lg, xl, xxl, xxxl)
- Border radius (sm, md, lg, xl, full)
- Box shadows (sm, md, lg, xl, 2xl)
- Transitions (fast, normal, slow, extra-slow)
- Z-index layers

## Implementation Priority

### Phase 1: Critical Pages (Week 1)

1. **`/agents/new`** - Agent creation page
   - Wrap with `StandardLayout`
   - Replace basic cards with `GlassCard`
   - Use design system `Button` components
   - Add proper spacing and typography
   - Implement animations

2. **`/tasks/new`** - Task creation page
   - Wrap with `StandardLayout`
   - Use design system form components
   - Add `GlassCard` for sections
   - Implement proper validation UI

3. **`/dashboard`** - Main dashboard
   - Wrap with `StandardLayout`
   - Use `StatCard` for metrics
   - Implement `GlassCard` for widgets
   - Add animations and transitions

### Phase 2: Agent Management (Week 2)

4. **`/agents`** - Agent list page
5. **`/agents/:id`** - Agent detail page
6. **`/multi-agent-chat`** - Multi-agent chat interface

### Phase 3: Task Management (Week 2)

7. **`/tasks`** - Task list page
8. **`/tasks/:id`** - Task detail page
9. **`/tasks/:id/edit`** - Task edit page

### Phase 4: Workflow Pages (Week 3)

10. **`/workflows`** - Workflow list
11. **`/workflows/builder`** - Workflow builder
12. **`/workflows/templates`** - Workflow templates
13. **`/workflows/execution`** - Workflow execution
14. **`/workflows/:id`** - Workflow detail

### Phase 5: Admin Pages (Week 3)

15. **`/admin/panel`** - Admin panel
16. **`/admin/users`** - User management
17. **`/admin/security`** - Security dashboard
18. **`/admin/monitoring`** - System monitoring
19. **`/admin/features`** - Feature flags
20. **`/admin/port-management`** - Port management
21. **`/admin/system-health`** - System health
22. **`/admin/agent-skills`** - Agent skills
23. **`/admin/web-search`** - Web search settings

### Phase 6: Additional Pages (Week 4)

24. **`/workspace/overview`** - Workspace overview
25. **`/workspace/analytics`** - Workspace analytics
26. **`/workspace/members`** - Workspace members
27. **`/workspace/chat`** - Workspace chat
28. **`/suggestions`** - Suggestions list
29. **`/suggestions/new`** - New suggestion
30. **`/suggestions/:id`** - Suggestion detail
31. **`/resources`** - Resources dashboard
32. **`/profile`** - User profile
33. **`/components-showcase`** - Component showcase
34. **`/frontend-showcase`** - Frontend showcase

## Implementation Checklist for Each Page

### 1. Layout Structure

- [ ] Import `StandardLayout` from `@/components/layout/StandardLayout`
- [ ] Wrap page content with `StandardLayout`
- [ ] Set appropriate `title` and `subtitle`
- [ ] Configure `breadcrumbs` for navigation
- [ ] Set `showSidebar`, `showHeader`, `showFooter` props

### 2. Component Migration

- [ ] Replace `<div className="card">` with `<Card>` or `<GlassCard>`
- [ ] Replace `<button>` with `<Button variant="...">`
- [ ] Replace custom badges with `<Badge variant="...">`
- [ ] Replace custom alerts with `<Alert variant="...">`
- [ ] Use `<StatCard>` for statistics
- [ ] Use `<FeatureCard>` for features

### 3. Styling Updates

- [ ] Remove inline styles
- [ ] Use design system CSS variables
- [ ] Apply utility classes from design-system.css
- [ ] Use Tailwind classes for layout
- [ ] Add proper spacing with design tokens
- [ ] Implement responsive design

### 4. Animations

- [ ] Add `.fade-in` class to main content
- [ ] Use `.animation-delay-*` for staggered animations
- [ ] Add hover effects to interactive elements
- [ ] Implement loading states with `<LoadingSpinner>`

### 5. Accessibility

- [ ] Add proper ARIA labels
- [ ] Ensure keyboard navigation
- [ ] Add focus states
- [ ] Use semantic HTML
- [ ] Add screen reader text where needed

### 6. Performance

- [ ] Lazy load heavy components
- [ ] Optimize images
- [ ] Use React.memo for expensive components
- [ ] Implement proper error boundaries

## Example Implementation

### Before (Basic Page)

```tsx
export const AgentsPage = () => {
  return (
    <div className="container">
      <h1>Agents</h1>
      <div className="grid">
        <div className="card">
          <h3>Agent 1</h3>
          <p>Description</p>
          <button>View</button>
        </div>
      </div>
    </div>
  );
};
```

### After (Design System)

```tsx
import { StandardLayout } from '@/components/layout/StandardLayout';
import { GlassCard, Button, Badge } from '@/components/ui/design-system';

export const AgentsPage = () => {
  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Agents', path: '/agents' },
  ];

  return (
    <StandardLayout
      title="AI Agents"
      subtitle="Manage your intelligent agents"
      breadcrumbs={breadcrumbs}
      showSidebar={true}
      showHeader={true}
      showFooter={true}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 fade-in">
        <GlassCard className="p-6 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Agent 1</h3>
            <Badge variant="success">Active</Badge>
          </div>
          <p className="text-muted-foreground mb-4">Description</p>
          <Button variant="primary" size="md">
            View Details
          </Button>
        </GlassCard>
      </div>
    </StandardLayout>
  );
};
```

## Testing Checklist

For each updated page:

- [ ] Visual regression test
- [ ] Responsive design test (mobile, tablet, desktop)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance test (Lighthouse score > 90)
- [ ] Cross-browser test (Chrome, Firefox, Safari, Edge)
- [ ] Dark mode test
- [ ] Animation smoothness test

## Success Metrics

- **Visual Consistency**: All pages use the same design tokens
- **Component Reuse**: 90%+ of UI uses design system components
- **Performance**: Lighthouse score > 90 for all pages
- **Accessibility**: WCAG 2.1 AA compliance
- **Developer Experience**: Reduced development time for new pages
- **User Experience**: Consistent, polished, professional interface

## Next Steps

1. **Immediate**: Start with `/agents/new` and `/tasks/new` (highest priority)
2. **Week 1**: Complete Phase 1 (Critical Pages)
3. **Week 2**: Complete Phase 2 & 3 (Agent & Task Management)
4. **Week 3**: Complete Phase 4 & 5 (Workflows & Admin)
5. **Week 4**: Complete Phase 6 (Additional Pages)
6. **Ongoing**: Maintain design system, add new components as needed

## Resources

- Design System Documentation: `/docs/DESIGN_SYSTEM_DOCUMENTATION.md`
- Design System CSS: `/apps/frontend/src/styles/design-system.css`
- Design System Components: `/apps/frontend/src/components/ui/design-system.tsx`
- StandardLayout: `/apps/frontend/src/components/layout/StandardLayout.tsx`
- Example Implementation: `/apps/frontend/src/pages/LandingRedesigned.tsx`

---

**Last Updated**: 2025-12-08 **Version**: 1.0.0 **Status**: In Progress
