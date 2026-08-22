# User Context Tooling

## Resolve

```bash
node scripts/user-context/resolve-storage.cjs --json
```

Reads the active/private TNF profile and product defaults, then reports the effective provider mapping for stable logical collections.

## Configure

```bash
node scripts/user-context/configure-storage.cjs --help
```

Updates only the private user profile under `~/.tnf/profiles/`.

## Test

```bash
node --test scripts/user-context/resolve-storage.test.cjs
```

The resolver does not perform network calls. Google Drive readiness means a Drive binding is present in the profile; a real provider adapter must still verify authorization/access before a consequential Drive operation.
