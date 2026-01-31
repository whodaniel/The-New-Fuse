# Unified AI Marketplace Integration Guide

## Status Overview

We have successfully unified the "MCP Hub" infrastructure with "The New Fuse
Marketplace".

### 1. Components

- **The New Fuse Marketplace (`apps/api/src/modules/marketplace`)**: The
  commercial storefront.
  - **Database**: Unified schema for Skills, Prompts, Agents
    (`marketplace_assets`).
  - **Monetization**: PayPal integration for handling payments
    (`PayPalService`).
  - **UI**: `PromptBuilder` and Publish flow in Frontend.
- **Unified MCP Hub (`packages/mcp-hub`)**: The local configuration manager.
  - **Purpose**: managing tool config for Claude/Gemini.
  - **Integration**: Can be updated to pull "purchased" tools from the
    Marketplace API.
- **MCP Discovery (`packages/mcp-drs-server`)**: The search interface.
  - **Current**: Proxies requests to an external DRS API.
  - **Future**: Should proxy requests to `The New Fuse Marketplace` API to find
    assets.

### 2. Commercial Strategy (marketplace.thenewfuse.com)

The infrastructure is now ready for the `marketplace` subdomain.

- **Asset Registration**: Users create assets via `PromptBuilder` or CLI.
- **Verification**: The `isVerified` flag in the schema allows you to gate-keep
  quality.
- **Monetization**:
  - **One-Time**: Users pay via PayPal, get permanent access (recorded in
    `users_assets` join table - _to be created_).
  - **Usage-Based**: For Hosted Agents (Proxies), you track API usage and bill.
    _Recommendation: Use a helper service for metering._
- **Security**: users keep their own keys. The `mcp-hub` generates configs that
  prompt the user: `"env": { "API_KEY": "Get yours at..." }`. This avoids you
  incurring costs for their usage.

### 3. Immediate Next Steps

1.  **Dispose Previous Session**: The `packages/mcp-hub` and
    `packages/mcp-drs-server` files are present. You can safely discard the
    pending session.
2.  **Fix Invalid Grant Errors**: Check `packages/google-drive-mcp-server/.env`
    and ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are valid.
3.  **Link DRS to Marketplace**: Update `packages/mcp-drs-server/src/index.js`
    to point `API_BASE_URL` to your production Marketplace API (e.g.,
    `https://api.thenewfuse.com`).
