# The New Fuse: Premium Design System Manifest v2.0

> "World Class or Nothing"

## 1. Core Philosophy: "Deep Space"

We have abandoned the flat "slate-950" approach. The new system relies on a
multi-layered mesh gradient that mimics deep space, providing depth and
richness.

**Global Background:**

- Base: `#020617` (Deep Obsidian)
- Layer 1: Radial Gradient (Cyan/Blue at top center) - 8% Opacity
- Layer 2: Radial Gradient (Purple/Violet at top right) - 5% Opacity
- Layer 3: Linear Gradient (Obsidian to Slate)

## 2. Typography: "Modern & Technical"

We have moved away from system defaults to a premium font stack.

**Headings:** `Outfit` (Sans-serif, Geometric, Humanist)

- Usage: `h1` through `h6`
- Character: Bold, confident, futuristic.

**Body:** `Plus Jakarta Sans` (Geometric Sans)

- Usage: Paragraphs, UI text, Data
- Character: Highly legible, modern, technical.

## 3. Glassmorphism 2.0: "Ultra-Premium"

The old `bg-white/5` was insufficient. The new glass styling is physically
modeled.

**Surface:**

- `bg-white/[0.02]` (2% Opacity)
- `backdrop-blur-2xl` (Heavy Frost)
- `border-white/[0.08]` (Subtle, crisp edge)

**Depth:**

- `shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]` (Deep, soft drop shadow)
- **Hover:** `bg-white/[0.05]` + Glow Effect

## 4. Components Upgraded

1.  **Sidebar:** Now fully transparent (`bg-slate-950/30`) to reveal the global
    mesh gradient.
2.  **Dashboard:** Removed local backgrounds; now floats on the global theme.
3.  **Buttons:** "Glow" effects added to all primary actions.
4.  **Landing Page:** Full overhaul to transparent sections.

## 5. Implementation Status

- [x] `globals.css` (Background & Fonts)
- [x] `tailwind.config.ts` (Font Families)
- [x] `design-system.tsx` (GlassCard & Button Physics)
- [x] `StandardLayout.tsx` (Structural Transparency)
- [x] `Dashboard` (Visual Clean-up)
