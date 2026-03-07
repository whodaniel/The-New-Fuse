<instruction>You are an expert software engineer. You are working on a WIP
branch. Please run `git status` and `git diff` to understand the changes and the
current state of the code. Analyze the workspace context and complete the
mission brief.</instruction> <workspace_context> This is a NestJS monorepo for
an AI Agent Orchestration Engine called "The New Fuse". The frontend is in
apps/frontend using React/Next.js. We have an agent system with various agent
types, statuses, and capabilities defined in the database schema.
</workspace_context> <mission_brief>

## Task: Create Agent Dashboard Component

Create a reusable Agent Dashboard component for the frontend that displays agent
status and health.

### Steps:

1. Explore the existing frontend structure:
   `ls -la apps/frontend/src/components/`
2. Check for existing agent-related components
3. Create `apps/frontend/src/components/agents/AgentDashboard.tsx`:
   - Display a grid/list of agents with their status (ACTIVE, IDLE, BUSY, ERROR,
     OFFLINE)
   - Show agent type, name, and capabilities
   - Use status-appropriate colors (green for active, yellow for idle, red for
     error, etc.)
   - Include real-time status indicators (online/offline dot)
4. Create `apps/frontend/src/components/agents/AgentCard.tsx`:
   - Individual agent card component
   - Shows agent name, type, status, last heartbeat
   - Expandable to show capabilities and config
5. Create appropriate TypeScript interfaces for Agent data
6. Add basic Tailwind/CSS styling

### Success Criteria:

- Components compile without TypeScript errors
- Clean, reusable component architecture
- Responsive design with modern styling
- Proper TypeScript types for all props </mission_brief>
