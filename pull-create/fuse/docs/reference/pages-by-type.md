# Pages by File Type in The New Fuse

This document organizes all pages by their file type (TSX vs JSX) to provide a different perspective on the codebase structure.

## TypeScript Pages (TSX)

### Main Pages
- LandingPage (`./packages/frontend/src/pages/LandingPage.tsx`)
- Dashboard (`./packages/frontend/src/pages/Dashboard.tsx`)
- Login (`./packages/frontend/src/pages/Login.tsx`)
- Home (`./apps/frontend/src/pages/Home.tsx`)
- NotFound (`./apps/frontend/src/pages/404.tsx`)
- Unauthorized (`./apps/frontend/src/pages/Unauthorized.tsx`)
- TimelineDemo (`./apps/frontend/src/pages/TimelineDemo.tsx`)
- GraphDemo (`./apps/frontend/src/pages/graph-demo.tsx`)

### Auth Pages
- Login (`./apps/frontend/src/pages/auth/Login.tsx`)
- Register (`./apps/frontend/src/pages/auth/Register.tsx`)
- ForgotPassword (`./apps/frontend/src/pages/auth/ForgotPassword.tsx`)
- ResetPassword (`./apps/frontend/src/pages/auth/ResetPassword.tsx`)
- SSO (`./apps/frontend/src/pages/auth/SSO.tsx`)
- GoogleCallback (`./apps/frontend/src/pages/auth/GoogleCallback.tsx`)
- OAuthCallback (`./apps/frontend/src/pages/auth/OAuthCallback.tsx`)

### Workspace Pages
- WorkspaceLayout (`./apps/frontend/src/pages/workspace/WorkspaceLayout.tsx`)
- Overview (`./apps/frontend/src/pages/workspace/Overview.tsx`)
- Members (`./apps/frontend/src/pages/workspace/Members.tsx`)
- Analytics (`./apps/frontend/src/pages/workspace/Analytics.tsx`)
- Settings (`./apps/frontend/src/pages/workspace/Settings.tsx`)

### Admin Pages
- Dashboard (`./apps/frontend/src/pages/Admin/Dashboard.tsx`)
- Users (`./apps/frontend/src/pages/Admin/Users.tsx`)
- Workspaces (`./apps/frontend/src/pages/Admin/Workspaces.tsx`)
- SystemHealth (`./apps/frontend/src/pages/Admin/SystemHealth.tsx`)
- Settings (`./apps/frontend/src/pages/Admin/Settings.tsx`)

### Settings Pages
- General (`./apps/frontend/src/pages/settings/General.tsx`)
- Notifications (`./apps/frontend/src/pages/settings/Notifications.tsx`)
- EmbeddingPreference (`./apps/frontend/src/pages/GeneralSettings/EmbeddingPreference.tsx`)

### Component Pages
- EnhancedTimelineView (`./apps/frontend/src/features/timeline/components/EnhancedTimelineView.tsx`)
- KnowledgeGraphViewer (`./apps/frontend/src/components/wizard/KnowledgeGraphViewer.tsx`)
- WorkflowStepViewer (`./packages/ui-components/src/features/workflow/components/WorkflowStepViewer.tsx`)
- PageHeader (`./packages/layout/components/PageHeader.tsx`)
- FlowPage (`./apps/frontend/src/components/flow/FlowPage.tsx`)

## JavaScript Pages (JSX)

### General Settings Pages
- Appearance (`./apps/frontend/src/pages/GeneralSettings/Appearance/index.jsx`)
- ApiKeys (`./apps/frontend/src/pages/GeneralSettings/ApiKeys/index.jsx`)
- Security (`./apps/frontend/src/pages/GeneralSettings/Security/index.jsx`)
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

### Onboarding Flow Pages
- Home (`./apps/frontend/src/pages/OnboardingFlow/Steps/Home/index.jsx`)
- UserSetup (`./apps/frontend/src/pages/OnboardingFlow/Steps/UserSetup/index.jsx`)
- CreateWorkspace (`./apps/frontend/src/pages/OnboardingFlow/Steps/CreateWorkspace/index.jsx`)
- LLMPreference (`./apps/frontend/src/pages/OnboardingFlow/Steps/LLMPreference/index.jsx`)
- DataHandling (`./apps/frontend/src/pages/OnboardingFlow/Steps/DataHandling/index.jsx`)
- Survey (`./apps/frontend/src/pages/OnboardingFlow/Steps/Survey/index.jsx`)

## Migration Status

The codebase appears to be in the process of migrating from JavaScript (JSX) to TypeScript (TSX). The main application structure and core pages are already in TypeScript, while some feature-specific pages (especially in the settings and onboarding areas) are still in JavaScript.

This organization can help developers understand which parts of the application might need migration attention in future development efforts.