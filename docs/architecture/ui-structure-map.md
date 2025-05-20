# UI Structure Map

## Core UI Components
```mermaid
graph TD
    subgraph Atomic
        A[Atoms] --> Button
        A --> Input
        A --> Select
        A --> Icon
        A --> Typography

        M[Molecules] --> FormField
        M --> SearchBar
        M --> Card
        M --> DropdownMenu
        M --> Modal

        O[Organisms] --> Header
        O --> Sidebar
        O --> Navigation
        O --> Footer
    end

    subgraph Features
        F1[Agent Features] --> AgentList
        F1 --> AgentDetail
        F1 --> AgentCreator

        F2[Chat Features] --> ChatRoom
        F2 --> MessageList
        F2 --> ChatInput

        F3[Workflow Features] --> WorkflowEditor
        F3 --> WorkflowCanvas
        F3 --> NodeEditor
    end

    subgraph Pages
        P1[Main Pages] --> Dashboard
        P1 --> Login
        P1 --> Register
        P1 --> Settings

        P2[Feature Pages] --> AgentDashboard
        P2 --> ChatDashboard
        P2 --> WorkflowDashboard
    end
```

## Component Locations

### Core Components
- `/packages/ui-components/src/atoms/`
- `/packages/ui-components/src/molecules/`
- `/packages/ui-components/src/organisms/`

### Feature Components
- `/apps/frontend/src/features/agents/`
- `/apps/frontend/src/features/chat/`
- `/apps/frontend/src/features/workflow/`

### Pages
- `/apps/frontend/src/pages/`