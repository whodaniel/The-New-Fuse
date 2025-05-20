# All Pages in The New Fuse

This document provides a comprehensive list of all pages found in the codebase, organized by categories.

## Main Pages

- LandingPage (`./packages/frontend/src/pages/LandingPage.tsx`)
- Dashboard (`./packages/frontend/src/pages/Dashboard.tsx`)
- Login (`./packages/frontend/src/pages/Login.tsx`)
- Home (`./apps/frontend/src/pages/Home.tsx`)
- NotFound (404) (`./apps/frontend/src/pages/404.tsx`)
- Unauthorized (`./apps/frontend/src/pages/Unauthorized.tsx`)

## Auth Pages

- Login (`./apps/frontend/src/pages/auth/Login.tsx`)
- Register (`./apps/frontend/src/pages/auth/Register.tsx`)
- ForgotPassword (`./apps/frontend/src/pages/auth/ForgotPassword.tsx`)
- ResetPassword (`./apps/frontend/src/pages/auth/ResetPassword.tsx`)
- SSO (`./apps/frontend/src/pages/auth/SSO.tsx`)
- GoogleCallback (`./apps/frontend/src/pages/auth/GoogleCallback.tsx`)
- OAuthCallback (`./apps/frontend/src/pages/auth/OAuthCallback.tsx`)

## Workspace Pages

- WorkspaceLayout (`./apps/frontend/src/pages/workspace/WorkspaceLayout.tsx`)
- Overview (`./apps/frontend/src/pages/workspace/Overview.tsx`)
- Members (`./apps/frontend/src/pages/workspace/Members.tsx`)
- Analytics (`./apps/frontend/src/pages/workspace/Analytics.tsx`)
- Settings (`./apps/frontend/src/pages/workspace/Settings.tsx`)

## Admin Pages

- Dashboard (`./apps/frontend/src/pages/Admin/Dashboard.tsx`)
- Users (`./apps/frontend/src/pages/Admin/Users.tsx`)
- Workspaces (`./apps/frontend/src/pages/Admin/Workspaces.tsx`)
- SystemHealth (`./apps/frontend/src/pages/Admin/SystemHealth.tsx`)
- Settings (`./apps/frontend/src/pages/Admin/Settings.tsx`)

## Settings Pages

- General (`./apps/frontend/src/pages/settings/General.tsx`)
- Appearance (`./apps/frontend/src/pages/GeneralSettings/Appearance/index.jsx`)
- API (`./apps/frontend/src/pages/GeneralSettings/ApiKeys/index.jsx`)
- Security (`./apps/frontend/src/pages/GeneralSettings/Security/index.jsx`)
- Notifications (`./apps/frontend/src/pages/settings/Notifications.tsx`)

## Feature Pages

- AIAgentPortal (`./apps/frontend/src/pages/AIAgentPortal/index.tsx`)
- FlowPage (`./apps/frontend/src/components/flow/FlowPage.tsx`)
- TimelineDemo (`./apps/frontend/src/pages/TimelineDemo.tsx`)
- GraphDemo (`./apps/frontend/src/pages/graph-demo.tsx`)

## Onboarding Flow Pages

- Home (`./apps/frontend/src/pages/OnboardingFlow/Steps/Home/index.jsx`)
- UserSetup (`./apps/frontend/src/pages/OnboardingFlow/Steps/UserSetup/index.jsx`)
- CreateWorkspace (`./apps/frontend/src/pages/OnboardingFlow/Steps/CreateWorkspace/index.jsx`)
- LLMPreference (`./apps/frontend/src/pages/OnboardingFlow/Steps/LLMPreference/index.jsx`)
- DataHandling (`./apps/frontend/src/pages/OnboardingFlow/Steps/DataHandling/index.jsx`)
- Survey (`./apps/frontend/src/pages/OnboardingFlow/Steps/Survey/index.jsx`)

## Component Pages

- EnhancedTimelineView (`./apps/frontend/src/features/timeline/components/EnhancedTimelineView.tsx`)
- KnowledgeGraphViewer (`./apps/frontend/src/components/wizard/KnowledgeGraphViewer.tsx`)
- WorkflowStepViewer (`./packages/ui-components/src/features/workflow/components/WorkflowStepViewer.tsx`)
- PageHeader (`./packages/layout/components/PageHeader.tsx`)

## General Settings Pages

- EmbeddingPreference (`./apps/frontend/src/pages/GeneralSettings/EmbeddingPreference/index.tsx`)
- PrivacyAndData (`./apps/frontend/src/pages/GeneralSettings/PrivacyAndData/index.jsx`)
- CommunityHub (`./apps/frontend/src/pages/GeneralSettings/CommunityHub/Trending/index.jsx`)
- TranscriptionPreference (`./apps/frontend/src/pages/GeneralSettings/TranscriptionPreference/index.jsx`)
- BrowserExtensionApiKey (`./apps/frontend/src/pages/GeneralSettings/BrowserExtensionApiKey/index.jsx`)
- EmbedChats (`./apps/frontend/src/pages/GeneralSettings/EmbedChats/index.jsx`)
- AudioPreference (`./apps/frontend/src/pages/GeneralSettings/AudioPreference/index.jsx`)
- VectorDatabase (`./apps/frontend/src/pages/GeneralSettings/VectorDatabase/index.jsx`)
- LLMPreference (`./apps/frontend/src/pages/GeneralSettings/LLMPreference/index.jsx`)
- Chats (`./apps/frontend/src/pages/GeneralSettings/Chats/index.jsx`)
- EmbedConfigs (`./apps/frontend/src/pages/GeneralSettings/EmbedConfigs/index.jsx`)

## Note

This list excludes backup files and focuses on the main application structure. The total number of unique pages in the application is significant, with:
- 89 files with Page/View/Screen in their names
- 200 page component definitions
- 238 route definitions
- 1412 pages in standard directories

For a complete list of all pages, refer to the detailed analysis results in the `page-analysis-results` directory.