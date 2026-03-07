e# AI Agent Documentation Guide

This guide outlines the documentation requirements and best practices for AI agents contributing to The New Fuse project.

## Documentation Requirements

As an AI agent contributing to The New Fuse codebase, you are **required** to:

1. **Document Implementation Plans**: Before starting significant work, document the plan in `docs/PLANS.md`.
2. **Update the Development Log**: Document all significant changes *as they are made* in `docs/DEVELOPMENT_LOG.md`, referencing the plan from `docs/PLANS.md`.
2. **Update the Site Map & Diagrams**: Update `docs/MASTER_INFORMATION_ARCHITECTURE.md` and any associated Mermaid diagrams whenever files or directories are added, removed, or significantly restructured.
3. **Update Network/Agent Maps**: Update `docs/NETWORK_MAP.md` and `docs/AGENT_MAP.md` if your changes impact network topology, agent registration, or agent capabilities. (Note: These files need to be created first).
4. **Update relevant documentation files**: Ensure that other documentation (e.g., READMEs, guides) reflects your changes.
5. **Add inline code documentation**: Include JSDoc/TSDoc comments for functions, classes, and interfaces.
6. **Create or update README files**: For new or significantly modified directories.

## Project Management Integration (Feature Suggestions & Kanban)

The New Fuse includes systems for suggesting features and tracking work (Kanban). Agents should utilize these systems as part of their workflow.

*(Details on how to interact with these systems, potentially via dedicated MCP tools, need to be added once those tools are designed/implemented. See Plan in `docs/PLANS.md`)*

## Plan Documentation (`docs/PLANS.md`)

Before embarking on significant feature development or architectural changes (often originating from the Kanban system), you must document your implementation plan.

### When to Document a Plan
- Implementing a new feature described in an issue or requirement.
- Making substantial architectural modifications.
- Undertaking significant refactoring efforts.
- Adding major new dependencies or integrations.

### How to Document a Plan
1. Add a new section to `docs/PLANS.md` with the current date and a descriptive title.
2. Clearly state the **Goal** of the plan.
3. Outline the specific **Implementation Steps** in a logical order.
4. Reference relevant issues, requirements, or design documents.
5. Obtain approval or consensus if required by the project workflow before starting implementation.

## Development Log Updates (`docs/DEVELOPMENT_LOG.md`)

The Development Log is the central record of all development activities *as they happen*. **You must update this log before submitting any changes to the codebase.**

### When to Update the Development Log

Update the log when:
- Adding new features or components
- Making significant modifications to existing code
- Refactoring code
- Fixing bugs
- Making architectural decisions
- Implementing performance improvements
- Adding or modifying dependencies

### How to Update the Development Log (`docs/DEVELOPMENT_LOG.md`)

1. Add a new entry at the top of the log (below the most recent entry).
2. Follow the template provided in the log file.
3. **Reference the relevant plan** from `docs/PLANS.md` if applicable.
4. **Link to the relevant Kanban task/issue** if applicable.
5. Be descriptive but concise about the specific changes made in this step.
6. Include links to relevant issues, PRs, or other documentation.
7. Document design decisions made *during* implementation and their rationales.
8. Note any challenges encountered and how they were addressed.
9. Suggest next steps or future improvements based on the work done. **If significant improvements or new features are identified, use the project's feature suggestion mechanism.**

## Site Map & Diagram Updates (`docs/MASTER_INFORMATION_ARCHITECTURE.md` & Mermaid Diagrams)

Maintaining an accurate representation of the codebase structure is crucial.

### When to Update the Site Map & Diagrams
- Adding new files or directories.
- Removing files or directories.
- Renaming files or directories.
- Significantly changing the purpose or relationship of existing files/directories.

### How to Update the Site Map & Diagrams
1. Modify `docs/MASTER_INFORMATION_ARCHITECTURE.md` to reflect the new structure. Ensure the textual representation is accurate.
2. Update any associated Mermaid diagrams (either embedded in the site map or linked) to visually represent the changes.
3. Ensure consistency between the textual site map and the graphical diagrams.

## Network & Agent Map Updates (`docs/NETWORK_MAP.md` & `docs/AGENT_MAP.md`)

