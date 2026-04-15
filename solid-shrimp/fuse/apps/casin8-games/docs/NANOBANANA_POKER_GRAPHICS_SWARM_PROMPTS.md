# Nanobanana 2 Graphics Swarm Pack (Poker-Only)

This is the production graphics list for **Casin8 Poker Room** (multiplayer
poker app, not video poker).

## Global Direction (use in every prompt)

Use this style block at the top of every generation request:

```text
Create production-ready game UI art for a multiplayer crypto poker app called "Casin8 Poker Room".
Universe: ai-arcade adjacent sci-fantasy; premium, trustworthy, technical, cinematic.
Primary palette: deep navy, emerald, royal red, royal blue, royal purple, royal gold.
Material language: glassmorphism, frosted holographic panels, brushed metal accents, carbon microtexture.
Lighting: soft volumetric glow, subtle neon edge lighting, no overblown bloom.
Mood: calm confidence + high-stakes precision; cyborg-and-bot compatible space-tech aesthetic.
Rules: no roulette, no slots, no blackjack, no video poker motifs; poker-only visual language.
Output: ultra-detailed, clean, layered, high legibility at desktop and mobile sizes.
```

## Export Standards (for all assets)

- `Format`: `PNG` with transparency when possible; `WEBP` alt optional.
- `Master size`: `2048x2048` for props/icons, `2560x1440` for scene backgrounds,
  `1600x900` for panel comps.
- `Variants`: `idle`, `hover`, `active`, `disabled`, `error` where relevant.
- `Naming`: `pkr_<group>_<asset>_<variant>_v01.png`.

## Asset Groups and Prompts

## 1) Brand + Shell

1. `pkr_brand_logo_mark_idle_v01.png`

```text
Generate a premium logo mark for "Casin8 Poker Room". Geometric, futuristic, elegant. Blend poker symbolism (subtle spade/diamond negative space) with AI circuitry cues. Emerald core glow, royal gold micro-trim, deep navy body. Deliver transparent background, crisp edges, no text, icon-only.
```

1. `pkr_brand_wordmark_light_v01.png`

```text
Generate a wordmark "Casin8 Poker Room" with custom futuristic sans typography. High legibility, slightly condensed uppercase, technical micro-cuts. White/emerald primary with royal gold accent. Transparent background.
```

1. `pkr_shell_bg_main_desktop_idle_v01.png`

```text
Create a desktop app shell background (2560x1440) for poker. Layered deep navy-to-emerald gradient, faint nebula haze, sparse geometric constellation lines, subtle particle noise, dark vignette edges. Keep center area clean for UI panels.
```

1. `pkr_shell_bg_main_mobile_idle_v01.png`

```text
Create a mobile app shell background (1290x2796) matching desktop DNA: deep navy, emerald atmosphere, royal blue/purple secondary bands, subdued royal gold spark accents. Keep top and bottom safe areas visually calm for overlays.
```

## 2) Poker Table and Environment

1. `pkr_table_felt_6max_topdown_idle_v01.png`

```text
Design a 6-max poker felt top-down table. Premium emerald felt weave, deep navy shadows, royal gold trim ring, seat cutouts with subtle glass halos. Center pot area clean and high contrast. No chips/cards baked in.
```

1. `pkr_table_felt_9max_topdown_idle_v01.png`

```text
Design a 9-max tournament table top-down variant with same style DNA. Slightly wider oval, stronger rail detail, reserved dealer/button zones, anti-clutter center.
```

1. `pkr_table_rail_material_closeup_v01.png`

```text
Create a texture plate for poker table rail materials: dark carbon, brushed metal seams, royal gold piping, faint holographic inlays. Tileable feel preferred.
```

1. `pkr_stage_cinematic_table_scene_v01.png`

```text
Create an isometric cinematic poker stage scene with depth-of-field: central table pedestal, holographic HUD projectors, ambient fog, particle glints, cyborg/bot venue vibe. Keep visual hierarchy focused on table center.
```

## 3) Chips, Pot, and Markers

1. `pkr_chip_denom_1_idle_v01.png`

```text
Generate high-detail casino chip (denomination 1) top+angled view. White/silver base with emerald accents, embossed edge, realistic micro-scratches, transparent background.
```

1. `pkr_chip_denom_5_idle_v01.png`

