# AI Coder Instructions for The New Fuse Platform

## Overview
This document provides comprehensive instructions for AI coders to help implement, correct, perfect, and finish the UI components and pages for The New Fuse platform. The goal is to ensure all aspects are fully functional, fully featured, and properly integrated.

## Project Structure
The New Fuse is a TypeScript-based React application structured as a monorepo with multiple packages:
- `apps/frontend`: Main React application
- `packages/ui-consolidated`: Shared UI components
- `packages/hooks`: Shared React hooks
- `packages/types`: TypeScript type definitions
- `packages/api`: API client and services
- `packages/database`: Database models and services

## Core Principles
1. **Consistency**: Maintain consistent styling, naming conventions, and patterns across all components and pages
2. **Type Safety**: Ensure comprehensive TypeScript type definitions for all components, hooks, and services
3. **Modularity**: Create reusable components that can be shared across different pages
4. **Performance**: Implement lazy loading, code splitting, and performance optimizations
5. **Accessibility**: Ensure all components meet WCAG 2.1 AA standards
6. **Responsive Design**: All pages should work well on desktop, tablet, and mobile devices

## Required Pages to Implement

### Authentication & User Management
- **Login**: Email/password login with "Remember me" option
- **Register**: New user registration with email verification
- **Forgot Password**: Password reset flow
- **Email Verification**: Verify email address
- **Profile**: View and edit user profile
- **Account Settings**: Manage account settings, preferences, and security

### Dashboard & Analytics
- **Main Dashboard**: Overview of system status, recent activities, and key metrics
- **Analytics Dashboard**: Detailed analytics and insights
- **Activity Log**: History of user and system activities
- **Notifications Center**: View and manage notifications

### Agent Management
- **Agents List**: View all agents with filtering and sorting
- **Agent Details**: View detailed information about a specific agent
- **Create Agent**: Create a new agent with configuration options
- **Edit Agent**: Modify an existing agent's configuration
- **Agent Monitoring**: Real-time monitoring of agent activities
- **Agent Logs**: View logs for a specific agent
- **Agent Marketplace**: Browse and install pre-built agents

### Task Management
- **Tasks List**: View all tasks with filtering and sorting
- **Task Details**: View detailed information about a specific task
- **Create Task**: Create a new task with assignment options
- **Edit Task**: Modify an existing task
- **Task Board**: Kanban-style board for task management
- **Task Calendar**: Calendar view of scheduled tasks
- **Task Reports**: Generate reports on task completion and performance

### Workflow Management
- **Workflows List**: View all workflows
- **Workflow Details**: View detailed information about a specific workflow
- **Workflow Builder**: Visual interface for creating and editing workflows
- **Workflow Execution**: Monitor and control workflow execution
- **Workflow Templates**: Browse and use pre-built workflow templates

### Feature Suggestions
- **Suggestions List**: View all feature suggestions with filtering and sorting
- **Suggestion Details**: View detailed information about a specific suggestion
- **Create Suggestion**: Submit a new feature suggestion
- **Edit Suggestion**: Modify an existing suggestion
- **Voting Interface**: Vote on suggestions
- **Comments**: Comment on suggestions

### Integration & API
- **API Keys**: Manage API keys
- **Webhooks**: Configure and manage webhooks
- **Integrations**: Set up and manage third-party integrations
- **API Documentation**: Interactive API documentation
- **API Explorer**: Test API endpoints

### Administration
- **User Management**: Manage users, roles, and permissions
- **Team Management**: Create and manage teams
- **System Settings**: Configure system-wide settings
- **Audit Logs**: View system audit logs
- **Usage Statistics**: Monitor system usage and resource consumption
- **Billing & Subscription**: Manage billing information and subscription plans

### Help & Support
- **Documentation**: User guides and documentation
- **Tutorials**: Interactive tutorials and walkthroughs
- **FAQ**: Frequently asked questions
- **Support Tickets**: Create and manage support tickets
- **Community Forum**: Community discussions and knowledge sharing

## Implementation Guidelines

### Component Structure
1. Each page should be in its own directory under `apps/frontend/src/pages`
2. Complex pages should be broken down into smaller components
3. Shared components should be moved to `packages/ui-consolidated`
4. Use the following structure for page components:
   ```
   pages/
     PageName/
       index.tsx         # Main page component
       components/       # Page-specific components
       hooks/            # Page-specific hooks
       utils/            # Page-specific utilities
       types.ts          # Page-specific types
   ```

### State Management
1. Use React Context for global state
2. Use React Query for server state management
3. Implement proper loading, error, and empty states for all data-dependent components

### Routing
1. Use React Router for navigation
2. Implement nested routes for complex page hierarchies
3. Add route guards for authenticated routes
4. Implement breadcrumbs for navigation

### API Integration
1. Create service classes for API calls
2. Use React Query for data fetching, caching, and synchronization
3. Implement proper error handling for API calls
4. Add retry logic for failed requests

### Form Handling
1. Use React Hook Form for form management
2. Implement form validation using Zod or Yup
3. Create reusable form components
4. Add proper error messages and validation feedback

### Authentication & Authorization
1. Implement JWT-based authentication
2. Add role-based access control
3. Secure routes and API calls
4. Handle session expiration and token refresh

### Testing
1. Write unit tests for all components using Jest and React Testing Library
2. Add integration tests for complex workflows
3. Implement end-to-end tests for critical user journeys
4. Test for accessibility compliance

### Performance Optimization
1. Implement code splitting and lazy loading
2. Optimize bundle size
3. Add virtualization for long lists
4. Implement memoization for expensive computations

### Accessibility
1. Ensure proper semantic HTML
2. Add ARIA attributes where necessary
3. Implement keyboard navigation
4. Test with screen readers

