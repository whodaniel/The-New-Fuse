# Complete Navigation Map

## Entry Points

### Public Routes
- / → LandingPage
  - /login → Login
  - /register → Register
  - /forgot-password → ForgotPassword
  - /reset-password/:token → ResetPassword

### Protected Routes (Requires Authentication)
- /dashboard → Dashboard
  └─ Navigation: Main Navigation Bar
    ├─ /workspace → WorkspaceOverview
    │  ├─ /workspace/overview → Overview
    │  ├─ /workspace/members → Members
    │  └─ /workspace/settings → WorkspaceSettings
    │
    ├─ /agents → AgentModule
    │  ├─ /agents/list → AgentList
    │  ├─ /agents/:id → AgentDetail
    │  └─ /agents/marketplace → AgentMarketplace
    │
    ├─ /analytics → AnalyticsModule
    │  ├─ /analytics/dashboard → AnalyticsDashboard
    │  ├─ /analytics/reports → Reports
    │  └─ /analytics/visualization → Visualization
    │
    ├─ /chat → ChatInterface
    │  ├─ /chat/rooms → ChatRooms
    │  ├─ /chat/room/:id → ChatRoom
    │  └─ /chat/settings → ChatSettings
    │
    ├─ /workflow → WorkflowModule
    │  ├─ /workflow/list → WorkflowList
    │  ├─ /workflow/editor/:id → WorkflowEditor
    │  └─ /workflow/templates → WorkflowTemplates
    │
    └─ /settings → SettingsModule
       ├─ /settings/profile → UserProfile
       ├─ /settings/preferences → UserPreferences
       └─ /settings/api → APISettings

## Navigation Components

### Main Navigation
- Location: components/layout/MainNavigation
- Type: Persistent sidebar
- Access: Available after authentication

### Secondary Navigation
- Location: components/layout/SecondaryNav
- Type: Context-dependent top bar
- Access: Changes based on current module

### Quick Access
- Location: components/layout/QuickAccess
- Type: Floating action button
- Access: Module-specific actions

## Module-Specific Navigation

### Workspace Module
- Entry: /workspace
- Navigation: Workspace sidebar
- Components:
  - WorkspaceNav
  - MembersList
  - SettingsPanel

### Agent Module
- Entry: /agents
- Navigation: Agent sidebar
- Components:
  - AgentList
  - AgentFilters
  - MarketplaceNav

### Analytics Module
- Entry: /analytics
- Navigation: Analytics toolbar
- Components:
  - ReportNav
  - VisualizationTools
  - DataFilters

### Chat Module
- Entry: /chat
- Navigation: Chat sidebar
- Components:
  - RoomList
  - UserList
  - ChatControls

### Workflow Module
- Entry: /workflow
- Navigation: Workflow toolbar
- Components:
  - WorkflowNav
  - TemplateSelector
  - EditorTools

## Breadcrumb Navigation
- Location: components/navigation/Breadcrumbs
- Updates dynamically based on current route
- Provides hierarchical navigation context

## Quick Actions
- Location: components/QuickActions
- Type: Context menu
- Access: Module-specific actions
- Activation: Right-click or menu button

## Navigation Guards
- AuthGuard: Protects authenticated routes
- RoleGuard: Enforces role-based access
- ModuleGuard: Ensures module availability

## Error Navigation
- 404: NotFound page with navigation suggestions
- 403: Forbidden page with authentication prompt
- 500: Error page with retry/refresh options