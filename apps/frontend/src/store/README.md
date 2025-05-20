# Store Documentation

This store uses Zustand for state management and is organized into slices for better maintainability and separation of concerns.

## Store Structure

The store is divided into three main slices:

### Agent Slice
Handles all agent-related state and operations:
- Managing agent list
- Selecting/deselecting agents
- Updating agent skills and status
- CRUD operations for agents

### Chat Slice
Manages chat-related state and operations:
- Active conversations
- Message history
- Real-time message updates
- Chat creation and deletion

### System Slice
Handles application-wide state:
- Loading states
- Error handling
- Global notifications

## Usage

### Using Individual Slices

```typescript
import { useAgents, useChat, useSystem } from '@/store';

// In your component
const MyComponent = () => {
  const { agents, selectedAgent, setSelectedAgent } = useAgents();
  const { chats, activeChat, sendMessage } = useChat();
  const { isLoading, error } = useSystem();

  // Use the state and actions...
};
```

### Using Store Updates Helper

```typescript
import { useStoreUpdates } from '@/store';

const MyComponent = () => {
  const { handleError, startLoading, stopLoading } = useStoreUpdates();

  const handleAsyncOperation = async () => {
    try {
      startLoading();
      // Perform async operation
      stopLoading();
    } catch (error) {
      handleError(error);
    }
  };
};
```

## Type Safety

The store is fully typed with TypeScript, providing:
- Type inference for all state values
- Type checking for all actions
- Proper error handling types
- API response type validation

## Best Practices

1. Use the selector hooks (`useAgents`, `useChat`, `useSystem`) instead of the full store when possible
2. Handle loading states and errors using the system slice
3. Use the `useStoreUpdates` hook for consistent error handling
4. Keep state updates atomic and predictable
5. Use the provided type definitions for type safety

## API Integration

The store integrates with the backend API through service layers:
- `agentService` for agent operations
- `chatService` for chat operations
- All API calls are properly typed and handle errors consistently

## Real-time Updates

The chat slice integrates with Socket.IO for real-time updates:
- Message notifications
- Agent status changes
- Typing indicators
- Connection status

## Error Handling

Errors are managed centrally through the system slice:
- API errors are caught and displayed
- Network issues are handled gracefully
- User feedback is consistent

## State Persistence

The store handles state persistence where needed:
- Chat history is maintained
- Agent preferences are saved
- System settings are preserved

## Performance

The store is optimized for performance:
- Selective re-rendering through proper selectors
- Efficient state updates
- Memoized selectors for complex computations
