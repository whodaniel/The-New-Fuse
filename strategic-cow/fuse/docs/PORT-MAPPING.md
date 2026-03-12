# The New Fuse - Port Mapping Reference

## Current Port Allocation (Post-Conflict Resolution)

| Port     | Service             | URL                                                               | Purpose                     | Status       |
| -------- | ------------------- | ----------------------------------------------------------------- | --------------------------- | ------------ |
| **3000** | Frontend Dev Server | `http://localhost:3000`                                           | React/Vite development      | ✅ Active    |
| **8080** | API Gateway         | `http://localhost:8080`                                           | **Unified API Entry Point** | 🆕 **NEW**   |
| **3001** | Backend API         | `http://localhost:3001`                                           | Core business logic         | ✅ Active    |
| **3002** | Webhooks Service    | `http://localhost:3002`                                           | Event ingestion             | 📍 **Moved** |
| **5173** | Vite Preview        | `http://localhost:5173`                                           | Production preview          | 🔒 Reserved  |
| **5555** | Database UI         | `http://localhost:5555`                                           | Drizzle Studio              | 🔒 Reserved  |
| **6379** | Redis               | `redis://default:<YOUR_REDIS_PASSWORD>@<REDIS_HOST>:<REDIS_PORT>` | Cache/Sessions              | 🔒 Reserved  |
| **5432** | PostgreSQL          | `postgresql://localhost:5432`                                     | Database                    | 🔒 Reserved  |

## Development Workflow

### ✅ **Recommended: Unified Architecture**

```bash
# Start API Gateway + Frontend
pnpm run dev:unified

# Access Points:
# - Frontend: http://localhost:3000
# - All APIs: http://localhost:8080/v1/*
# - Documentation: http://localhost:8080/docs
```

### 🏗️ **Alternative: Individual Services**

```bash
# Start services individually
pnpm run dev:gateway    # Port 8080
pnpm run dev:frontend   # Port 3000
pnpm run dev:api        # Port 3001
```

## API Endpoint Migration

### Before (Multiple URLs)

```
Authentication: http://localhost:3001/auth/*
Agents:        http://localhost:3001/agents
Webhooks:      http://localhost:3000/webhooks/*
Chat:          http://localhost:3004/api/chat/*
MCP:           http://localhost:3004/api/mcp/*
```

### After (Unified Gateway)

```
All APIs:      http://localhost:8080/v1/*
Documentation: http://localhost:8080/docs
Health Check:  http://localhost:8080/health

Specific endpoints:
├── /v1/auth/*       → Authentication
├── /v1/agents/*     → Agent management
├── /v1/webhooks/*   → Event ingestion
├── /v1/chat/*       → Real-time chat
└── /v1/mcp/*        → MCP servers
```

## Configuration Updates

### Frontend Environment

```env
# packages/frontend/.env
VITE_API_URL=http://localhost:8080
```

### Backend CORS

```env
# apps/backend/.env
CORS_ORIGINS="http://localhost:3000,http://localhost:8080,http://localhost:5173"
```

### API Gateway

```env
# apps/api-gateway/.env
PORT=8080
BACKEND_SERVICE_URL=http://localhost:3001
WEBHOOKS_SERVICE_URL=http://localhost:3002
```

## Health Checks

```bash
# Gateway health
curl http://localhost:8080/health

# All services status
curl http://localhost:8080/proxy/health

# Service registry
curl http://localhost:8080/proxy/services
```

## Notes

- **Port 8080**: API Gateway is the new unified entry point
- **Port 3000**: Reserved for frontend development server
- **Port 3002**: Webhooks service moved to avoid conflict with frontend
- **Port 3001**: Backend API remains unchanged
- All individual services are still accessible directly but **gateway is
  recommended**
