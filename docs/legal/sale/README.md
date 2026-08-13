# M&A Sale Materials — Authoritative copies are not in this repository

This directory previously held draft M&A paperwork (NDA, LOI, APA, term sheet,
closing checklist, CIM, valuation memo) tied to a contemplated transaction for
the operator's sole proprietorship.

As of 2026-07-28 those documents are no longer tracked in this repository:

- They contain the operator's real name and identifying details.
- The same pattern that surfaced the leaked `apps/api/env files` (commit
  `41f6f4d6a7`) and the `tnf-browser` bearer token (PR #74) applies: business
  paperwork with operator identity is operator-local, not public.
- Authoritative working copies live at `~/.tnf/legal/sale/` on the operator's
  local filesystem, accessible only to the operator.

If you are a prospective counterparty and have arrived here from the public
site, please use the contact form linked from the Acquisition Disclosures page
to request the full NDA and IOI under a clean counterparty NDA, sent through a
non-public channel.

If you are reviewing this repository on behalf of the operator, the untracked
versions are reproducible from the operator-local copies and the templates in
`docs/legal/sale/templates/` (forthcoming).
