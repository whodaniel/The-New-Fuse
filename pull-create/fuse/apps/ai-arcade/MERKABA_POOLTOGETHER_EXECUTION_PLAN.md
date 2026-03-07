# Merkaba x PoolTogether Execution Plan

This is the implementation boundary for AI Arcade:

## What stays native in PoolTogether V5

- ERC-4626 vault flow and TWAB eligibility.
- Adaptive tiered prize distribution.
- Draw lifecycle and liquidation auctions.

## What AI Arcade builds as a parallel game layer

- Descending-price item auctions.
- Fee-funded sidepots and progressive "fountain" structures.
- Weighted-loss ticket logic (with anti-sybil controls).
- Affiliate and sponsorship routing.

## Integration points

- Use Prize Hooks for on-win custom actions and reward routing.
- Use custom vault wrappers when additional accounting is needed.
- Keep solvency checks strict:
  - `sellerProceeds >= reserveTarget`
  - `liability <= funding + externalYield`

## Minimum safe rollout

1. Start with simulation-only parameters (no live funds).
2. Gate weighted-loss multipliers with caps and identity/volume weighting.
3. Deploy game-layer contracts separately from PoolTogether core.
4. Add monitoring for sidepot liabilities and auto-pause thresholds.
