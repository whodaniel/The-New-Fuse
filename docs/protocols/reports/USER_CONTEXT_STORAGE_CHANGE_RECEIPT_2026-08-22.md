# User Context Storage Change Receipt — 2026-08-22

Base: `main` at `6013b5322aea28a03e5d93ecf7e60bd67cd83c5c`

Topic branch: `feat/user-context-storage-contract-20260822`

Intent: create one TNF-wide logical user-context storage contract with local + Google Drive as initial providers, profile-based inheritance across the core fleet and child swarms/agents, visible degraded fallback, and strict separation between private user bindings and product source.

Mutation scope is limited to protocol/docs, user-context defaults/schema/tooling, CLI onboarding profile fields, and Drive integration guidance. No existing user files, Drive folders, or credentials were modified by this code change.

Tests were authored for the resolver but are not claimed as executed in this connector session.
