# Complete URL Map for The New Fuse (thenewfuse.com)

**Last Updated:** November 18, 2025
**Frontend Status:** ✅ Live at thenewfuse.com
**Router:** ComprehensiveRouter.tsx

---

## 🏠 Core Pages

| URL | Description | Component |
|-----|-------------|-----------|
| `/` | Landing Page (Professional) | Home.tsx |
| `/home` | Home Page | Home.tsx |
| `/dashboard` | Main Dashboard | dashboard/index.tsx |
| `/sophisticated-hub` | Sophisticated TNF Hub | Hub/SophisticatedTNFHub.tsx |

## 🔐 Authentication

| URL | Description | Component |
|-----|-------------|-----------|
| `/login` | Login Page | auth/Login.tsx |
| `/register` | Registration | auth/Register.tsx |
| `/auth` | Auth Index | auth/index.tsx |
| `/auth/login` | Auth Login | auth/Login.tsx |
| `/auth/register` | Auth Register | auth/Register.tsx |
| `/auth/forgot-password` | Password Reset Request | auth/ForgotPassword.tsx |
| `/auth/reset-password` | Password Reset | auth/ResetPassword.tsx |
| `/auth/sso` | SSO Login | auth/SSO.tsx |
| `/auth/google-callback` | Google OAuth Callback | auth/GoogleCallback.tsx |
| `/auth/oauth-callback` | OAuth Callback | auth/OAuthCallback.tsx |

## 🤖 AI Agents

| URL | Description | Component |
|-----|-------------|-----------|
| `/ai-portal` | AI Agent Portal | AIAgentPortal.tsx |
| `/ai-agents` | AI Agents Page | AIAgentPortal.tsx |
| `/agent-builder` | Unified Agent Creator | Agents/UnifiedAgentCreator.tsx |
| `/agent-management` | Agent Management | Agents/AgentsPage.tsx |
| `/agents` | Agents List | Agents/AgentsPage.tsx |
| `/agents/new` | Create New Agent | Agents/UnifiedAgentCreator.tsx |
| `/agents/:id` | Agent Detail | Agents/Detail.tsx |
| `/agents/nft-marketplace` | NFT Marketplace | Agents/NFTMarketplacePage.tsx |
| `/agents/revenue-dashboard` | Revenue Dashboard | Agents/RevenueDashboardPage.tsx |
| `/agents/unified-creator` | Unified Agent Creator | Agents/UnifiedAgentCreator.tsx |
| `/multi-agent-chat` | Multi-Agent Chat | MultiAgentChat.tsx |
| `/chat` | Chat Page | chat/ChatPage.tsx |
| `/chat-page` | Chat Page Alternative | chat/ChatPage.tsx |

## 🔄 Workflows

| URL | Description | Component |
|-----|-------------|-----------|
| `/workflows` | Workflows List | Workflows/index.tsx |
| `/workflows/builder` | Workflow Builder | Workflows/Builder.tsx |
| `/workflows/advanced-builder` | Advanced Workflow Editor | WorkflowEditor.tsx |
| `/workflows/templates` | Workflow Templates | Workflows/Templates.tsx |
| `/workflows/executions` | Workflow Executions | Workflows/Execution.tsx |
| `/workflows/:id` | Workflow Detail | Workflows/Detail.tsx |
| `/workflows/:id/execution` | Workflow Execution Detail | Workflows/Execution.tsx |
| `/workflows-enhanced` | Enhanced Workflows | WorkflowsEnhanced.tsx |
| `/workflows/detail` | Workflow Detail Page | Workflows/Detail.tsx |
| `/workflows/execution` | Workflow Execution Page | Workflows/Execution.tsx |

## ✅ Tasks

| URL | Description | Component |
|-----|-------------|-----------|
| `/tasks` | Tasks List | Tasks/TasksPage.tsx |
| `/tasks/new` | Create New Task | Tasks/New.tsx |
| `/tasks/:id` | Task Detail | Tasks/Detail.tsx |
| `/tasks/:id/edit` | Edit Task | Tasks/Edit.tsx |
| `/tasks-page` | Tasks Page Alternative | Tasks/TasksPage.tsx |