### Responsive Design
1. Use mobile-first approach
2. Implement responsive layouts using Flexbox and Grid
3. Add breakpoints for different screen sizes
4. Test on various devices and screen sizes

## Specific Tasks for AI Coders

### Task 1: Complete the UI Component Library
- Review and enhance all UI components in `packages/ui-consolidated`
- Ensure all components have proper TypeScript types
- Add missing variants and props to existing components
- Create missing components identified during page implementation
- Add comprehensive documentation and examples

### Task 2: Implement Authentication Flow
- Create login, register, and forgot password pages
- Implement JWT authentication with token refresh
- Add protected routes and authentication guards
- Integrate with backend authentication API

### Task 3: Build Dashboard Pages
- Implement main dashboard with key metrics and visualizations
- Create analytics dashboard with charts and graphs
- Add activity log and notification center
- Implement real-time updates for dashboard data

### Task 4: Develop Agent Management System
- Create agents list page with filtering and sorting
- Implement agent details page with monitoring capabilities
- Build agent creation and configuration forms
- Add agent marketplace for pre-built agents

### Task 5: Implement Task Management System
- Create tasks list page with filtering and sorting
- Implement task details page with comments and activity log
- Build task creation and editing forms
- Add Kanban board and calendar views

### Task 6: Develop Workflow Builder
- Create visual workflow builder interface
- Implement workflow execution and monitoring
- Add workflow templates and sharing capabilities
- Integrate with agent and task management systems

### Task 7: Build Feature Suggestions System
- Create suggestions list page with voting and filtering
- Implement suggestion details page with comments
- Build suggestion creation and editing forms
- Add voting and commenting functionality

### Task 8: Implement Administration Pages
- Create user and team management interfaces
- Implement system settings and configuration pages
- Add audit logs and usage statistics
- Build billing and subscription management

### Task 9: Develop Help and Support Center
- Create documentation and tutorial pages
- Implement FAQ and knowledge base
- Build support ticket system
- Add community forum integration

### Task 10: Ensure Cross-Cutting Concerns
- Implement comprehensive error handling
- Add loading states and skeleton screens
- Ensure responsive design across all pages
- Implement accessibility features
- Add analytics and telemetry

## Integration Points

### Backend Integration
- Connect all pages to appropriate API endpoints
- Implement proper error handling for API calls
- Add retry logic and offline support
- Ensure data consistency across pages

### Authentication Integration
- Integrate with authentication service
- Implement token management and refresh
- Add role-based access control
- Handle session expiration gracefully

### Real-time Updates
- Implement WebSocket connections for real-time data
- Add push notifications for important events
- Update UI in response to real-time events
- Handle connection loss and reconnection

### Third-party Integrations
- Implement OAuth flows for third-party services
- Add webhook configuration and management
- Integrate with external APIs
- Ensure secure handling of API keys and tokens

## Testing and Quality Assurance

### Unit Testing
- Write unit tests for all components and utilities
- Ensure high test coverage
- Test edge cases and error scenarios
- Mock external dependencies

### Integration Testing
- Test interactions between components
- Verify data flow through the application
- Test form submissions and API interactions
- Ensure proper state management

### End-to-End Testing
- Test critical user journeys
- Verify authentication flows
- Test complex workflows
- Ensure cross-browser compatibility

### Accessibility Testing
- Test with screen readers
- Verify keyboard navigation
- Check color contrast and text size
- Ensure WCAG 2.1 AA compliance

## Deployment and CI/CD

### Build Process
- Optimize bundle size
- Implement code splitting
- Add source maps for debugging
- Configure environment-specific builds

### Continuous Integration
- Set up automated testing
- Implement linting and type checking
- Add bundle size monitoring
- Configure dependency scanning

### Continuous Deployment
- Set up automated deployment
- Implement feature flags
- Add rollback capabilities
- Configure monitoring and alerting

## Final Checklist

Before considering a page or component complete, ensure:

1. ✅ All features are fully implemented
2. ✅ TypeScript types are comprehensive and accurate
3. ✅ Unit tests are written and passing
4. ✅ The component is responsive on all screen sizes
5. ✅ Accessibility requirements are met
6. ✅ Error states are properly handled
7. ✅ Loading states are implemented
8. ✅ Empty states are designed and implemented
9. ✅ The component is properly documented
10. ✅ The component is integrated with the rest of the application

## Resources

### Design System
- Use the established design system in `packages/ui-consolidated`
- Follow the color palette, typography, and spacing guidelines
- Maintain consistent component styling

### API Documentation
- Refer to the API documentation for endpoint details
- Use the provided service classes for API calls
- Follow established patterns for data fetching and mutation

### TypeScript Types
- Use the types defined in `packages/types`
- Create new types as needed
- Ensure proper type safety throughout the application

### Testing Utilities
- Use Jest and React Testing Library for testing
- Leverage the provided test utilities and helpers
- Follow established testing patterns

## Collaboration Guidelines

### Code Reviews
- Review code for correctness, performance, and maintainability
- Ensure adherence to project standards and guidelines
- Provide constructive feedback and suggestions

### Documentation
- Document all components, hooks, and utilities
- Add inline comments for complex logic
- Update documentation when making changes

### Communication
- Clearly communicate design decisions and trade-offs
- Ask for clarification when requirements are unclear
- Share knowledge and insights with the team

## Conclusion

By following these guidelines, we can ensure that The New Fuse platform is implemented to the highest standards of quality, performance, and user experience. Each AI coder should focus on their assigned tasks while maintaining awareness of the overall system architecture and integration points.

Remember that the goal is to create a cohesive, intuitive, and powerful platform that enables users to effectively manage AI agents, tasks, and workflows.
