# @the-new-fuse/client

Client SDK for The New Fuse API.

## Installation

```bash
pnpm add @the-new-fuse/client
```

## Usage

```typescript
import { FuseClient } from '@the-new-fuse/client';

const client = new FuseClient({ apiKey: 'your-key' });
const users = await client.users.list();
```

## Features

- Type-safe API client
- Authentication handling
- Automatic retry logic
- Request/response interceptors

## Build

```bash
pnpm build
```
