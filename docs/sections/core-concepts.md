# Core Concepts

## Workflow System
[→ Understand Workflows](../../vitereact/src/pages/docs/core-concepts/workflows.mdx)

### Node Types
The workflow system supports various node types for different operations:

#### API Nodes
API nodes handle external service integration with the following features:
- Visual representation with status indicators
- Multiple connection points (input, success output, error output)
- Support for common HTTP methods
- URL preview and configuration
- Error handling capabilities

Key characteristics:
- Left handle: Input connection point
- Right handle: Success/Response output
- Bottom handle: Error output channel
- Visual feedback for node selection
- Method and URL display

### Node Styling
Nodes follow a consistent visual language:
- Color coding for different node types (e.g., blue for API nodes)
- Selection indicators with blue ring
- Consistent padding and rounded corners
- Clear typography hierarchy
- Status and configuration previews