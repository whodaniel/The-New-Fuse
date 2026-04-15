# Admin Dashboard & Settings

The Admin Dashboard provides comprehensive control over The New Fuse platform,
including system configuration, user management, security settings, and external
integrations.

## Features

### System Configuration

- **Maintenance Mode**: Toggle system-wide maintenance mode.
- **Debug Mode**: Enable detailed logging for debugging.
- **Log Level**: Set the system logging verbosity.
- **Backup Frequency**: Configure automated database backups.

### Security

- **Enforce SSL**: Require secure connections.
- **MFA Enforcement**: Toggle Multi-Factor Authentication requirements.
- **Password Policy**: Define complexity rules for user passwords.

### Database

- **Connection Pool**: Configure database connection limits.
- **Query Logging**: Enable SQL query logging for performance tuning.
- **Retention**: Set data retention policies.

### Notifications

- **Email/Slack**: Toggle notification channels.
- **Alert Thresholds**: Set CPU/Memory/Disk usage alerts.

### Integrations (New!)

Manage external service connections and OAuth providers directly from the UI.

- **Gemini (Google)**: Configure OAuth Client ID, Secret, and Scopes.
- **GitHub Copilot**: set up GitHub OAuth for Copilot integration.
- **Anthropic**: Manage API Keys for Claude models.
- **OpenCode**: Configure local/remote OpenCode provider settings (API URL,
  Password, CLI Path).

## Usage

Navigate to `/admin/settings` to access these configurations. Ensure your user
has the `SUPER_ADMIN` role required to view and modify these sensitive settings.
