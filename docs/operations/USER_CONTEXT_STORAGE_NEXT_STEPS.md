# User Context Storage — Next Implementation Steps

1. Run resolver unit tests and normal CLI/onboarding tests.
2. Implement real local provider IO behind logical collection APIs.
3. Implement real Google Drive OAuth/credential-vault/provider adapter.
4. Replace simulated Drive wizard success with backend receipts.
5. Add hosted thenewfuse.com storage settings/profile binding using the same schema/strategy semantics.
6. Add fleet drift checks for hard-coded personal paths and user Drive IDs in shared source.
7. Add mirrored-provider conflict detection and synchronization receipts.
8. Migrate legacy private/user source locations by copy/import with recovery receipts; never silently delete originals.
