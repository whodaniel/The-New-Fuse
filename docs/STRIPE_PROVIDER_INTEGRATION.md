# TNF Stripe Provider Integration

The New Fuse (TNF) provides a bridge for the **Stripe Agentic Provisioning Protocol (APP)**. This allows other developers and projects managed by the Stripe Projects CLI to provision TNF agent clusters and relay nodes directly from their terminal.

## Architecture

TNF acts as a **Resource Provider**. When a developer runs:
```bash
stripe projects add local/tnf --url http://localhost:19001
```
The CLI communicates with the TNF Bridge to discover available services and provision resources.

## Stages Supported

### 1. Catalog (`GET /provisioning/catalog`)
Lists TNF-specific service kinds:
- **`tnf-agent-cluster`**: Provision a new agent swarm with dedicated relay orchestration.
- **`tnf-relay-server`**: Stand up a secure WebSocket relay node.

### 2. Plan (`POST /provisioning/plans`)
Validates provisioning configurations and provides a metadata preview.

### 3. Provision (`POST /provisioning/resources`)
Triggering this stage returns core TNF connection variables:
- `TNF_RELAY_URL`
- `TNF_API_ENDPOINT`
- `TNF_PROVISIONED_RESOURCE_ID`

### 4. Output Sync (`GET /provisioning/resources/:id/outputs`)
The Stripe CLI automatically syncs these variables into the consuming project's `.env` file via `stripe projects sync`.

## Running the Bridge

To start the TNF Stripe Provider Bridge locally:
```bash
pnpm run stride:bridge
```

## Environment Variables
- `STRIPE_PROVIDER_PORT`: Defaults to `19001`
- `RELAY_URL`: Target relay for provisioned resources
- `API_BASE_URL`: Target API endpoint for provisioned resources
- `STRIPE_PROJECT_WEBHOOK_SECRET`: Required for production signature verification
