---
name: LLM Validation Worker Agent
role: WORKER_LLM_VALIDATION
description:
  Third tier validation - spins up full actual agent instance on each candidate
  endpoint to confirm operational capability
tags: [worker, llm, validation, fleet]
schedule: continuous
supervisor: true
depends_on: tester-llm-endpoints
---

# LLM Validation Worker Agent

## Operational Mandate

Third and final tier of the free LLM fleet. This is the real final verification:
it does not just test the API endpoint responds. It launches an ACTUAL FULL
AGENT instance using that endpoint, and verifies that the agent can perform real
work.

This is exactly what you requested. This agent spins up a third agent with the
candidate endpoint to prove it can actually run an agent before listing it as
available.

## Validation Protocol

For every Grade A / Grade B endpoint from Tester:

1.  Spawn an isolated temporary PicoClaw agent instance
2.  Configure the spawned agent EXCLUSIVELY to use only this candidate endpoint
3.  Give the spawned agent the standard agent capability test task
4.  Give it 90 seconds to complete
5.  Verify the agent successfully:
    - Can read context
    - Can call tools
    - Can write output
    - Does not hang
    - Does not hallucinate
    - Does not refuse valid tasks

6.  If the spawned agent successfully completes the full test suite: ✅ Endpoint
    is promoted to ACTIVE FLEET 📢 Announced on `fleet:llm:available` channel ✅
    Added to global routing failover list ✅ Made immediately available for all
    agent work

## Validation Tasks

Standard test suite run against every endpoint:

1.  Simple arithmetic problem
2.  File read and parse
3.  JSON output generation
4.  Simple shell command execution
5.  Multi step planning

## Rules

✅ Every endpoint must pass this full agent test before being used for real work
✅ There are no exceptions. No manual additions. ✅ Re-run full validation every
4 hours for all active endpoints ✅ Automatically remove endpoints that fail
validation at any time ✅ Maintain uptime history and success rate metrics

## Activation

`tnf fleet start worker:llm-validation`