## 🏢 Workspace

| URL | Description | Component |
|-----|-------------|-----------|
| `/workspace` | Workspace Index | workspace/index.tsx |
| `/workspace/overview` | Workspace Overview | workspace/Overview.tsx |
| `/workspace/analytics` | Workspace Analytics | workspace/WorkspaceAnalytics.tsx |
| `/workspace/members` | Workspace Members | workspace/Members.tsx |
| `/workspace/settings` | Workspace Settings | workspace/Settings.tsx |
| `/workspace-chat` | Workspace Chat | WorkspaceChat.tsx |
| `/workspace/chat` | Workspace Chat Alternative | WorkspaceChat.tsx |
| `/workspace/layout` | Workspace Layout | workspace/WorkspaceLayout.tsx |

## 📊 Dashboard & Analytics

| URL | Description | Component |
|-----|-------------|-----------|
| `/analytics` | Analytics Dashboard | dashboard/Analytics.tsx |
| `/dashboard/analytics` | Dashboard Analytics | dashboard/Analytics.tsx |
| `/dashboard/agents` | Agent Dashboard | dashboard/AgentDashboard.tsx |
| `/dashboard/agents/new` | Create Dashboard Agent | dashboard/CreateAgent.tsx |
| `/dashboard/agents/:id` | Dashboard Agent Detail | Agents/Detail.tsx |
| `/dashboard/settings` | Dashboard Settings | dashboard/DashboardSettings.tsx |

## ⚙️ Settings

| URL | Description | Component |
|-----|-------------|-----------|
| `/settings` | Main Settings | Settings.tsx |
| `/settings/general` | General Settings | GeneralSettings.tsx |
| `/settings/appearance` | Appearance Settings | settings/Appearance.tsx |
| `/settings/notifications` | Notification Settings | settings/Notifications.tsx |
| `/settings/security` | Security Settings | settings/Security.tsx |
| `/settings/api` | API Settings | settings/API.tsx |
| `/general-settings` | General Settings Alt | GeneralSettings.tsx |
| `/general-settings/embedding` | Embedding Preferences | GeneralSettings/EmbeddingPreference.tsx |
| `/general-settings/community-hub` | Community Hub | Community/CommunityHub.tsx |
| `/workspace-settings/llm-selection` | LLM Selection | WorkspaceSettings/ChatSettings/WorkspaceLLMSelection.tsx |
| `/workspace-settings/chat-model` | Chat Model Selection | WorkspaceSettings/ChatSettings/WorkspaceLLMSelection.tsx |
| `/workspace-settings/agent-model` | Agent Model Selection | WorkspaceSettings/AgentConfig/AgentModelSelection.tsx |

## 👨‍💼 Admin

| URL | Description | Component |
|-----|-------------|-----------|
| `/admin` | Admin Panel | Admin/AdminPanel.tsx |
| `/admin/users` | User Management | Admin/UserManagement.tsx |
| `/admin/system-health` | System Health | Admin/SystemHealth.tsx |
| `/admin/feature-flags` | Feature Flags | Admin/FeatureFlags.tsx |
| `/admin/port-management` | Port Management | Admin/PortManagement.tsx |
| `/admin/workspaces` | Workspace Management | Admin/WorkspaceManagement.tsx |
| `/admin/settings` | Admin Settings | Admin/AdminSettings.tsx |
| `/admin/onboarding` | Admin Onboarding | Admin/Onboarding.tsx |
| `/admin/dashboard` | Admin Dashboard | Admin/Dashboard.tsx |
| `/admin/experimental-features` | Experimental Features | Admin/ExperimentalFeatures/features.tsx |
| `/admin/agents/skills` | Agent Skills Management | Admin/Agents/skills.tsx |
| `/admin/agents/web-search` | Web Search Selection | Admin/Agents/WebSearchSelection.tsx |

