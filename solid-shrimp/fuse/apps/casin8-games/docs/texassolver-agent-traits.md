# TexasSolver Agent Trait Crafting

This app now supports deriving agent traits from TexasSolver strategy JSON.

## Source

- TexasSolver repository: https://github.com/bupticybee/TexasSolver
- Intended input: strategy JSON exports (actions + combo strategy frequencies).

## API

- Endpoint: `POST /api/strategy/traits/texassolver`
- Generic endpoint: `POST /api/strategy/traits/craft`
- Supported providers on generic endpoint: `texassolver`, `cfr_profile`,
  `risk_profile`

Request:

```json
{
  "payloadVersion": 1,
  "agentId": "agent-omega",
  "ownerId": "root",
  "tier": "B",
  "solverDump": {
    "strategy": {
      "actions": ["fold", "call", "raise"],
      "strategy": {
        "AhKh": [0.05, 0.25, 0.7],
        "QsQh": [0.1, 0.2, 0.7],
        "7c6c": [0.2, 0.5, 0.3]
      }
    }
  },
  "nodePath": null,
  "context": { "gameType": "mtt", "phase": "middle" },
  "provenance": {
    "generator": "texassolver-export",
    "generatorVersion": "1.0.0",
    "commitSha": "abc123",
    "seed": 20260227
  },
  "signature": {
    "alg": "hmac-sha256",
    "value": "hex",
    "keyId": "env:CASIN8_TRAIT_ARTIFACT_SECRET"
  },
  "applyToAgent": true,
  "autoRegister": true,
  "createProfile": true
}
```

Response:

- `recommendation.recommended.style`
- `recommendation.recommended.temperament`
- `recommendation.recommended.maxRiskBps`
- `recommendation.recommended.styleOverrides` (`vpipBps`, `pfrBps`, `bluffBps`,
  `icmDisciplineBps`)
- `agent` (if applied)
- `profile` (if created)

Generic CFR request example:

```json
{
  "provider": "cfr_profile",
  "agentId": "agent-cfr",
  "cfrProfile": {
    "actionMix": {
      "fold": 0.14,
      "check": 0.12,
      "call": 0.22,
      "raise": 0.42,
      "bet": 0.07,
      "allin": 0.03
    },
    "exploitabilityBb100": 3.8,
    "sampleHands": 28000
  },
  "applyToAgent": true,
  "autoRegister": true,
  "createProfile": true
}
```

Generic risk-aware request example:

```json
{
  "provider": "risk_profile",
  "agentId": "agent-risk",
  "riskProfile": {
    "riskScore": 88,
    "collusionScore": 72,
    "tiltIndexBps": 8000,
    "abuseFlags": ["soft_play_cluster", "rapid_dump_pattern"]
  }
}
```

## UI

In **Agent Ops & Sponsorship Market**:

- Paste TexasSolver node JSON into **TexasSolver Node JSON**
- Click **Craft Traits (TexasSolver)**
- The app applies synthesized style/risk traits and updates the active strategy
  profile.
