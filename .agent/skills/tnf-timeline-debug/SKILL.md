---
name: TNF Timeline Page Debug Procedure
description:
  Standard operating procedure to debug the "Failed to load your timeline" error
  on thenewfuse.com
version: 1.0.0
author: Hermes Operator
tags: [debugging, tnf, production, timeline, 404]
---

# TNF Timeline Page Debug SOP

## Problem

When authenticated users visit `/timeline` the page fails with generic error:

> "Failed to load your timeline"

## Root Cause Confirmed 2026-04-10

Timeline page makes blocking initial calls to:

1.  `GET /api/agents`
2.  `GET /api/agents/bank/templates`

Both endpoints return **404 NOT FOUND** on production. Promise.all() rejects
completely and aborts full page render.

This is **not an authentication bug**. Auth works correctly. Session is valid.
User permissions are fine.

## Debug Procedure

1.  Navigate directly to `/timeline` while authenticated
2.  Open browser console
3.  Verify 404 errors for the 2 agent API endpoints
4.  Confirm auth check passed: check for `[RequireAuth] User authenticated` log
    line
5.  Check that Supabase session cookie is present and valid

## Fix Checklist

- [ ] Deploy the missing agent API endpoints to production
- [ ] Add graceful degradation: Timeline page should not completely crash when
      agent API fails
- [ ] Add specific error messaging instead of generic failure
- [ ] Add smoke test for `/timeline` page in CI/CD pipeline

## Verification

After fix:

1.  Sign in with Super Admin account
2.  Load `/timeline`
3.  Confirm no 404 errors in console
4.  Confirm timeline renders fully
