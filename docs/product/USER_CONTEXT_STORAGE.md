# TNF User Context Storage

TNF users may choose where their personal/user-owned context is stored. The initial first-class choices are local-machine storage and user-authorized Google Drive.

The product contract is provider-neutral: agents address stable logical collections such as `sources`, `memory`, `working`, and `receipts`, while TNF resolves those names against the active user's storage profile.

See:

- `docs/protocols/USER_CONTEXT_STORAGE_MANDATE.md`
- `data/user-context/storage-provider-defaults.json`
- `scripts/user-context/resolve-storage.cjs`

## Defaults

`local-primary` is the safe default. A user may instead select `google-drive-primary`, `mirrored`, or `local-only`.

Google Drive is not considered ready until the user has authorized and bound a Drive root. Selecting Drive in a UI is not sufficient proof of readiness.

## Fleet behavior

The core fleet inherits the active user's storage profile for user-context work. Child swarms and agents inherit their parent/user mapping unless an explicitly authorized scoped override is present.

## Privacy

The repository stores the contract and provider defaults, never a real user's Drive folder ID, OAuth token, credential file, or private context.
