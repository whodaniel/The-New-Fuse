# TNF Email Custodian Agent

This runbook defines how TNF provisions and delegates account access for:

- shared-hosting mailbox accounts
- ChatGPT account onboarding records

## API Endpoints

- `POST /api/a2a/email-custodian/accounts/provision`
- `GET /api/a2a/email-custodian/accounts`
- `POST /api/a2a/email-custodian/accounts/:accountId/grants`
- `GET /api/a2a/email-custodian/accounts/:accountId/grants`
- `POST /api/a2a/email-custodian/grants/:grantId/revoke`
- `POST /api/a2a/email-custodian/grants/redeem`

## Environment Variables

Required for encrypted credential storage:

- `ENCRYPTION_KEY`

Hosted email provisioning supports two transports:

### cPanel API transport (default)

- `HOSTING_CPANEL_BASE_URL` (example: `https://your-hostname:2083`)
- `HOSTING_CPANEL_USERNAME`
- `HOSTING_CPANEL_API_TOKEN`

### SSH command transport (for StackCP/HostMaria style SSH workflows)

- `HOSTING_PROVISION_TRANSPORT=ssh_command`
- `HOSTING_SSH_HOST` (example: `ssh.gb.stackcp.com`)
- `HOSTING_SSH_USERNAME` (example: `findproductsandservices.com`)
- `HOSTING_SSH_PRIVATE_KEY_PATH` (path to dedicated custodian private key)
- Optional: `HOSTING_SSH_PORT` (default `22`)
- Optional: `HOSTING_SSH_KNOWN_HOSTS_PATH`
- Optional: `HOSTING_SSH_CONNECT_TIMEOUT_MS` (default `15000`)
- Optional: `HOSTING_SSH_CREATE_MAILBOX_COMMAND_TEMPLATE`
  - Default template:
    `uapi --output=json Email add_pop email={{MAILBOX}} domain={{DOMAIN}} password={{PASSWORD}} quota={{QUOTA}}`
  - Placeholder tokens: `{{MAILBOX}}`, `{{DOMAIN}}`, `{{PASSWORD}}`,
    `{{QUOTA}}`, `{{EMAIL}}`
  - Raw (unquoted) variants also exist: `{{MAILBOX_RAW}}`, etc.
- StackCP note: the first added key can take up to 30 minutes before command
  execution is active.
- Readiness probe:
  - `HOSTING_SSH_HOST=ssh.gb.stackcp.com HOSTING_SSH_USERNAME=findproductsandservices.com HOSTING_SSH_PRIVATE_KEY_PATH=~/.ssh/tnf_hostmaria_custodian apps/api/scripts/verify-hosting-ssh.sh`

Optional for ChatGPT onboarding automation:

- `CHATGPT_SIGNUP_WEBHOOK_URL` (if omitted, ChatGPT accounts are stored as
  `pending_external_automation`)

## Security Model

1. Credentials are stored encrypted in PostgreSQL (`agent_managed_accounts`).
2. Worker access is delegated through time-bound grant tokens
   (`agent_managed_account_grants`).
3. Grant tokens are stored as SHA-256 hashes, not plaintext.
4. Plain credentials are only returned from `grants/redeem` with valid token +
   matching `granteeAgentId`.
5. SSH mode uses key-based auth with strict host checking; avoid password SSH
   automation.

## Recommended Operational Policy

1. Restrict provisioning endpoints to admins or `email_custodian:manage`.
2. Keep grant expiry short (hours, not days).
3. Revoke grants immediately after task completion.
4. Rotate account passwords regularly and reissue grants.
