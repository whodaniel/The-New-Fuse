# The New Fuse Routing Structure

This document provides a comprehensive overview of the routing structure in The New Fuse application.

## Overview

The routing system in The New Fuse is organized hierarchically, with routes grouped by functionality. The main router is defined in `apps/frontend/src/Router.tsx` and is used by the application entry point in `apps/frontend/src/App.tsx`.

## Route Categories

### Public Routes

These routes are accessible to all users, regardless of authentication status:

- `/` - Landing page
- `/timeline-demo` - Timeline feature demonstration
- `/graph-demo` - Graph visualization demo
- `/terms` - Terms of service
- `/privacy` - Privacy policy
- `/help` - Help center
- `/documentation` - Documentation
- `/all-pages` - Navigation page for development

### Authentication Routes

These routes handle user authentication:

- `/auth/login` - User login
- `/auth/register` - User registration
- `/auth/forgot-password` - Password recovery
- `/auth/reset-password/:token` - Password reset
- `/auth/sso/:provider` - Single sign-on

For backward compatibility, the following routes redirect to their `/auth/` counterparts:
- `/login` → `/auth/login`
- `/register` → `/auth/register`
- `/forgot-password` → `/auth/forgot-password`

### Protected Routes

These routes require authentication to access:

#### Dashboard
- `/dashboard` - Main dashboard

#### Analytics
- `/analytics` - Analytics dashboard

#### AI Agent Portal
- `/ai-agent-portal/*` - AI agent management portal

#### Admin Section
- `/admin` - Redirects to `/admin/dashboard`
- `/admin/dashboard` - Admin dashboard
- `/admin/users` - User management
- `/admin/workspaces` - Workspace management
- `/admin/system-health` - System health monitoring
- `/admin/settings` - Admin settings

#### Settings Section
- `/settings` - Redirects to `/settings/general`
- `/settings/general` - General settings
- `/settings/appearance` - UI appearance settings
- `/settings/api` - API key management
- `/settings/security` - Security settings
- `/settings/notifications` - Notification preferences

#### Workspace Section
- `/workspace/:workspaceId` - Redirects to `/workspace/:workspaceId/overview`
- `/workspace/:workspaceId/overview` - Workspace overview
- `/workspace/:workspaceId/members` - Workspace member management
- `/workspace/:workspaceId/analytics` - Workspace analytics
- `/workspace/:workspaceId/settings` - Workspace settings

### Error Handling
- `*` - Catch-all route for 404 errors

## Route Components

The router uses several wrapper components to handle different route types:

- `MainLayout` - Provides the main application layout for all routes
- `PublicRoute` - Ensures routes are only accessible when not authenticated
- `ProtectedRoute` - Ensures routes are only accessible when authenticated
- `Suspense` - Provides loading states for lazy-loaded components

## Lazy Loading

All routes (except the landing page) use React's lazy loading to improve initial load performance. This means that route components are only loaded when needed.

## Navigation

For development and testing purposes, a comprehensive navigation page is available at `/all-pages`. This page provides links to all available routes in the application, organized by category.
