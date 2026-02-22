# Port Management - The New Fuse

## Standardized Port Configuration

The New Fuse uses standardized ports across all services to ensure consistent development and deployment:

### Standard Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React development server (Vite) |
| Backend API | 3001 | Express.js API server |
| WebSocket | 3002 | Real-time communication |
| Drizzle Studio | 5555 | Database management UI |
| Preview | 4173 | Production preview build |

## Development Scripts

### Clean Development Start
```bash
pnpm run dev
```
- Automatically clears ports before starting
- Launches Vite dev server on port 3000
- Shows clear feedback about port status

### Manual Port Clearing
```bash
pnpm run clear-ports
```
- Clears all standard ports manually
- Useful for troubleshooting port conflicts

### Force Clean Start
```bash
pnpm run dev:clean
```
- Clears ports + forces Vite to rebuild cache
- Use when experiencing build cache issues

## Port Clearing Features

The port clearing script (`scripts/clear-ports.js`):

✅ **Automatic Detection** - Finds processes using standard ports  
✅ **Safe Termination** - Gracefully kills blocking processes  
✅ **Clear Feedback** - Shows exactly what ports were cleared  
✅ **Error Handling** - Continues even if some processes can't be killed  

## Environment Configuration

Set custom ports via environment variables:

```bash
# .env file
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3002
VITE_FRONTEND_URL=http://localhost:3000
```

## Troubleshooting

### Port Already in Use
The dev script automatically handles this - no manual intervention needed.

### Permission Errors
On some systems, you may need elevated permissions:
```bash
sudo pnpm run clear-ports
```

### Custom Ports
To use different ports, update:
1. `src/config/ports.ts` - Standard port definitions
2. `.env` - Environment variables
3. `scripts/clear-ports.js` - Ports to clear array

## Integration

The port configuration is centralized in `src/config/ports.ts` and used throughout:
- API calls automatically use correct backend URL
- WebSocket connections use standardized WS port  
- Development tools reference consistent ports
- Navigation links point to correct server status

This ensures the entire application uses consistent, predictable ports across all environments.