```text
Generate denomination 5 chip, royal red base with gold stripe geometry, same material style and lighting as set.
```

1. `pkr_chip_denom_25_idle_v01.png`

```text
Generate denomination 25 chip, emerald base, technical radial inlay, precise legibility.
```

1. `pkr_chip_denom_100_idle_v01.png`

```text
Generate denomination 100 chip, royal blue base, silver edge texturing, anti-counterfeit micro-pattern detail.
```

1. `pkr_chip_denom_500_idle_v01.png`

```text
Generate denomination 500 chip, royal purple base with royal gold center crest, premium high-stakes look.
```

1. `pkr_chip_stack_small_idle_v01.png`

```text
Create small mixed-denomination chip stack with clean silhouette and soft grounded shadow.
```

1. `pkr_chip_stack_large_idle_v01.png`

```text
Create large mixed-denomination chip tower with believable tilt and compression. High-end realism, transparent background.
```

1. `pkr_marker_dealer_button_idle_v01.png`

```text
Design a premium dealer button marker. White core, gold rim, emerald micro-LED edge glow, engraved "D".
```

1. `pkr_marker_sb_bb_set_idle_v01.png`

```text
Create SB and BB blind markers as a matching pair. Distinct colors, shared style language, crisp label readability.
```

1. `pkr_marker_allin_badge_set_v01.png`

```text
Create ALL-IN badge variants: neutral, warning, locked. Glass panel + metallic rim + readable typography.
```

## 4) Cards and Card Motion Props

1. `pkr_card_back_primary_idle_v01.png`

```text
Create a premium poker card back design matching Casin8 style: deep navy base, emerald linework, royal gold center sigil, subtle royal purple/blue energy ring. Print-safe symmetry, high contrast.
```

1. `pkr_card_back_alt_royal_idle_v01.png`

```text
Create alternate card back with stronger royal red and royal blue geometry while preserving brand DNA.
```

1. `pkr_card_shadow_soft_idle_v01.png`

```text
Generate soft contact shadow plate for cards on felt, transparent PNG, realistic but subtle.
```

1. `pkr_card_glow_win_fx_v01.png`

```text
Create a lightweight glow/fx overlay for winning cards: emerald + gold pulse, no heavy bloom, transparent background.
```

1. `pkr_card_flip_frame_01_v01.png`

```text
Frame 1 of card flip motion (back-facing, slight tilt), cinematic lighting, transparent.
```

1. `pkr_card_flip_frame_02_v01.png`

```text
Frame 2 of card flip motion (mid-rotation blur suggestion), consistent camera and lighting.
```

1. `pkr_card_flip_frame_03_v01.png`

```text
Frame 3 of card flip motion (front-facing reveal pose), consistent framing with frame 1 and 2.
```

## 5) Seats, Avatars, Agent Identity

1. `pkr_seat_ring_idle_v01.png`

```text
Create empty seat ring with subtle holographic halo and deep shadow; must read clearly over felt.
```

1. `pkr_seat_ring_active_turn_v01.png`

```text
Create active-turn seat ring variant: animated look implied, emerald pulse channels, high clarity.
```

1. `pkr_avatar_frame_human_idle_v01.png`

```text
Design circular avatar frame for human players, elegant glass + metallic finish, minimal ornament.
```

1. `pkr_avatar_frame_agent_idle_v01.png`

```text
Design circular avatar frame for AI agents, more technical with circuit motifs, royal blue/purple accents.
```

1. `pkr_badge_agent_tier_a_v01.png`

```text
Create autonomy badge tier A (advisory): refined icon + label chip.
```

1. `pkr_badge_agent_tier_b_v01.png`

```text
Create autonomy badge tier B (semi-auto): matching family style.
```

1. `pkr_badge_agent_tier_c_v01.png`

```text
Create autonomy badge tier C (full-auto): matching family style.
```

1. `pkr_badge_sponsored_player_v01.png`

```text
Create sponsorship badge indicating backed agent/player. Trustworthy financial aesthetic, not gimmicky.
```

## 6) HUD Panels and Utility Components

1. `pkr_panel_fairness_idle_v01.png`

```text
Design right-rail fairness panel container: commit-reveal slots, seed hash display regions, verify CTA zone. Glassmorphism with clear information lanes.
```

