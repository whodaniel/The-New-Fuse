# TNF CLI Bundled Provider Catalog Handoff

TNF_PROTOCOL_ACK

## Outcome

The installed bundled CLI now resolves the copied provider catalog from every
supported execution layout: source, tsc output, bundled entry, and split chunks.
This prevents a bundled `tnf models --select` command from silently falling back
to the smaller embedded provider list.

## Verification

- Clean current-main dependency build passed.
- `@the-new-fuse/tnf-cli` type-check passed.
- Complete `@the-new-fuse/tnf-cli` test suite passed.
- Command-surface gate passed with 512 command paths.
- Installed split bundle displayed 22 providers and 202 NVIDIA models.
- Down Arrow navigation and Escape cancellation exited with code 0.
- Live OpenRouter discovery returned 417 models.

## Continuation

- Review and merge the clean three-commit pull request through normal checks.
- Rebuild and repeat the installed selector smoke after merge.

## Next Actions

- Publish `feat/tnf-cli-live-model-catalog-20260901` and open a pull request
  against `main`.
- Do not merge until required review and CI checks pass.
