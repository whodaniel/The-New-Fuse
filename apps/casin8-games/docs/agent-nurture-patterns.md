# Agent Nurturing Patterns (PokerRL-Inspired)

This document maps practical training concepts from PokerRL into Casin8's agent
nurturing flow.

Source reference:

- https://github.com/EricSteinberger/PokerRL

## Core Pattern Mapping

1. Training profile abstraction

- PokerRL uses explicit experiment/training profile structures.
- Casin8 equivalent: `trainingProfile` in `swarm/agent-nurture` with learner
  actors, traversal budget, mini-batch size, and eval cadence.

2. Self-play + opponent-pool progression

- PokerRL emphasizes iterative policy improvement in controlled environments.
- Casin8 equivalent: staged opponent-pool mixes (`self`, `archived`, `scripted`,
  `probe`, `ladder_shadow`) updated by stage.

3. Regular evaluation loop

- PokerRL workflows separate training from evaluation cadence.
- Casin8 equivalent: automatic episode recording plus periodic evaluation
  (`exploitabilityProxy`, `head-to-head`, `probe`) via `evaluateProgram()`.

4. Exploitability-style risk signal

- Exact exploitability may be expensive for production loops.
- Casin8 equivalent: `exploitabilityProxy` tracked per episode and used to gate
  stage progression.

5. Distributed scalability path

- PokerRL supports distributed scaling patterns.
- Casin8 equivalent: `trainingProfile.distributed`, `cluster`, `learnerActors`
  to coordinate multi-agent runs.

## Operational Workflow

1. Initialize nurture program

- `POST /api/agents/nurture/init`

2. Feed training episodes

- `POST /api/agents/nurture/episode`
- Required metric: `bb100`
- Recommended metrics: exploitability proxy, policy entropy, legality
  violations, latency, volatility

3. Evaluate and update curriculum

- `POST /api/agents/nurture/evaluate`
- Optional patch of profile knobs before evaluation

4. Pull coaching state

- `GET /api/agents/nurture/state?agentId=...`

## Stage Model

- `bootstrap`
- `stable_self_play`
- `exploit_test`
- `ladder_ready`

Promotion uses rolling windows with thresholds on:

- legal action violation rate
- showdown error rate
- exploitability proxy
- bb/100

## Notes

- This is an implementation pattern inspired by PokerRL workflows, not a direct
  port of PokerRL internals.
- Keep production enforcement in risk guardrails (`agent-runtime`) while nurture
  module drives training/curriculum decisions.
