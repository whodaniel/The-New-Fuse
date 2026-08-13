# The New Fuse Design System Reference

> **"World Class or Nothing"** - The New Fuse Design Philosophy

This folder contains design references and documentation for maintaining visual
consistency across The New Fuse project.

---

## 🚀 Brand Identity

**Source**: `/apps/frontend/src/pages/BrandIdentity.tsx`

### Logo Concepts

Three official logo variations stored in `/apps/frontend/public/assets/brand/`:

| Concept                  | File                         | Description                                                                                         |
| ------------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------- |
| 🌟 **Neon Monogram**     | `logo-monogram-neon.png`     | Futuristic 3D intertwining "TNF" letters with glowing cyan and purple accents. Cyberpunk aesthetic. |
| ✨ **Abstract Gradient** | `logo-abstract-gradient.png` | Minimalist geometric fusion of TNF letters. Metallic silver with iridescent finishes.               |
| 🔗 **Circuit Network**   | `logo-circuit-node.png`      | Node-based connections symbolizing neural networks and data flow. Glassmorphic style.               |

### Brand Color Palette: "Deep Space Premium Dark"

```css
--tnf-deep-obsidian: #020617; /* Primary Background */
--tnf-electric-blue: #3b82f6; /* Primary Action (CTAs) */
--tnf-cosmic-purple: #a855f7; /* Secondary Accent */
--tnf-neon-pink: #ec4899; /* Highlights */
```

### Workflow System Colors (Functional)

| Function    | Color   | Hex       | Usage                         |
| ----------- | ------- | --------- | ----------------------------- |
| **Agents**  | Indigo  | `#4f46e5` | AI Agent nodes, blue category |
| **Tools**   | Emerald | `#10b981` | MCP Tools, green indicators   |
| **Prompts** | Violet  | `#8b5cf6` | Prompt nodes, purple elements |
| **Logic**   | Amber   | `#f59e0b` | Control flow, warnings        |

### Brand Gradients

```css
/* Primary Brand Gradient (Text clips, hero elements) */
background: linear-gradient(to right, #60a5fa, #a78bfa, #f472b6);
/* Tailwind: bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 */

/* Action Gradient (Buttons, CTAs) */
background: linear-gradient(45deg, #3b82f6, #1d4ed8);
/* Tailwind: bg-gradient-to-r from-blue-600 to-blue-800 */
```

### Voice & Tone Guidelines

| ✅ Do This                 | ❌ Avoid This               |
| -------------------------- | --------------------------- |
| "Agent Swarms"             | "Unified Agent Ecosystem"   |
| "No babysitting required." | "Manage and monitor agents" |
| "Build Your AI Empire"     | "Get Started" (weak CTA)    |

---

## Current Design System (Active)

The production design system is implemented in the React frontend:

### Key Files

| File                          | Location                                                    | Purpose                                                 |
| ----------------------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| **BrandIdentity.tsx**         | `/apps/frontend/src/pages/BrandIdentity.tsx`                | Complete brand style guide page                         |
| **PREMIUM_THEME_MANIFEST.md** | `/docs/PREMIUM_THEME_MANIFEST.md`                           | Current design philosophy                               |
| **design-system.tsx**         | `/apps/frontend/src/components/ui/design-system.tsx`        | React components (Button, Card, Badge, GlassCard, etc.) |
| **tailwind.config.ts**        | `/apps/frontend/tailwind.config.ts`                         | Tailwind theme configuration                            |
| **theme.ts**                  | `/packages/ui-consolidated/src/styles/theme.ts`             | Theme color tokens                                      |
| **ThemeProvider.tsx**         | `/packages/ui-consolidated/src/providers/ThemeProvider.tsx` | Theme context provider                                  |
| **globals.css**               | `/apps/frontend/src/styles/globals.css`                     | Global CSS variables                                    |
| **brand-tokens.ts**           | `/packages/ui-consolidated/src/styles/brand-tokens.ts`      | TypeScript brand token definitions                      |
| **brand.css**                 | `/packages/ui-consolidated/src/styles/brand.css`            | CSS brand variables and utilities                       |

---

## Framework-Wide Implementation Status

The design system is implemented across all TNF modules:

| Module                       | Status           | Style File                          | Notes                                   |
| ---------------------------- | ---------------- | ----------------------------------- | --------------------------------------- |
| **apps/frontend**            | ✅ Complete      | `tailwind.config.ts`, `globals.css` | Core React app, uses Tailwind           |
| **apps/tauri-desktop**       | ✅ Complete      | `src/styles.css`                    | Aligned with brand tokens               |
| **apps/chrome-extension**    | ✅ Complete      | `popup.css`, `injectable-ui.css`    | Full Deep Space theme                   |
| **packages/ui-consolidated** | ✅ Complete      | `brand-tokens.ts`, `brand.css`      | Central token source                    |
| **apps/vscode-extension**    | ⚠️ VS Code Theme | `media/styles.css`                  | Uses VS Code's native theming (correct) |
| **apps/backend**             | N/A              | -                                   | No UI                                   |
| **apps/api**                 | N/A              | -                                   | No UI                                   |
| **apps/cloud-sandbox**       | N/A              | -                                   | No UI                                   |

### Importing Brand Tokens

**In TypeScript/React:**

```typescript
import {
  tnfBrandTheme,
  brandColors,
  gradients,
  glass,
  shadows,
} from '@the-new-fuse/ui-consolidated';

// Usage
const primaryColor = brandColors.primary; // #7c3aed
const headerGradient = gradients.header; // linear-gradient(...)
```

**In CSS:**

