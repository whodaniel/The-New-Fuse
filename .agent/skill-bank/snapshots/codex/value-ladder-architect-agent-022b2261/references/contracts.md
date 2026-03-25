# Value Ladder Contracts

## ValueLadderInput

```json
{
  "product_and_service_catalog": [
    {
      "name": "string",
      "type": "lead_magnet | tripwire | core_offer | high_ticket | continuity | unknown",
      "price_usd": 0,
      "description": "string",
      "audience_stage": "cold | warm | hot | unknown",
      "delivery_model": "self-serve | group | 1:1 | done-for-you | unknown"
    }
  ]
}
```

## ValueLadderReport

- Root key: `value_ladder_report`
- Required sections:
`assumptions`, `product_and_service_catalog`, `value_ladder_rungs`, `funnel_mapping`, `ecosystem_flowchart_mermaid`, `strategic_narrative`
- Funnel keys and types:
`front_end`=`LeadMagnetFunnel`,
`front_end_monetization`=`TripwireFunnel`,
`mid_tier`=`WebinarFunnel`,
`back_end`=`HighTicketFunnel`,
`retention_and_ltv_extension`=`ContinuityRetentionLoop`

## CLI Pipeline

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export VLA_DIR="$CODEX_HOME/skills/imported-claude-agents/value-ladder-architect-agent"

bash "$VLA_DIR/scripts/run_pipeline.sh" \
  "$VLA_DIR/references/input-template.json" \
  "$VLA_DIR/output/value_ladder_report.json"
```

The pipeline does:
1. Build deterministic report JSON from input.
2. Validate report against required contract rules.
