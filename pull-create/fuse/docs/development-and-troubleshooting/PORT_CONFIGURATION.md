# Port Configuration Standard

## Port Allocation Strategy

To avoid conflicts and ensure consistent development, we use the following port allocation:

### Primary Services

- **Frontend (Vite)**: 3000 - Main React application
- **Backend API**: 3001 - Main backend server
- **Database**: 5432 - PostgreSQL
- **Redis**: 6379 - Redis cache/sessions

### Development Tools

- **Storybook**: 6006 - UI component documentation
- **Dev Server**: 8080 - Additional development server
- **WebSocket**: 3002 - Real-time communication
- **Static Assets**: 8000 - Static file server

### Testing & Debug

- **Test Server**: 9000 - Testing environment
- **Debug Server**: 9001 - Debug tools
- **E2E Tests**: 9002 - End-to-end testing

## Port Conflict Resolution

1. **Automatic Port Detection**: Use `detect-port` to find available ports
2. **Graceful Fallback**: Auto-increment if primary port is busy
3. **Environment Variables**: Allow override via `.env` files
4. **Clear Messaging**: Display actual running ports to developers

## Configuration Files

All port configurations are centralized in:

- `package.json` scripts
- `vite.config.ts`
- `.env` files
- Docker configurations
