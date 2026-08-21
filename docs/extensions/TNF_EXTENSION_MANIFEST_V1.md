# TNF Extension Manifest V1

Every satellite repository declares its distribution boundary in
`tnf-extension.json`. The manifest does not imply that every satellite is an
in-process plugin.

## Kinds

- `loadable-extension`: installable into the local TNF extension directory and
  activated through the runtime lifecycle.
- `external-service`: separately deployed service reached through a declared URL
  or protocol adapter.
- `form-factor`: browser, desktop, mobile, IDE, or other packaged client.
- `standalone-product`: independently installed and operated product.

Only `loadable-extension` is accepted by `tnf plugins install`. Other kinds are
discovered and classified, but retain their own deployment lifecycle.

Lifecycle hooks run in a dedicated worker with a manifest-defined timeout. A
hook exception, process exit, or timeout cannot terminate the CLI process. V1
activation is explicitly manual through `tnf plugins enable`; it does not claim
an unwired automatic-startup lifecycle. Declared permissions are policy inputs
for hosts and reviewers; V1 does not claim operating-system sandbox enforcement
for those permissions.

## Example

```json
{
  "apiVersion": "tnf.extension/v1",
  "kind": "loadable-extension",
  "id": "example-audit-tool",
  "name": "Example Audit Tool",
  "author": "Example Team",
  "version": "1.0.0",
  "description": "Adds an audit capability to TNF.",
  "compatibility": {
    "tnf": "^1.0.0",
    "node": ">=20"
  },
  "capabilities": ["audit.read"],
  "entrypoints": {
    "main": "index.mjs"
  },
  "permissions": ["filesystem_read"],
  "lifecycle": {
    "activation": "manual",
    "timeoutMs": 10000
  }
}
```

The JSON Schema is `docs/protocols/schemas/tnf-extension-manifest.schema.json`.
Runtime validation also checks semver compatibility, safe relative entrypoints,
and entrypoint existence.
