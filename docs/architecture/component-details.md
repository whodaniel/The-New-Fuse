# Component Implementation Details

## Core UI Components
Located in `/apps/frontend/src/shared/ui/core/`
- Button: Base button component with variants
- Card: Flexible container component
- Input: Form input elements
- Select: Dropdown selection component
- Switch: Toggle switch component
- Checkbox: Selection component
- DropdownMenu: Expandable menu component
- TypingIndicator: Chat typing status
- ThemeToggle: Theme switcher
- Sidebar: Navigation sidebar
- AppCard: Application card component
- UserIcon: User avatar component
- ChatBubble: Message bubble component

## Feature-Specific Components
Located in `/src/components/features/`

### Agent System
- AgentList: Agent management interface
- AgentDetail: Individual agent view
- AgentMetrics: Performance monitoring
- AgentWorkflow: Task management

### Chat System
- ChatRoom: Main chat interface
- RooCoderChat: Specialized coding chat
- MessageList: Chat history display
- InputPanel: Message composition

### Workflow System
- WorkflowCanvas: Main workflow editor
- NodePalette: Available node types
- ConnectionManager: Edge handling
- WorkflowControls: Editor controls

## Integration Points
- Each component supports theme customization
- Shared state management through contexts
- Standardized prop interfaces
- Consistent error handling
- Event system integration