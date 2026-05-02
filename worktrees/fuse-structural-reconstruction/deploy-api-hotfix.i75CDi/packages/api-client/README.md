# @the-new-fuse/api-client

HTTP client for The New Fuse API.

## Installation

```bash
pnpm add @the-new-fuse/api-client
```

## Usage

```typescript
import { ApiClient } from '@the-new-fuse/api-client';

const client = new ApiClient({ baseUrl: 'https://api.thenewfuse.com' });
```

## Features

- Axios-based HTTP client
- Request/response interceptors
- Authentication handling
- Error handling

## Build

```bash
pnpm build
```
