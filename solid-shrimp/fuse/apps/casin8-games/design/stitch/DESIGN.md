# DESIGN.md - Casin8 Design System

## 1) Tone

- Premium, cinematic, dependable, high-trust.
- Fantasy-compatible with ai-arcade.xyz but not a clone.

## 2) Palette

- Base background: Deep Navy `#071B2A`
- Surface: Obsidian Teal `#0B2A25`
- Primary accent: Emerald `#16E27A`
- Secondary accent: Warm Gold `#D2A94D`
- Data highlight: Cool Cyan `#45C7FF`
- Text primary: `#F4F8FF`
- Text secondary: `#9EB3C7`
- Error: `#F05A5A`
- Warning: `#F2A93B`

## 3) Typography

- Headline: geometric, high-contrast sans.
- Body/UI: compact readable sans.
- Numeric data: tabular-style emphasis for bets/payouts/latency.

## 4) Components

- Top status strip: wallet, chain, latency, tx lifecycle.
- Utility rail / drawer: fairness, receipts, ledger, health.
- Bet action bar: sticky, with clear disabled states.
- Cards/chips/buttons: subtle depth and glow, avoid neon saturation.

## 5) Motion Guidance

- Keep motion informative: state transitions, lock/reveal, payout emphasis.
- Respect reduced-motion fallback.

## 6) Design System Notes for Stitch Generation (REQUIRED)

- Platform: Web app, mobile-first (`390x844` target composition)
- Theme: Dark cinematic fintech-casino
- Background: Deep navy atmospheric gradient with subtle particle texture
- Primary Accent: Emerald for actionable controls and live states
- Secondary Accent: Warm gold for premium highlights and wheel/chip details
- Data Accent: Cyan for telemetry/fairness metadata
- Layout: top status, main game stage, trust drawer, sticky action bar
- Accessibility: strong contrast, large tap targets, visible focus states
