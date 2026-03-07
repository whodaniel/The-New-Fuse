# Pages by Functional Purpose in The New Fuse

This document organizes pages by their functional purpose in the application, helping to understand user journeys and workflows.

## User Entry Points

- LandingPage (`./packages/frontend/src/pages/LandingPage.tsx`)
- Login (`./packages/frontend/src/pages/Login.tsx`)
- Register (`./apps/frontend/src/pages/auth/Register.tsx`)

## Authentication & Authorization

- Login (`./apps/frontend/src/pages/auth/Login.tsx`)
- Register (`./apps/frontend/src/pages/auth/Register.tsx`)
- ForgotPassword (`./apps/frontend/src/pages/auth/ForgotPassword.tsx`)
- ResetPassword (`./apps/frontend/src/pages/auth/ResetPassword.tsx`)
- SSO (`./apps/frontend/src/pages/auth/SSO.tsx`)
- GoogleCallback (`./apps/frontend/src/pages/auth/GoogleCallback.tsx`)
- OAuthCallback (`./apps/frontend/src/pages/auth/OAuthCallback.tsx`)
- Unauthorized (`./apps/frontend/src/pages/Unauthorized.tsx`)

## Core Application

- Dashboard (`./packages/frontend/src/pages/Dashboard.tsx`)
- Home (`./apps/frontend/src/pages/Home.tsx`)

## Workspace Management

- WorkspaceLayout (`./apps/frontend/src/pages/workspace/WorkspaceLayout.tsx`)
- Overview (`./apps/frontend/src/pages/workspace/Overview.tsx`)
- Members (`./apps/frontend/src/pages/workspace/Members.tsx`)
- Analytics (`./apps/frontend/src/pages/workspace/Analytics.tsx`)
- Settings (`./apps/frontend/src/pages/workspace/Settings.tsx`)

## User Onboarding

- Home (`./apps/frontend/src/pages/OnboardingFlow/Steps/Home/index.jsx`)
- UserSetup (`./apps/frontend/src/pages/OnboardingFlow/Steps/UserSetup/index.jsx`)
- CreateWorkspace (`./apps/frontend/src/pages/OnboardingFlow/Steps/CreateWorkspace/index.jsx`)
- LLMPreference (`./apps/frontend/src/pages/OnboardingFlow/Steps/LLMPreference/index.jsx`)
- DataHandling (`./apps/frontend/src/pages/OnboardingFlow/Steps/DataHandling/index.jsx`)
- Survey (`./apps/frontend/src/pages/OnboardingFlow/Steps/Survey/index.jsx`)

## Configuration & Settings

### General Settings
- General (`./apps/frontend/src/pages/settings/General.tsx`)
- Notifications (`./apps/frontend/src/pages/settings/Notifications.tsx`)

### Appearance & Customization
- Appearance (`./apps/frontend/src/pages/GeneralSettings/Appearance/index.jsx`)
- CustomLogo (`./apps/frontend/src/pages/GeneralSettings/Appearance/CustomLogo/index.jsx`)
- CustomAppName (`./apps/frontend/src/pages/GeneralSettings/Appearance/CustomAppName/index.jsx`)
- ThemePreference (`./apps/frontend/src/pages/GeneralSettings/Appearance/ThemePreference/index.jsx`)
- LanguagePreference (`./apps/frontend/src/pages/GeneralSettings/Appearance/LanguagePreference/index.jsx`)

### Security & API
- Security (`./apps/frontend/src/pages/GeneralSettings/Security/index.jsx`)
- ApiKeys (`./apps/frontend/src/pages/GeneralSettings/ApiKeys/index.jsx`)
- BrowserExtensionApiKey (`./apps/frontend/src/pages/GeneralSettings/BrowserExtensionApiKey/index.jsx`)

### AI & Data Configuration
- EmbeddingPreference (`./apps/frontend/src/pages/GeneralSettings/EmbeddingPreference/index.tsx`)
- LLMPreference (`./apps/frontend/src/pages/GeneralSettings/LLMPreference/index.jsx`)
- VectorDatabase (`./apps/frontend/src/pages/GeneralSettings/VectorDatabase/index.jsx`)
- AudioPreference (`./apps/frontend/src/pages/GeneralSettings/AudioPreference/index.jsx`)
- TranscriptionPreference (`./apps/frontend/src/pages/GeneralSettings/TranscriptionPreference/index.jsx`)
- PrivacyAndData (`./apps/frontend/src/pages/GeneralSettings/PrivacyAndData/index.jsx`)

## Admin & System Management

- Dashboard (`./apps/frontend/src/pages/Admin/Dashboard.tsx`)
- Users (`./apps/frontend/src/pages/Admin/Users.tsx`)
- Workspaces (`./apps/frontend/src/pages/Admin/Workspaces.tsx`)
- SystemHealth (`./apps/frontend/src/pages/Admin/SystemHealth.tsx`)
- Settings (`./apps/frontend/src/pages/Admin/Settings.tsx`)

## Feature Pages

- AIAgentPortal (`./apps/frontend/src/pages/AIAgentPortal/index.tsx`)
- FlowPage (`./apps/frontend/src/components/flow/FlowPage.tsx`)
- TimelineDemo (`./apps/frontend/src/pages/TimelineDemo.tsx`)
- GraphDemo (`./apps/frontend/src/pages/graph-demo.tsx`)
- CommunityHub (`./apps/frontend/src/pages/GeneralSettings/CommunityHub/Trending/index.jsx`)

## Embedding & Integration

- EmbedChats (`./apps/frontend/src/pages/GeneralSettings/EmbedChats/index.jsx`)
- Chats (`./apps/frontend/src/pages/GeneralSettings/Chats/index.jsx`)
- EmbedConfigs (`./apps/frontend/src/pages/GeneralSettings/EmbedConfigs/index.jsx`)

## Error & Utility Pages

- NotFound (404) (`./apps/frontend/src/pages/404.tsx`)

## Functional Analysis

The application appears to be a comprehensive platform with:

1. **AI Integration** - Multiple pages for configuring AI models, embeddings, and vector databases
2. **Collaboration Features** - Workspace management with member controls
3. **Customization Options** - Extensive appearance and branding settings
4. **Analytics Capabilities** - Both workspace and system-level analytics
5. **Integration Options** - API keys and embedding configurations for external use

The user journey likely starts with authentication, proceeds through onboarding, and then provides access to the main dashboard and workspace features, with settings available for customization.