# Cloudflare Worker Deployment Guide

This guide explains how to deploy the Code Execution Worker to Cloudflare Workers.

## Prerequisites

- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler`)
- Cloudflare API token with Workers permissions

## Setup

1. **Login to Cloudflare**

   ```bash
   wrangler login
   ```

2. **Update Configuration**

   Edit the `wrangler.toml` file to update the following values:

   - `API_KEY`: A secure API key for authenticating requests
   - `USAGE_TRACKING`: KV namespace ID for usage tracking

   You can create a KV namespace using:

   ```bash
   wrangler kv:namespace create USAGE_TRACKING
   ```

   Then update the `wrangler.toml` file with the returned ID.

3. **Configure Environment Variables**

   For production, you should set environment variables securely:

   ```bash
   wrangler secret put API_KEY
   ```

## Deployment

### Development

To test the worker locally:

```bash
wrangler dev
```

This will start a local development server that you can use to test the worker.

### Staging

To deploy to the staging environment:

```bash
wrangler deploy --env staging
```

### Production

To deploy to the production environment:

```bash
wrangler deploy --env production
```

## Usage

Once deployed, the worker will be available at:

- Production: `https://code-execution.thefuse.workers.dev`
- Staging: `https://code-execution-staging.thefuse.workers.dev`

You can test the worker using curl:

```bash
curl -X POST \
  https://code-execution.thefuse.workers.dev \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "code": "const x = 10; const y = 20; return x + y;",
    "language": "javascript",
    "clientId": "test-client"
  }'
```

## Monitoring

You can monitor the worker using the Cloudflare Workers dashboard:

```bash
wrangler tail
```

This will show you real-time logs from the worker.

## Scaling

Cloudflare Workers automatically scale based on demand. There's no need to configure scaling manually.

## Troubleshooting

If you encounter issues with the worker, check the following:

1. **API Key**: Make sure the API key is set correctly
2. **KV Namespace**: Make sure the KV namespace is created and configured
3. **Logs**: Check the worker logs for errors
4. **Limits**: Check if you're hitting any Cloudflare Workers limits

## Security

The worker implements several security measures:

- **API Key Authentication**: All requests must include a valid API key
- **Resource Limits**: Strict limits on execution time and memory usage
- **Input Validation**: All inputs are validated before execution
- **Error Handling**: Errors are caught and reported safely

## Cost Management

Cloudflare Workers are billed based on the number of requests and the amount of CPU time used. You can monitor your usage in the Cloudflare dashboard.

The Code Execution Service implements its own billing system on top of Cloudflare Workers, which allows you to pass costs on to clients based on their resource usage.
