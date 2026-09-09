# Automatic turn critic handoff

TNF_PROTOCOL_ACK

Implemented automatic Flash turn critic with configurable prompt terminal
federation file and webhook routing; native and external turn-end hooks; 14
protocol checks and CLI typecheck compile bundle pass; live Flash inference and
terminal verified; shared relay rejects AUTH_REQUIRED

## Verification

PASS: 14 HTTP/WebSocket protocol checks; 9 abort checks; 9 persisted-model
checks; 3 turn-end help checks; 565-path command-surface oracle; CLI typecheck
and tsc compile with dependency artifacts; split CLI and critic entry bundles.
Live AIHubMix Gemini Flash-Lite final inference and actual turn-end prompt
delivery passed. Dedicated terminal viewer started and output verified; test
viewer closed. Live shared relay registration rejected AUTH_REQUIRED; delivery
failure recorded. No full monorepo readiness claim.

## Next Actions

- Restart updated native TNF agents to use the turn critic.
- Configure relay authentication before choosing federated delivery.
- External runtimes must emit the TNF turn-end hook per completed turn.
