# User Context Storage Resolution Stack

```text
USER / AUTHENTICATED PROFILE
        |
        v
TNF profile (~/.tnf/profiles/<profile>.json or hosted equivalent)
        |
        v
USER_CONTEXT_STORAGE_MANDATE
        |
        v
shared resolver
        |
        +--> logical collection: sources
        +--> logical collection: memory
        +--> logical collection: working
        +--> logical collection: receipts
        +--> logical collection: exports
        |
        v
provider adapter
   +----+----------------+
   |                     |
 local filesystem     Google Drive
   |                     |
 local path            bound folder/object refs
   +----------+----------+
              |
              v
      retrieval/write receipt
```

The fleet consumes the logical collection layer. Provider-specific paths are implementation details returned by the resolver, not duplicated constants embedded in agent prompts or harness configs.

This mirrors TNF's broader architecture rule: meaning/authority/context precede provider/transport selection.
