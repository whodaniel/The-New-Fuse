# User Context Configuration

This directory contains product-level defaults and schemas only.

Real user-specific bindings live outside repository source in the user's TNF profile, typically:

```text
~/.tnf/profiles/<profile>.json
```

Do not commit:

- real Google Drive folder IDs/URLs tied to a user;
- OAuth refresh/access tokens;
- credential JSON;
- personal absolute paths;
- personal source inventories.

Resolve the active mapping with:

```bash
node scripts/user-context/resolve-storage.cjs --json
```

Configure a private profile with:

```bash
node scripts/user-context/configure-storage.cjs --help
```
