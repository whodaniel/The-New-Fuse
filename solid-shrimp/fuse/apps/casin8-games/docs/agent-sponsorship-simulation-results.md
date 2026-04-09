# Agent Sponsorship Simulation Results

## Run Metadata

- Date: 2026-02-27
- Endpoint: `POST /api/sponsorships/simulate`
- Sample size: 1000 runs

## Input Assumptions

```json
{
  "stakeForSaleBps": 7000,
  "principalUnits": "2000",
  "buyInUnits": "2000",
  "roiBpsMean": 450,
  "roiBpsStdDev": 2600,
  "capLossBps": 9000
}
```

## Observed Outputs

```json
{
  "avgSponsorPnlUnits": "70",
  "sponsorLossRate": 0.414,
  "extremeLossRate": 0.001,
  "exploitRisk": "low"
}
```

## Interpretation

- Positive expected sponsor edge in this parameter set (`avgSponsorPnlUnits` >
  0).
- Losses still frequent (`41.4%` of runs), consistent with high-variance
  tournament/cash outcomes.
- Extreme loss frequency is low in this calibrated setup.
- Use this endpoint as a pre-launch stress gate for each sponsorship template.
