# MCP Integration Guide: Google Drive & Docs

## Status

The desktop `GoogleDriveWizard.tsx` UI exists, but its install/authentication steps are currently simulated. **Do not treat completion of the wizard as proof that a Google Drive MCP server is installed, authenticated, registered, or running.**

This integration must conform to `docs/protocols/USER_CONTEXT_STORAGE_MANDATE.md`.

## Architectural rule

Google Drive is a storage/capability provider beneath the TNF user-context contract. It is not the canonical registry for user context, and provider-specific agent configuration must not become the source of truth.

The active TNF profile is authoritative for the user's logical context locations:

```text
~/.tnf/profiles/<profile>.json
```

Resolve the effective storage binding with:

```bash
node scripts/user-context/resolve-storage.cjs --json
```

Configure or change the binding with:

```bash
node scripts/user-context/configure-storage.cjs \
  --strategy local-primary \
  --drive-folder-id <USER_AUTHORIZED_FOLDER_ID>
```

Never commit a real user's Drive folder ID, OAuth refresh token, credentials JSON, or personal absolute path into repository source.

## Target flow

1. **Profile** — user chooses local / Drive / mirrored strategy in TNF settings or onboarding.
2. **Binding** — user authorizes a Drive root and TNF stores only the folder binding in the user's local/private profile.
3. **Credential vault** — OAuth credentials/tokens are stored in an OS/private credential surface, not product source.
4. **Capability registration** — the Drive adapter/MCP server is registered as a capability available to TNF.
5. **Resolution** — agents request logical collections (`sources`, `memory`, `working`, `receipts`, `exports`) through the TNF resolver.
6. **Receipt** — consequential reads/writes record provider, object/path reference, time, revision/hash where available, and sensitivity.

## Required Rust/Tauri commands

The desktop backend still needs real implementations for the current wizard. At minimum:

### `install_mcp_server`

- Input: vetted adapter package/repository identifier and target directory.
- Action: install/build the approved Drive adapter.
- Security: do not blindly clone arbitrary URLs supplied by untrusted content.

### `save_credentials`

Prefer an OS credential/keychain-backed implementation. If a file is unavoidable, write it to a user-private application-data directory with restrictive permissions. Never place it in the repository or a shared Drive folder.

### `start_auth_process`

- Start the approved Drive adapter in authorization mode.
- Capture and present the authorization URL.
- Keep the process bounded and observable.

### `submit_auth_code` / OAuth callback handling

- Complete authorization.
- Persist tokens only in the private credential surface.
- Verify token usability before declaring the provider ready.

### `verify_drive_binding`

- Resolve the active TNF profile.
- Verify the configured Drive root exists and is accessible with the authorized account.
- Return a receipt containing Drive folder ID, observation time, and provider revision metadata where available.

## TNF registration

Do **not** use a provider-specific path such as `~/.gemini/.../mcp_config.json` as the canonical user-context registry.

If an MCP config must be generated for a particular harness, generate it as a projection from TNF's profile/capability state. The projection may differ by harness, but the user-context binding must remain identical.

The repository-level `data/mcp_config.json` describes TNF system MCP capabilities. User-specific Drive bindings belong in the private TNF profile/credential layer.

## Logical Drive layout

Once a user authorizes a Drive root, preserve the same collection semantics as local storage:

```text
TNF User Context/
  <profile>/
    profile/
    sources/
    memory/
    working/
    receipts/
    exports/
```

Agents should use the logical mapping returned by `resolve-storage.cjs`; this display layout is not permission to guess a folder ID.

## UI failure policy

Until the backend commands are actually wired:

- label install/auth operations as preview/simulation;
- do not display "server is running" or "authentication successful" based only on timers;
- do not fabricate `token.json` success messages;
- fail closed when a binding cannot be verified;
- surface the exact missing capability to the user.

## Verification checklist

A Google Drive setup is complete only when all are true:

1. active TNF profile resolves successfully;
2. Drive strategy/binding is present when requested;
3. OAuth credential is stored privately;
4. adapter/MCP process is actually running or the web-side Drive capability is reachable;
5. configured root can be read;
6. a test receipt can be written/read in the user's `receipts` collection;
7. the same logical source root is returned to core fleet agents and inherited swarms unless an authorized scoped override exists.