## 💡 Suggestions

| URL | Description | Component |
|-----|-------------|-----------|
| `/suggestions` | Suggestions List | Suggestions/index.tsx |
| `/suggestions/new` | Create New Suggestion | Suggestions/New.tsx |
| `/suggestions/:id` | Suggestion Detail | Suggestions/Detail.tsx |

## 🎨 Components & Demos

| URL | Description | Component |
|-----|-------------|-----------|
| `/components` | Components Showcase | ComponentsShowcase.tsx |
| `/components-showcase` | Components Showcase Alt | ComponentsShowcase.tsx |
| `/components-nav` | Components Navigation | ComponentsNav.tsx |
| `/timeline-demo` | Timeline Demo | timeline-demo.tsx |
| `/graph-demo` | Graph Demo | graph-demo.tsx |
| `/frontend-showcase` | Frontend Showcase | FrontendShowcase.tsx |
| `/layout-example` | Layout Examples | Layout/LayoutExamples.tsx |
| `/simple-test` | Simple Test Page | SimpleTest.tsx |

## 🔧 Development & Debug

| URL | Description | Component |
|-----|-------------|-----------|
| `/debug` | Debug Page | Debug.tsx |
| `/debug-routing` | Debug Routing | DebugRouting.tsx |
| `/build-info` | Build Information | BuildInfo.tsx |
| `/all-pages` | All Pages List | AllPages.tsx |
| `/test` | Test Page | Test.tsx |

## 🚀 Landing & Marketing

| URL | Description | Component |
|-----|-------------|-----------|
| `/landing` | Landing Index | Landing/index.tsx |
| `/landing-page` | Alternative Landing | LandingPage.tsx |
| `/simple-landing` | Simple Landing | SimpleLanding.tsx |
| `/home-page` | Home Page Alt | Home.tsx |
| `/onboarding` | Onboarding Flow | OnboardingFlow/index.tsx |

## ⚖️ Legal

| URL | Description | Component |
|-----|-------------|-----------|
| `/legal/privacy` | Privacy Policy | legal/PrivacyPolicy.tsx |
| `/legal/terms` | Terms of Service | legal/TermsOfService.tsx |

## 👁️ Preview

| URL | Description | Component |
|-----|-------------|-----------|
| `/preview/onboarding` | Onboarding Preview | preview/OnboardingPreview.tsx |

## 👤 User & Community

| URL | Description | Component |
|-----|-------------|-----------|
| `/main` | Main Page | Main/index.tsx |
| `/user/profile` | User Profile | profile/UserProfilePage.tsx |
| `/unauthorized` | Unauthorized Page | Unauthorized.tsx |

## ❌ Error Pages

| URL | Description | Component |
|-----|-------------|-----------|
| `/not-found` | 404 Page | NotFound.tsx |
| `/404` | 404 Page | NotFound.tsx |
| `*` | 404 Catch-all | 404 Component |

---

## 📝 Notes

- **Total Unique Routes:** 100+
- **Router Type:** React Router v6 with lazy loading
- **Authentication:** Protected routes require login
- **Performance:** Lazy-loaded components with Suspense
- **Navigation:** SmartNavigation component for global nav

## 🎯 Priority Pages

These are the most important pages for users:

1. **/** - Landing Page (first impression!)
2. **/dashboard** - Main user dashboard
3. **/agents** - AI agent management
4. **/workflows** - Workflow builder
5. **/chat** - Multi-agent chat interface

---

## 🔗 API Endpoints (Referenced but not routes)

These are API paths, not frontend routes:
- `/api/admin/database`
- `/api/admin/features`
- `/package/dashboard`
- `/package/login`
- `/package/agents`
- `/package/workflows`
- `/html/*` - HTML prototype routes

---

**Generated by:** Claude Code
**Source:** apps/frontend/src/ComprehensiveRouter.tsx
