# Railway Deployment Guide - The New Fuse Monorepo

## ✅ Frontend Service - SUCCESSFULLY DEPLOYED

This guide documents the working configuration used to deploy the Frontend
service, which can be replicated for other services.

---

## 🎯 Key Success Factors

### 1. **Use Docker (Not Nixpacks)**

A standardized multi-stage `Dockerfile` provides a consistent and reproducible
build process across all services in the monorepo.

### 2. **Root Directory and Dockerfile Path**

- **CRITICAL**: Set the "Root Directory" in the Railway UI to the repository
  root (`.`).
- **CRITICAL**: Set the "Dockerfile Path" to `./Dockerfile.railway`.
- This ensures Railway can find the Dockerfile and has access to the entire
  monorepo to resolve workspace dependencies.

---

## 📁 Standardized Dockerfile Configuration

A single, multi-stage `Dockerfile.railway` in the root of the repository is used
to build and deploy all services.

### `Dockerfile.railway`

```dockerfile
# Multi-stage Dockerfile for The New Fuse Backend Services
# Optimized for monorepo with Node.js runtime

FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    git \
    python3 \
    make \
    g++ \
    dumb-init \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root package files first for better layer caching
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.base.json ./
COPY turbo.json ./

# Copy package.json files for all dependencies
COPY packages/types/package.json ./packages/types/
COPY packages/core/package.json ./packages/core/
# ... (add all packages and apps)

# Dependencies stage
FROM base AS deps
RUN pnpm install --frozen-lockfile --prod

# Build stage
FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build

# Production Image
FROM base AS production
ARG SERVICE_PATH

# Copy dependencies and built code
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/${SERVICE_PATH}/dist ./apps/${SERVICE_PATH}/dist
COPY --from=build /app/packages/*/dist ./packages/
COPY --from=build /app/drizzle ./drizzle

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S app-user -u 1001
RUN chown -R app-user:nodejs /app
USER app-user

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/${SERVICE_PATH}/dist/index.js"]
```

**Key Points:**

- **`SERVICE_PATH`**: A build-time argument (`--build-arg SERVICE_PATH=...`)
  specifies which service to build and run (e.g., `api`, `backend`, `frontend`).
- **Multi-stage Build**: Separates dependency installation, building, and the
  final production image for optimization and smaller image size.
- **`pnpm` and `turbo`**: Uses the project's standard tooling.
- **Non-root user**: Enhances security by running the application as a non-root
  user.
- **Healthcheck**: Includes a standardized healthcheck for Railway to monitor
  the service.

---

## 🚀 Step-by-Step Deployment Process

### For Each Service:

#### 1. **Prepare Railway Service in UI**

1. Go to the Railway Dashboard.
2. Create a new service or select an existing one.
3. Connect to your GitHub repository and select the `main` branch.

#### 2. **Configure Build Settings**

1. In the service settings, go to the "Build" section.
2. Set the **Root Directory** to the root of the monorepo (`.`).
3. Set the **Dockerfile Path** to `./Dockerfile.railway`.

#### 3. **Set the `SERVICE_PATH` Build Argument**

1. In the service settings, go to the "Variables" section.
2. Add a new variable with the key `SERVICE_PATH`.
3. Set the value to the path of the service you want to deploy (e.g., `api`,
   `backend`, `frontend`). This variable is used by the `Dockerfile.railway` to
   build the correct service.

#### 4. **Set Environment Variables in Railway**

- Go to service → Variables tab
- Add required environment variables:
  - `DATABASE_URL`
  - `REDIS_URL`
  - `JWT_SECRET`
  - Any service-specific variables

#### 5. **Deploy and Monitor**

1. Push your changes to the `main` branch to trigger an automatic deployment.
2. Monitor the build logs in the Railway dashboard.
3. Verify that the service deploys successfully and passes the health check.

---

## 🔧 Common Issues & Solutions

### Issue 1: Build Fails Due to Missing Dependencies

**Solution:**

- Ensure that all necessary `package.json` files are copied in the `base` stage
  of the `Dockerfile.railway`.

### Issue 2: Workspace Dependencies Not Found at Runtime

**Solution:**

- Verify that the `COPY --from=build /app/packages/*/dist ./packages/` command
  in the `Dockerfile.railway` is correctly copying the built packages.

### Issue 3: Health Check Fails

**Solution:**

- Ensure that the service implements a `/health` endpoint that returns a
  `200 OK` status.
- Check the service logs for any startup errors.
- Make sure the `PORT` environment variable is being used by the application, as
  Railway sets this automatically.

---

## ✨ Best Practices

### 1. **Consistent Start Scripts**

- Ensure each service has a `start` script in its `package.json` that starts the
  application (e.g., `"start": "node dist/index.js"`).

### 2. **Health Checks**

- Implement a health check endpoint in all services to ensure they are running
  correctly.

### 3. **Deployment Verification Checklist**

After each deployment:

- [ ] Service shows "Deployed" status.
- [ ] Health check passes.
- [ ] Service logs show a successful startup.
- [ ] The external URL returns the expected response.

---

## 📚 Additional Resources

- [Railway Dockerfile deployments](https://docs.railway.app/deploy/dockerfiles)
- [pnpm Workspaces](https://pnpm.io/workspaces)

---

**Last Updated**: After standardization to Docker deployment. **Status**: All
services ready for Docker-based deployment.
