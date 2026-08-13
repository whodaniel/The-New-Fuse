# Verified Doc: apps/frontend/README.md

**Category:** verified-documentation **Agent:** AGENT-DOC-ASSIMILATOR
**Timestamp:** 1774390456.0923247

## Content

# Frontend Application Structure

## Recommended File Structure

Based on the analysis of the current project, here's a recommended file
structure for the frontend application that follows best practices for React
TypeScript applications:

```
src/
├── assets/                  # Static assets like images, fonts, etc.
│   ├── fonts/
│   ├── images/
│   └── icons/
│
├── components/              # Reusable UI components
│   ├── common/              # Truly generic components used across the app
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Input/
│   │   └── ...
│   ├── layout/              # Layout components
│   │   ├── Header/
│   │   ├── Footer/
│   │   ├── Sidebar/
│   │   └── ...
│   └── features/            # Feature-specific components
│       ├── agents/          # Agent-related components
│       ├── chat/            # Chat-related components
│       ├── workflow/        # Workflow-related components
│       └── ...
│
├── contexts/                # React context providers
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── ...
│
├── hooks/                   # Custom React hooks
│   ├── useAuth.ts
│   ├── useChat.ts
│   ├── useWebSocket.ts
│   └── ...
│
├── pages/                   # Page components
│   ├── auth/                # Authentication pages
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── ...
│   ├── dashboard/           # Dashboard pages
│   ├── settings/            # Settings pages
│   ├── agents/              # Agent-related pages
│   └── ...
│
├── services/                # API services and other service layers
│   ├── api.ts               # Base API configuration
│   ├── auth.service.ts      # Authentication service
│   ├── agent.service.ts     # Agent service
│   └── ...
│
├── store/                   # State management (if using Redux or similar)
│   ├── slices/              # Redux slices or equivalent
│   ├── actions/             # Redux actions
│   └── ...
│
├── types/                   # TypeScript type definitions
│   ├── global.d.ts          # Global type declarations
│   ├── api.ts               # API-related types
│   ├── components.ts        # Component prop types
│   └── ...
│
├── utils/                   # Utility functions
│   ├── formatting.ts        # Formatting utilities
│   ├── validation.ts        # Validation utilities
│   ├── storage.ts           # Local storage utilities
│   └── ...
│
├── styles/                  # Global styles and theme configuration
│   ├── theme.ts             # Theme configuration
│   ├── global.css           # Global CSS
│   └── ...
│
├── config/                  # Application configuration
│   ├── routes.ts            # Route definitions
│   ├── constants.ts         # Application constants
│   └── ...
│
├── App.tsx                  # Main App component
├── Router.tsx               # Application routing
├── main.tsx                 # Entry point
└── index.css                # Global styles
```

## Component Structure

Each component should follow a consistent structure:

```
ComponentName/
├── index.ts                 # Export the component
├── ComponentName.tsx        # Component implementation
├── ComponentName.test.tsx   # Component tests
├── ComponentName.module.css  # Component-specific styles (if using CSS modules)
└── types.ts                 # Component-specific types (if needed)
```

## Best Practices

1. **Atomic Design Principles**: Organize components following atomic design
   principles (atoms, molecules, organisms, templates, pages).

2. **Feature-Based Organization**: Group related components, hooks, and services
   by feature when appropriate.

3. **Separation of Concerns**: Keep UI components separate from business logic.

4. **Type Safety**: Use TypeScript interfaces and types for all components and
   functions.

5. **Lazy Loading**: Implement lazy loading for routes to improve initial load
   performance.

6. **Consistent Naming**: Use consistent naming conventions throughout the
   project.

7. **Code Splitting**: Implement code splitting for large components or
   features.

8. **Testing Structure**: Maintain tests alongside the components they test.

## Migration Strategy

To migrate from the current structure to the recommended structure:

1. Start by organizing new components according to the new structure.
2. Gradually refactor existing components to fit the new structure.
3. Update imports as components are moved.
4. Ensure tests pass after each refactoring step.
5. Document the new structure for the team.