As The New Fuse scales, understanding the network topology and agent landscape is vital. These maps provide high-level views. (Note: These files need to be created first).

### When to Update Network/Agent Maps
- Changes affecting how agents connect or are deployed (Network Map).
- Changes to agent registration, discovery, or core capabilities (Agent Map).
- Introduction of new agent types or roles (Agent Map).
- Modifications to MCP Broker, Director, or Marketplace affecting topology (Network/Agent Map).

### How to Update Network/Agent Maps
1. Update the relevant Markdown file (`docs/NETWORK_MAP.md` or `docs/AGENT_MAP.md`). If the file doesn't exist, create it using a suitable structure (e.g., sections for different environments, Mermaid diagrams).
2. Use Mermaid diagrams or other visualizations where appropriate to illustrate the topology or relationships.
3. Focus on high-level structure and interactions. Detailed implementation belongs in other documents.
4. Leverage data from monitoring, registration, or marketplace services where possible (this may require specific tools or scripts in the future).

## Code Documentation

### Inline Documentation

Use JSDoc/TSDoc comments for all:
- Functions and methods
- Classes
- Interfaces
- Complex code blocks

Example:
```typescript
/**
 * Processes a message from an agent
 * 
 * @param message - The message to process
 * @param agentId - The ID of the agent sending the message
 * @returns The processed message or null if processing failed
 * @throws {InvalidMessageError} If the message format is invalid
 */
function processAgentMessage(message: AgentMessage, agentId: string): ProcessedMessage | null {
  // Implementation
}
```

### README Files

Each significant directory should have a README.md file that explains:
- The purpose of the directory
- The components/modules contained within
- How these components interact with the rest of the system
- Any configuration or setup required
- Examples of usage (if applicable)

## Documentation Updates

When making changes to the codebase, update relevant documentation files to reflect those changes. This includes:

1. **API documentation**: If you modify APIs
2. **Architecture documentation**: If you change the system architecture
3. **User guides**: If you change user-facing features
4. **Development guides**: If you change development processes or tools

## Semi-Automated Logging

The New Fuse includes utilities to help with logging file changes:

1. **FileChangeLogger**: A utility that logs file changes to the Development Log
2. **useFileChangeLogger hook**: A React hook for logging file changes in frontend components

Use these utilities to automate parts of the logging process, but remember that automated logs should be reviewed and enhanced with context and rationale.

## Documentation Review Checklist

Before submitting changes, verify that:

- [ ] Implementation Plan (`docs/PLANS.md`) exists and was documented *before* starting work (for significant changes).
- [ ] Development Log (`docs/DEVELOPMENT_LOG.md`) has been updated, referencing the plan if applicable.
- [ ] Site Map (`docs/MASTER_INFORMATION_ARCHITECTURE.md`) and associated diagrams are updated (if structure changed).
- [ ] Network Map (`docs/NETWORK_MAP.md`) is updated (if network topology/deployment changed).
- [ ] Agent Map (`docs/AGENT_MAP.md`) is updated (if agent capabilities/registration changed).
- [ ] Inline documentation (JSDoc/TSDoc) has been added/updated.
- [ ] README files have been created/updated as needed.
- [ ] Other relevant documentation files (guides, etc.) have been updated.
- [ ] All documentation is accurate and reflects the current state of the code.
- [ ] Documentation follows the project's style and formatting guidelines.

## Importance of Documentation

Documentation is a critical part of The New Fuse project. It:
- Enables collaboration between different agents and human developers
- Preserves knowledge about the system
- Facilitates onboarding of new contributors
- Reduces the risk of knowledge loss
- Helps identify patterns and trends in development

**Remember**: Code without documentation is incomplete. Your responsibility as an AI agent extends beyond writing code to documenting it properly.

**Core Agent Instructions:** The principles outlined in this guide, particularly the workflow involving planning (`docs/PLANS.md`) before execution, logging (`docs/DEVELOPMENT_LOG.md`) during execution, and interacting with project management systems (Kanban, Feature Suggestions), should be incorporated into the core instructions (`instructions.md`) provided to AI agents working on this codebase via the Agent Context Management system (see `docs/MCP-GUIDE.md`).
