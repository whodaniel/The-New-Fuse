# SDK Interop Acceptance Checklist

## Mapping Integrity

- SDK features map to explicit TNF commands/options.
- Unsupported SDK features are explicitly marked as deferred.

## Command-Surface Verification

- `tnf --help` reflects intended root changes.
- Each in-scope subcommand help reflects mapped options.
- Aliases and wrappers execute correctly.

## Runtime Verification

- Authentication path is tested for each in-scope SDK/provider.
- At least one execution path per mapped capability is smoke-tested.
- Failures produce actionable messages.

## TNF Guardrails

- TNF-native startup/default behavior remains intact unless approved otherwise.
- No hidden coupling to a single SDK.

## Reporting

- Final summary includes mapping artifact and command evidence.
- Remaining SDK parity gaps are listed as backlog.
