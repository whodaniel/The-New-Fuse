# Backend Service

This service provides the backend API for the application.

## Setup

Ensure dependencies are installed:

```bash
pnpm install
```

## Building

The backend depends on several shared packages (`@the-new-fuse/types`, `@the-new-fuse/core`, etc.). These must be built before the backend can run in production mode.

```bash
pnpm build
```

## Running

Development:
```bash
pnpm dev
```

Production:
```bash
pnpm start:prod
```
