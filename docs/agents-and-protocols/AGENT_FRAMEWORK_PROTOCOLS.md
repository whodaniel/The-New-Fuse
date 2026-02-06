# AI Agent Framework Protocols & Handoff Procedures

## Overview

This document consolidates essential protocols and procedures for AI agents
working within The New Fuse framework, including handoff procedures, startup
checklists, and session continuity protocols.

## Master Orchestrator Handoff Protocol

### Core Handoff Principles

1. **Context Preservation**: Maintain complete understanding of project state,
   current objectives, and technical constraints
2. **Status Verification**: Confirm all systems are operational and identify any
   blocking issues
3. **Priority Assessment**: Understand immediate tasks and long-term project
   goals
4. **Framework Adherence**: Follow established patterns and architectural
   decisions

### Handoff Checklist

- [ ] Review current project status and recent changes
- [ ] Verify build system is functional (`pnpm run build:all`)
- [ ] Check service health (API, database, frontend)
- [ ] Identify any TypeScript errors or build failures
- [ ] Assess documentation currency and completeness
- [ ] Review open tasks and priorities in TODO_CHECKLIST.md
- [ ] Confirm architectural patterns are being followed

## Master Orchestrator Startup Checklist

### Initial System Verification

1. **Environment Check**
   - Verify Node.js version (v22.16.0+)
   - Confirm Bun installation (1.1.38+)
   - Check database connectivity (PostgreSQL)
   - Validate Redis connection if required

2. **Project Status Assessment**
   - Review recent commits and changes
   - Check CI/CD pipeline status
   - Verify all dependencies are installed (`pnpm install`)
   - Run health checks on all services

3. **Architecture Validation**
   - Confirm monorepo structure integrity
   - Validate package interdependencies
   - Check TypeScript configuration consistency
   - Verify API routes and endpoints

4. **Development Environment**
   - Ensure development servers can start
   - Verify hot reloading functionality
   - Check debugging capabilities
   - Validate testing frameworks

### Critical Files to Review

- `README.md` - Project overview and setup
- `TECH_SUMMARY.md` - Technical architecture
- `BUILD_COMPLETION_REPORT.md` - Current build status
- `TODO_CHECKLIST.md` - Outstanding tasks
- `TROUBLESHOOTING_GUIDE.md` - Known issues and solutions

## Session Handoff Template

### Session Context Transfer

When transferring between AI agents or starting a new session, provide:

1. **Current Project State**
   - What was just completed
   - What is currently in progress
   - What is blocked or needs attention

2. **Technical Context**
   - Recent architectural decisions
   - Active development patterns
   - Any temporary workarounds in place

3. **Immediate Priorities**
   - Critical bugs or issues
   - Pending feature implementations
   - Performance or security concerns

4. **Framework Adherence Notes**
   - Patterns being followed
   - Architectural constraints
   - Code quality standards

### Template Format

```markdown
## Session Handoff - [Date/Time]

### Completed This Session

- [List completed tasks]
- [Note any architectural improvements]
- [Document any new patterns established]

### Current Status

- Build Status: [Working/Broken/Partial]
- Active Development: [Current focus area]
- Blocking Issues: [Any impediments]

### Next Priority Actions

1. [Immediate next task]
2. [Secondary priorities]
3. [Long-term objectives]

### Technical Notes

- [Recent architectural decisions]
- [Patterns being followed]
- [Any temporary solutions that need cleanup]

### Agent Recommendations

- [Suggestions for next agent]
- [Areas requiring specific attention]
- [Preferred approaches for current objectives]
```

## Framework Protocols for AI Agents

### Code Quality Standards

1. **TypeScript First**: All new code should be TypeScript with proper typing
2. **Monorepo Patterns**: Follow established package structure and dependencies
3. **Testing**: Include tests for new functionality
4. **Documentation**: Update relevant documentation with changes

### Architectural Principles

1. **Separation of Concerns**: Maintain clear boundaries between packages
2. **API Design**: Follow RESTful principles and OpenAPI specifications
3. **Database**: Use proper ORM patterns with Drizzle
4. **State Management**: Follow established patterns for frontend state

### Communication Protocols

1. **Status Updates**: Provide clear status on all changes
2. **Error Handling**: Implement proper error boundaries and logging
3. **Performance**: Consider performance implications of changes
4. **Security**: Follow security best practices for all implementations

### Agent Collaboration Guidelines

1. **Context Sharing**: Always provide sufficient context for the next agent
2. **Documentation**: Update documentation as changes are made
3. **Testing**: Verify changes work before handoff
4. **Rollback Plans**: Note how to revert changes if needed

## Emergency Procedures

### Build Failure Recovery

1. Check recent commits for breaking changes
2. Review TypeScript errors systematically
3. Verify dependency installations
4. Check for configuration conflicts
5. Consult TROUBLESHOOTING_GUIDE.md

### Service Outage Response

1. Identify affected services
2. Check logs for error patterns
3. Verify configuration files
4. Restart services in proper order
5. Validate full system functionality

### Data Recovery

1. Assess data loss scope
2. Check available backups
3. Review database logs
4. Follow safe recovery procedures
5. Verify data integrity post-recovery

## Best Practices for Agent Handoffs

### Before Ending Session

- [ ] Commit all working changes
- [ ] Update documentation
- [ ] Run full test suite
- [ ] Document any known issues
- [ ] Prepare handoff notes

### When Starting Session

- [ ] Review previous session notes
- [ ] Verify system health
- [ ] Check for any urgent issues
- [ ] Understand current priorities
- [ ] Confirm development environment

### Continuous Improvement

- Update this document with new patterns
- Refine handoff procedures based on experience
- Share successful approaches with team
- Document lessons learned from issues

## Integration Points

### Key System Interfaces

- **MCP Servers**: Model Context Protocol for AI coordination
- **API Gateways**: RESTful service interfaces
- **Database Layer**: Drizzle ORM with PostgreSQL
- **Frontend State**: React with proper state management
- **Build System**: Bun-based monorepo with TypeScript

### External Dependencies

- **Authentication**: Auth0 or similar OAuth provider
- **Deployment**: Cloudflare Workers for serverless functions
- **Monitoring**: Health checks and performance monitoring
- **Documentation**: Markdown-based with automated generation

This framework ensures continuity, quality, and effective collaboration between
AI agents working on The New Fuse project.