1. `pkr_panel_tx_lifecycle_idle_v01.png`

```text
Design transaction lifecycle panel with steps: submitted, pending, confirmed, failed. Include icon placeholders and status rails.
```

1. `pkr_panel_ledger_row_set_v01.png`

```text
Create ledger row UI strips: default, positive result, negative result, disputed. Clean spacing and readability.
```

1. `pkr_panel_network_health_set_v01.png`

```text
Create network health chips for API, table stream, chain RPC, wallet. States: green/amber/red/unknown.
```

1. `pkr_panel_chat_feed_bg_v01.png`

```text
Design chat/activity feed panel background with subtle dividers and timestamp lane.
```

1. `pkr_panel_sponsor_market_card_v01.png`

```text
Design sponsor marketplace card for agent stake listings: markup, stake-for-sale, exposure cap, CTA area.
```

## 7) Action Controls

1. `pkr_btn_fold_set_v01.png`

```text
Create Fold button set: idle/hover/pressed/disabled. Tone: serious risk action, not alarming cartoon red.
```

1. `pkr_btn_checkcall_set_v01.png`

```text
Create Check/Call button set with balanced priority and clear hierarchy.
```

1. `pkr_btn_raise_primary_set_v01.png`

```text
Create Raise primary CTA set with premium emerald glow, high contrast, accessible text.
```

1. `pkr_slider_raise_track_set_v01.png`

```text
Design raise slider track and thumb kit: idle/active/disabled plus tick marks for preset bets.
```

1. `pkr_quickbet_chip_row_v01.png`

```text
Create horizontal quick-bet chip row visual with selected and disabled states.
```

## 8) Tournament-Specific Graphics

1. `pkr_tourney_lobby_hero_bg_v01.png`

```text
Design tournament lobby hero background for MTT/SNG with bracket-like geometry, leaderboard stage lighting, and registration urgency vibe.
```

1. `pkr_blind_level_timeline_v01.png`

```text
Create blind-level timeline component skin with current level emphasis and next-level markers.
```

1. `pkr_payout_ladder_panel_v01.png`

```text
Design payout ladder panel background with rank columns and prize emphasis.
```

1. `pkr_final_table_banner_v01.png`

```text
Create dramatic final-table banner overlay with premium royal gold accents and controlled celebration energy.
```

1. `pkr_elimination_burst_fx_v01.png`

```text
Create subtle elimination FX overlay (not explosive arcade), transparent PNG.
```

## 9) Trust, Error, and Resilience States

1. `pkr_state_reconnecting_banner_v01.png`

```text
Design reconnecting banner: calm amber warning, concise status slot, retry control placeholder.
```

1. `pkr_state_chain_mismatch_card_v01.png`

```text
Design chain mismatch modal card with clear corrective action area.
```

1. `pkr_state_insufficient_funds_card_v01.png`

```text
Design insufficient funds card with top-up callout and quick funding action area.
```

1. `pkr_state_duplicate_action_guard_v01.png`

```text
Create compact duplicate-action prevented indicator badge for action bar/HUD.
```

1. `pkr_state_settlement_pending_overlay_v01.png`

```text
Create settlement pending overlay panel with trust-preserving tone and progress lane.
```

## 10) Mobile-First Specific Assets

1. `pkr_mobile_bottom_action_sheet_v01.png`

```text
Design mobile sticky action sheet background with zones for Fold/Check-Call/Raise + slider + quick chips.
```

1. `pkr_mobile_tabbar_pokerroom_v01.png`

```text
Design bottom tab bar for poker app sections (Lobby, Tables, Tourneys, Sponsorship, Wallet), with active/inactive states.
```

1. `pkr_mobile_hud_drawer_handle_v01.png`

```text
Design HUD drawer handle and collapsed chip for fairness/health quick status.
```

1. `pkr_mobile_table_header_compact_v01.png`

```text
Design compact table header strip: blinds, pot, network ping, fair badge.
```

## Team Execution Notes

- Generate in this order:
  1. Brand + Shell
  2. Table + Chips + Markers
  3. Controls + HUD
  4. Tournament + Trust states
  5. Mobile variants
- Keep a single shared moodboard so all assets stay coherent.
- Reject any output that drifts into non-poker casino imagery.
- Prefer legibility and compositional clarity over decorative complexity.
