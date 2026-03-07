# Agent + Sponsorship API Schemas

## Agent Action Contract

- Endpoint: `GET /api/agents/action-contract`
- Purpose: formal request/response schema for agent decision loop.

### Decision Request (`POST /api/strategy/decide`)

```json
{
  "agentId": "agent-1",
  "bankrollUnits": 10000,
  "legalActions": ["fold", "check", "call", "raise"],
  "handStrength": 0.62,
  "potUnits": 250,
  "toCallUnits": 40,
  "temperament": "balanced",
  "maxRiskBps": 800
}
```

### Decision Response

```json
{
  "ok": true,
  "profile": { "agentId": "agent-1" },
  "decision": {
    "action": "call",
    "amountUnits": 40,
    "confidence": 0.71,
    "explanation": "..."
  },
  "policy": { "allowed": true, "code": "OK" },
  "executable": true
}
```

## Sponsorship Core

### Open Position

- `POST /api/sponsorships/open`

```json
{
  "positionId": "pos-1",
  "agentId": "agent-1",
  "stakeForSaleBps": 7000,
  "markupBps": 11000,
  "maxExposureUnits": "1000000"
}
```

### Fund Position

- `POST /api/sponsorships/fund`

```json
{
  "positionId": "pos-1",
  "sponsorId": "sponsor-1",
  "principalUnits": "5000"
}
```

### Settle + Credit (End-to-End)

- `POST /api/sponsorships/settle-and-credit`

```json
{
  "positionId": "pos-1",
  "eventId": "event-77",
  "buyInUnits": "1000",
  "prizeUnits": "1600",
  "rakeUnits": "20",
  "ledgerId": "default",
  "sponsorPlayerMap": { "sponsor-1": "player-wallet-1" }
}
```

Response includes:

- `settlement` (net math, sponsor payout rows)
- `credits[]` (actual cashier deposit outcomes per sponsor)
- updated `position` summary

### Marketplace Discovery

- `GET /api/sponsorships/marketplace?status=<open|funded>&limit=50`

### One-Click Funding

- `POST /api/sponsorships/one-click-fund`

```json
{
  "positionId": "pos-1",
  "sponsorId": "sponsor-1",
  "playerId": "sponsor-wallet-1",
  "principalUnits": "1000",
  "ledgerId": "default",
  "idempotencyKey": "ocf-pos-1-s1"
}
```

This endpoint reserves cashier balance and funds the sponsorship position in one
request.

### Sponsor ROI Analytics

- `GET /api/sponsorships/sponsor-analytics?sponsorId=sponsor-1` Returns
  aggregated principal, cost basis, claimable/claimed units, and ROI in bps.

### Simulation Endpoint

- `POST /api/sponsorships/simulate`

```json
{
  "runs": 1000,
  "stakeForSaleBps": 7000,
  "principalUnits": "2000",
  "buyInUnits": "2000",
  "roiBpsMean": 450,
  "roiBpsStdDev": 2600,
  "capLossBps": 9000
}
```

Response includes exploit-oriented outputs:

- `avgSponsorPnlUnits`
- `sponsorLossRate`
- `extremeLossRate`
- `exploitRisk` (`low|medium|high`)
