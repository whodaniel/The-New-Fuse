# 📄 Complete Page Inventory

**Source of Truth**: File System Audit + Router Configuration **Date**:
2025-12-08

## 1. Public / Marketing

- `/` - **Landing Page V2 (New)**
  (`apps/frontend/src/pages/landing-v2/index.tsx`)
- `/landing` - Legacy Landing (`apps/frontend/src/pages/Landing.tsx`)
- `/landing-page` - Legacy Landing Alt
  (`apps/frontend/src/pages/LandingPage.tsx`)
- `/simple-landing` - Minimal Landing
  (`apps/frontend/src/pages/SimpleLanding.tsx`)

## 2. Authentication

- `/auth/login` - Login (`apps/frontend/src/pages/auth/Login.tsx`)
- `/auth/register` - Register (`apps/frontend/src/pages/auth/Register.tsx`)
- `/auth/forgot-password` - Forgot Password
  (`apps/frontend/src/pages/auth/ForgotPassword.tsx`)
- `/auth/sso` - SSO (`apps/frontend/src/pages/auth/SSO.tsx`)
- `/auth/google-callback` - OAuth Callback
  (`apps/frontend/src/pages/auth/GoogleCallback.tsx`)

## 3. Core App (Dashboard)

- `/dashboard` - Dashboard Home (`apps/frontend/src/pages/dashboard/index.tsx`)
- `/dashboard/analytics` - Analytics
  (`apps/frontend/src/pages/dashboard/Analytics.tsx`)
- `/dashboard/settings` - Dashboard Settings
  (`apps/frontend/src/pages/dashboard/Settings.tsx`)
- `/analytics` - Main Analytics
  (`apps/frontend/src/pages/dashboard/Analytics.tsx`)
- `/ai-portal` - AI Portal (`apps/frontend/src/pages/AIAgentPortal/index.tsx`)
- `/settings` - Global Settings (`apps/frontend/src/pages/Settings.tsx`)
  - Includes: `/settings/appearance`, `/settings/security`, `/settings/api`

## 4. Agents & Chat

- `/agents` - All Agents (`apps/frontend/src/pages/Agents/AgentsPage.tsx`)
- `/agents/new` - Create Agent
  (`apps/frontend/src/pages/Agents/UnifiedAgentCreator.tsx`)
- `/agents/:id` - Agent Detail (`apps/frontend/src/pages/Agents/Detail.tsx`)
- `/chat` - Basic Chat (`apps/frontend/src/pages/chat/ChatPage.tsx`)
- `/multi-agent-chat` - Advanced Chat
  (`apps/frontend/src/pages/MultiAgentChat.tsx`)
- `/memory/:agentId` - Memory Inspector
  (`apps/frontend/src/pages/MemoryInspector.tsx`)

## 5. Workflows

- `/workflows` - Workflows List (`apps/frontend/src/pages/Workflows.tsx`)
- `/workflows/builder` - Visual Builder
  (`apps/frontend/src/pages/workflow-pages/WorkflowBuilder.tsx`)
- `/workflows/templates` - Templates
  (`apps/frontend/src/pages/workflow-pages/Templates.tsx`)
- `/workflows/execution` - Execution Monitor
  (`apps/frontend/src/pages/workflow-pages/Execution.tsx`)
- `/workflows/:id` - Workflow Detail
  (`apps/frontend/src/pages/workflow-pages/Detail.tsx`)

## 6. Workspace & Teams

- `/workspace/overview` - Overview
  (`apps/frontend/src/pages/workspace/Overview.tsx`)
- `/workspace/analytics` - Team Analytics
  (`apps/frontend/src/pages/workspace/WorkspaceAnalytics.tsx`)
- `/workspace/members` - Members
  (`apps/frontend/src/pages/workspace/Members.tsx`)
- `/workspace/chat` - Team Chat
  (`apps/frontend/src/pages/WorkspaceChat/index.tsx`)

## 7. Tasks

- `/tasks` - Task List (`apps/frontend/src/pages/Tasks/TasksPage.tsx`)
- `/tasks/new` - New Task (`apps/frontend/src/pages/Tasks/New.tsx`)
- `/tasks/:id` - Task Detail (`apps/frontend/src/pages/Tasks/Detail.tsx`)
- `/tasks/:id/edit` - Edit Task (`apps/frontend/src/pages/Tasks/Edit.tsx`)

## 8. Suggestions

- `/suggestions` - Suggestions (`apps/frontend/src/pages/Suggestions/index.tsx`)
- `/suggestions/new` - New Suggestion
  (`apps/frontend/src/pages/Suggestions/New.tsx`)
- `/suggestions/:id` - Detail (`apps/frontend/src/pages/Suggestions/Detail.tsx`)

## 9. Admin Console

- `/admin` - Admin Panel (`apps/frontend/src/pages/Admin/index.tsx`)
- `/admin/users` - User Mgmt
  (`apps/frontend/src/pages/Admin/UserManagement.tsx`)
- `/admin/security` - Security
  (`apps/frontend/src/pages/Admin/SecurityDashboard.tsx`)
- `/admin/monitoring` - Monitoring
  (`apps/frontend/src/pages/Admin/SystemMonitoring.tsx`)
- `/admin/features` - Feature Flags
  (`apps/frontend/src/pages/Admin/FeatureFlags.tsx`)
- `/admin/port-management` - Port Mgmt
  (`apps/frontend/src/pages/Admin/PortManagement.tsx`)
- `/admin/system-health` - Health
  (`apps/frontend/src/pages/Admin/SystemHealth.tsx`)
- `/admin/agent-skills` - Skills
  (`apps/frontend/src/pages/Admin/Agents/skills.tsx`)
- `/admin/web-search` - Search Config
  (`apps/frontend/src/pages/Admin/Agents/WebSearchSelection/index.tsx`)

## 10. Web3

- `/nft/marketplace` - Marketplace
  (`apps/frontend/src/pages/web3/NFTMarketplace.tsx`)

## 11. Resources & Libraries

- `/resources` - Dashboard
  (`apps/frontend/src/pages/Resources/ResourcesDashboard.tsx`)
- `/profile` - User Profile
  (`apps/frontend/src/components/profile/UserProfilePage.tsx`)

## 12. Dev & Debug Tools

- `/components-showcase` - UI Library
  (`apps/frontend/src/pages/ComponentsShowcase.tsx`)
- `/frontend-showcase` - Frontend Features
  (`apps/frontend/src/pages/FrontendShowcase.tsx`)
- `/build-info` - Build Info (`apps/frontend/src/pages/BuildInfo.tsx`)
- `/debug` - Debug Info (`apps/frontend/src/pages/Debug.tsx`)
- `/debug-routing` - Route Tester (`apps/frontend/src/pages/DebugRouting.tsx`)
- `/test` - Test Page (`apps/frontend/src/pages/Test/index.tsx`)
- `/timeline-demo` - Timeline (`apps/frontend/src/pages/timeline-demo.tsx`)
- `/graph-demo` - Graph (`apps/frontend/src/pages/graph-demo.tsx`)

## 13. System Pages

- `/404` - Not Found (`apps/frontend/src/pages/404.tsx`)
- `/unauthorized` - Unauthorized (`apps/frontend/src/pages/Unauthorized.tsx`)
- `/onboarding` - Onboarding Flow
  (`apps/frontend/src/pages/OnboardingFlow/index.tsx`)
- `/legal/privacy` - Privacy (`apps/frontend/src/pages/legal/PrivacyPolicy.tsx`)
- `/legal/terms` - Terms (`apps/frontend/src/pages/legal/TermsOfService.tsx`)
