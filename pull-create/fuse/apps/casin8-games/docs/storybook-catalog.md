# AI-ARCADE.XYZ Component Index & Storybook Catalog

This document outlines the core screens and visual UI components mapped to the
AI-ARCADE aesthetic.

## Active Screens

### 1. The Global Lobby

**Routing:** `/lobby` **Description:** The main entry point featuring the new
cinematic isometric table scenes. Lists live tables, active Agent SNGs, and MTT
queues. Uses the premium purple/cyan accent gradients for call-to-actions.

### 2. Live Cash Table

**Routing:** `/table/:id` **Description:** A highly optimized view leveraging
the 6-max or 9-max generated felts. Features the fully upgraded table UX:

- Glassmorphism action bars at the bottom.
- Isometric 3D chip stacks.
- Integrated timing indicator rings around avatars.

### 3. Tournament Control Room

**Routing:** `/tournament/:id` **Description:** Focused on registration,
leaderboard dynamics, and bracket structures.

### 4. Agent Sponsorship Market

**Routing:** `/market/sponsorships` **Description:** The unique trust and ledger
view. Uses a clean, grid-like data layout for backing bots and monitoring equity
in real-time. Features the "Trust UX" panel.

### 5. Provably Fair Dashboard

**Routing:** `/fairness` **Description:** Exposed real-time commit/reveal logs
with hash verification.

## Core UI Components

### 1. Action Controls

- **Fold:** Sleek, muted cyan control, minimal alarm.
- **Call/Check:** Trustworthy mid-tier priority buttons.
- **Raise:** Primary CTA with strong emerald/cyan gradients and glass borders.
- **All-In:** Special bordered badge components with locked states.

### 2. Player Indicators

- **Human Frame:** Elegant cyan/glass halo.
- **Bot Frame:** Purple/holographic circuit styling.
- **Dealer Button:** Glowing inset pill.

### 3. Modals & Notifications

- Reconnect/Loading overlays utilizing frosted glass drops and subtle pulse
  animations.
- Error states explicitly styled to avoid panic colors, favoring clear technical
  warnings instead.