This structure provides a scalable foundation that can grow with the application
while maintaining code organization and developer productivity.

---

## Related Documentation

### Frontend Development

- [Quick Start](./QUICK_START.md) - Fast setup and development
- [Production Checklist](./PRODUCTION_CHECKLIST.md) - Production readiness
- [Performance Optimization](./PERFORMANCE_OPTIMIZATION.md) - Frontend
  performance
- [Production Optimizations](./PRODUCTION_OPTIMIZATIONS.md) - Build
  optimizations
- [All Pages List](./ALL_PAGES_LIST.md) - Complete page inventory
- [Port Management](./PORT_MANAGEMENT.md) - Port configuration

### UI/UX & Design

- [Chakra Migration Summary](./CHAKRA_MIGRATION_FINAL_SUMMARY.md) - UI library
  migration
- [Mobile Responsive Summary](./MOBILE_RESPONSIVE_SUMMARY.md) - Responsive
  design
- [Responsive Quick Reference](./RESPONSIVE_QUICK_REFERENCE.md) - Responsive
  guide
- [Design System](../../docs/DESIGN_SYSTEM_DOCUMENTATION.md) - Design system
  docs
- [UX Audit](../../docs/ui-ux/UX_AUDIT_SUMMARY.md) - UX audit report
- [UI Transformation Roadmap](./src/docs/UI_UX_TRANSFORMATION_ROADMAP.md)

### Components

- [Layout Components](./src/components/layout/README.md) - Layout system
- [Landing Components](./src/components/landing/README.md) - Landing page
  - [Usage Guide](./src/components/landing/USAGE_GUIDE.md)
- [Workflow Editor](./src/components/WorkflowEditor/README.md) - Workflow
  builder
- [Workflow Components](./src/components/workflow/README.md) - Workflow UI

### State Management

- [Store Documentation](./src/store/README.md) - State management

### Pages

- [Resources Page](./src/pages/Resources/README.md) - Resources dashboard
- [Admin Settings](./src/pages/Admin/README.md) - Admin Dashboard & Settings
  - **New**: "Integrations" tab for managing OAuth (Gemini, GitHub) and OpenCode
    provider settings.

### Architecture & Standards

- [Architecture Standards](../../docs/architecture/ARCHITECTURE_STANDARDS.md)
- [Monorepo Architecture](../../docs/architecture/MONOREPO_ARCHITECTURE.md)
- [Frontend Architecture](../../docs/architecture/)

### Backend Integration

- [Backend API](../backend/README.md) - Backend services
- [API Examples](../backend/API_EXAMPLES.md) - API usage
- [GraphQL Guide](../api/src/graphql/README.md) - GraphQL API
- [WebSocket Integration](../backend/WEBSOCKET_INTEGRATION_GUIDE.md)

### Testing

- [Testing Setup](../../docs/testing/TESTING_SETUP_COMPLETE.md)
- [E2E Testing](../../docs/testing/E2E_TEST_SUMMARY.md)
- [Testing Best Practices](../../docs/testing/BEST_PRACTICES.md)

### Deployment

- [Deployment Guide](../../docs/deployment/DEPLOYMENT_GUIDE.md)
- [Production Readiness](../../PRODUCTION_READINESS.md)
- [CloudRuntime Deployment](../../docs/deployment/CLOUD_RUNTIME_DEPLOYMENT_GUIDE.md)

### Performance

- [Performance Optimization Guide](../../docs/performance/PERFORMANCE_OPTIMIZATION_REPORT.md)
- [Performance Quick Start](../../docs/performance/PERFORMANCE_QUICK_START.md)

### Getting Started

- [Project README](../../README.md)
- [Quick Start Guide](../../QUICK_START_GUIDE.md)
- [Documentation Map](../../DOCUMENTATION_MAP.md)

## Backlinks

- [[documentation-index]]
- [[sovereign-state]]
