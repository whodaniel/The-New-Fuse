# Task Plan: Fix Custom Element & Chat Bridge Errors

## Goal

Resolve the
`Uncaught Error: A custom element with name 'mce-autosize-textarea' has already been defined`
and the `SimpleChatBridge` "Elements NOT ready" spam.

## Phases

- [x] **ANALYSIS**: Locate the duplicate definition of `mce-autosize-textarea`
      and understand why `SimpleChatBridge` is failing.
- [x] **PLANNING**: Design a safe guard / hotfix to prevent duplicate definition
      and silence/fix the bridge.
- [x] **IMPLEMENTATION**: Apply the fix.
  - [x] Enhance `guard.ts` with global error listener.
  - [x] Move guard import to top of `index.ts`.
  - [x] Add spam prevention to `SimpleChatBridge.ts`.
- [ ] **VERIFICATION**: Verify the error is gone and the bridge works or at
      least degrades gracefully. (Pending User Verification)

## Context

- `mce-autosize-textarea` conflict causing WebComponents error.
- `SimpleChatBridge` spamming logs.
- Previous attempts with "Guard" seem to have failed or been insufficient.