```css
/* Import the brand CSS file */
@import '@the-new-fuse/ui-consolidated/src/styles/brand.css';

/* Use the variables */
.my-card {
  background: var(--tnf-surface);
  border: 1px solid var(--tnf-border);
  backdrop-filter: blur(24px);
}
```

---

## Design Philosophy: "Deep Space" v2.0

> "World Class or Nothing"

### Global Background

```css
--bg-base: #020617; /* Deep Obsidian */
/* + Radial gradients Cyan/Blue (8% opacity) at top center */
/* + Radial gradients Purple/Violet (5% opacity) at top right */
/* + Linear gradient Obsidian to Slate */
```

### Typography

- **Headings**: `Outfit` (Sans-serif, Geometric, Humanist)
- **Body**: `Plus Jakarta Sans` (Geometric Sans)

### Glassmorphism 2.0

```css
/* Surface */
background: rgba(255, 255, 255, 0.02);
backdrop-filter: blur(24px); /* backdrop-blur-2xl */
border: 1px solid rgba(255, 255, 255, 0.08);

/* Depth */
box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.36);

/* Hover */
background: rgba(255, 255, 255, 0.05);
/* + glow effect */
```

### Lean UI Density (Current)

The admin and operator surfaces prioritize clarity and density over decorative
effects. Use the following guidance to keep interfaces lean, readable, and
efficient:

- **Radius**: default to small/medium (6–8px). Avoid oversized rounding.
- **Shadows**: avoid heavy shadows; prefer `shadow-none` or subtle borders.
- **Padding**: prefer `p-3`/`p-4` for cards and panels, `px-3 py-2` for tables.
- **Tables**: use compact headers (`text-xs`, uppercase, muted), minimal row
  hover.
- **Forms**: use `h-9` inputs with concise helper text (`text-xs`).

---

## Color Palette

### Production Colors (HSL Variables)

```css
--background: 222.2 84% 4.9%;
--foreground: 210 40% 98%;
--primary: 217.2 91.2% 59.8%;
--primary-foreground: 222.2 47.4% 11.2%;
--secondary: 217.2 32.6% 17.5%;
--muted: 217.2 32.6% 17.5%;
--accent: 217.2 32.6% 17.5%;
--destructive: 0 62.8% 30.6%;
```

### UI Consolidated Theme

```typescript
// Dark Theme
background: '#020617'; // Deep obsidian
card: '#1e293b'; // Slate 800
sidebar: '#334155'; // Slate 700
border: '#475569'; // Slate 600
primary: '#0ea5e9'; // Sky 500
success: '#10b981'; // Emerald 500
warning: '#f59e0b'; // Amber 500
error: '#f87171'; // Red 400
```

---

## Component Library

### Available Components (from design-system.tsx)

| Component          | Variants                                           | Description                      |
| ------------------ | -------------------------------------------------- | -------------------------------- |
| **Button**         | primary, secondary, outline, ghost, link, gradient | Action buttons with glow effects |
| **Card**           | default, glass, gradient, glow                     | Content containers               |
| **GlassCard**      | -                                                  | Premium glassmorphism card       |
| **AnimatedCard**   | -                                                  | Card with hover animations       |
| **FeatureCard**    | -                                                  | Icon + title + description card  |
| **Badge**          | default, secondary, success, warning, danger       | Status indicators                |
| **Alert**          | default, success, warning, danger                  | Alert banners                    |
| **StatCard**       | primary, secondary, success, warning, danger       | Metric display                   |
| **LoadingSpinner** | sm, md, lg                                         | Loading indicator                |
| **Input**          | -                                                  | Form input                       |
| **Select**         | -                                                  | Dropdown select                  |
| **Separator**      | -                                                  | Visual divider                   |
| **Progress**       | -                                                  | Progress bar                     |
| **Container**      | -                                                  | Layout container                 |
| **Grid**           | 1-6 columns                                        | Responsive grid                  |

---

## Animation System

### Tailwind Animations

```typescript
// Available animations
'fade-in'; // opacity 0 -> 1
'slide-in-up'; // translateY(20px) -> 0
'slide-in-down'; // translateY(-20px) -> 0
'slide-in-left'; // translateX(-100%) -> 0
'slide-in-right'; // translateX(100%) -> 0
'scale-in'; // scale(0.9) -> 1
'glow'; // Blue glow pulse
```

### Box Shadow Tokens

```typescript
'glow-sm': '0 0 10px rgba(59, 130, 246, 0.3)'
'glow-md': '0 0 20px rgba(59, 130, 246, 0.4)'
'glow-lg': '0 0 30px rgba(59, 130, 246, 0.5)'
'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
```

---

## Archived Reference (Legacy Electron HTML)

The `./archived/` subfolder contains:

- Static HTML prototypes from the Electron Browser Hub era
- CSS design references (in `unified-styles.css`)
- These are preserved for historical reference but should NOT be used for new
  development

**For new Tauri development, always use the React component library in
`design-system.tsx`.**

---

## Quick Start for New Components

```tsx
import {
  Button,
  GlassCard,
  Badge,
  LoadingSpinner,
} from '@/components/ui/design-system';

// Example usage
<GlassCard gradient="bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
  <h2 className="text-xl font-heading">Dashboard</h2>
  <Button variant="gradient">Get Started</Button>
  <Badge variant="success">Online</Badge>
</GlassCard>;
```

---

## Git History Reference

Recent design commits for reference:

- `6ae7feeef` - Premium dark glassmorphism theme
- `cc5e31ca0` - Complete premium dark glassmorphism rollout
- `a3733663c` - Transform UI with premium components
- `033c096f1` - Redesign landing page with design system

To view changes: `git show <commit-hash>`
