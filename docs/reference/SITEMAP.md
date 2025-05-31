# The New Fuse - Application Sitemap

This document provides a comprehensive sitemap of The New Fuse application, showing the hierarchical structure of all pages and their relationships.

## Main Navigation Structure

- **Home** (`/`) - Landing page for authenticated users
  - **Dashboard** (`/dashboard`) - Main dashboard
    - **Agents** (`/dashboard/agents`) - Agent management
      - **Agent Details** (`/dashboard/agents/:id`) - Individual agent details
      - **New Agent** (`/dashboard/agents/new`) - Create new agent
    - **Analytics** (`/dashboard/analytics`) - Dashboard analytics
    - **Settings** (`/dashboard/settings`) - Dashboard settings
  
  - **Workspace** (`/workspace`) - Workspace management
    - **Overview** (`/workspace/overview`) - Workspace overview
    - **Analytics** (`/workspace/analytics`) - Workspace analytics
    - **Members** (`/workspace/members`) - Workspace members
    - **Settings** (`/workspace/settings`) - Workspace settings
    - **Chat** (`/workspace/chat`) - Workspace chat

  - **AI Agent Portal** (`/ai-agent-portal`) - AI agent management
    - **Agent Marketplace** (`/ai-agent-portal/marketplace`) - Discover agents
    - **Agent Creation Studio** (`/ai-agent-portal/create`) - Create agents
    - **Agent Training Arena** (`/ai-agent-portal/training`) - Train agents
    - **Agent Workflow Manager** (`/ai-agent-portal/workflows`) - Manage agent workflows

  - **Settings** (`/settings`) - Application settings
    - **General** (`/settings/general`) - General settings
    - **Embedding Preferences** (`/settings/embedding-preferences`) - AI embedding preferences

  - **Admin** (`/admin`) - Administration panel (admin users only)
    - **Dashboard** (`/admin/dashboard`) - Admin dashboard
    - **Users** (`/admin/users`) - User management
    - **Workspaces** (`/admin/workspaces`) - Workspace management
    - **System Health** (`/admin/system-health`) - System health monitoring
    - **Settings** (`/admin/settings`) - Admin settings
    - **Agents** (`/admin/agents`) - Agent management
      - **Skills** (`/admin/agents/skills`) - Agent skills configuration
    - **Experimental Features** (`/admin/experimental-features`) - Experimental features

## Authentication Pages

- **Login** (`/auth/login`) - User login
- **Register** (`/auth/register`) - User registration
- **Forgot Password** (`/auth/forgot-password`) - Password recovery
- **Reset Password** (`/auth/reset-password`) - Password reset
- **SSO** (`/auth/sso`) - Single Sign-On
- **OAuth Callback** (`/auth/oauth-callback`) - OAuth callback
- **Google Callback** (`/auth/google-callback`) - Google OAuth callback

## Legal Pages

- **Privacy Policy** (`/legal/privacy-policy`) - Privacy policy
- **Terms of Service** (`/legal/terms-of-service`) - Terms of service

## Utility Pages

- **404 Not Found** (`/404`) - 404 error page
- **Unauthorized** (`/unauthorized`) - Unauthorized access page
- **Timeline Demo** (`/timeline-demo`) - Timeline demonstration
- **Graph Demo** (`/graph-demo`) - Graph visualization demonstration

## Feature Pages

- **Chat Room** (`/chat-room`) - Chat interface
- **Prompt Workbench** (`/prompt-workbench`) - Prompt engineering workbench
- **Knowledge Base Editor** (`/knowledge-base-editor`) - Knowledge base editing
- **Memory Dashboard** (`/memory-dashboard`) - Memory management
- **Performance Dashboard** (`/performance-dashboard`) - Performance metrics
- **Moderation Dashboard** (`/moderation-dashboard`) - Content moderation
- **Video Chat** (`/video-chat`) - Video chat interface
- **YouTube Transcriber** (`/youtube-transcriber`) - YouTube transcription tool
