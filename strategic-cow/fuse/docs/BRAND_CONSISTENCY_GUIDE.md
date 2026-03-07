# TNF Brand Consistency Guide

## Brand Architecture Overview

### The New Fuse Ecosystem

| Product               | Official Name        | Type             | Primary Logo         |
| --------------------- | -------------------- | ---------------- | -------------------- |
| **Main Platform**     | The New Fuse (TNF)   | SaaS Website     | **🌟 Neon Monogram** |
| **Desktop App**       | **Fuse Desktop**     | Tauri/Desktop    | **🌟 Neon Monogram** |
| **Cloud IDE**         | **SkIDEancer**       | SkIDEancer-based IDE  | **🌟 Neon Monogram** |
| **Browser Extension** | **Fuse Connect**     | Chrome Extension | **🌟 Neon Monogram** |
| **VS Code Extension** | **Fuse for VS Code** | IDE Extension    | **🌟 Neon Monogram** |

---

## 🌟 PRIMARY LOGO: Neon Monogram

> **The Neon Monogram is the official primary logo for ALL TNF products.**

### Description

Futuristic 3D intertwining "TNF" letters with glowing cyan and purple accents.
Features a cyberpunk aesthetic that embodies the "Deep Space Premium Dark"
design philosophy.

### File Location

```
/apps/frontend/public/assets/brand/logo-monogram-neon.png
```

### Pre-Generated Sizes

```
/assets/brand/icons/
├── icon-16.png   (16x16)   - Favicons, toolbar
├── icon-32.png   (32x32)   - Favicons, small icons
├── icon-48.png   (48x48)   - Extension icons
├── icon-64.png   (64x64)   - Medium icons
├── icon-128.png  (128x128) - Large icons
├── icon-192.png  (192x192) - PWA icons
├── icon-256.png  (256x256) - App icons
├── icon-512.png  (512x512) - Splash, Store listing
```

### Alternative Logos (Secondary Use)

| Logo                 | File                         | Use Case                          |
| -------------------- | ---------------------------- | --------------------------------- |
| ✨ Abstract Gradient | `logo-abstract-gradient.png` | Print materials, formal documents |
| 🔗 Circuit Network   | `logo-circuit-node.png`      | Technical documentation, API docs |

### Logo Placement by Product

#### thenewfuse.com (Website)

| Location    | Logo          | Size                | Format  |
| ----------- | ------------- | ------------------- | ------- |
| Header/Nav  | Neon Monogram | 40px height         | PNG/SVG |
| Favicon     | Neon Monogram | 16x16, 32x32, 48x48 | ICO     |
| Footer      | Neon Monogram | 32px height         | PNG     |
| Apple Touch | Neon Monogram | 180x180             | PNG     |
| Open Graph  | Neon Monogram | 1200x630            | PNG     |
| PWA Icons   | Neon Monogram | 192x192, 512x512    | PNG     |

#### Fuse Desktop (Tauri App)

| Location           | Logo              | Size    | Format  |
| ------------------ | ----------------- | ------- | ------- |
| Window Title Bar   | Abstract Gradient | 24px    | ICO/PNG |
| App Icon (macOS)   | Abstract Gradient | 512x512 | ICNS    |
| App Icon (Windows) | Abstract Gradient | 256x256 | ICO     |
| Splash Screen      | Abstract Gradient | 256px   | PNG     |
| About Dialog       | Abstract Gradient | 128px   | PNG     |
| Dock/Taskbar       | Abstract Gradient | 128x128 | PNG     |

#### SkIDEancer (SkIDEancer IDE)

| Location     | Logo                        | Size             | Format  |
| ------------ | --------------------------- | ---------------- | ------- |
| Browser Tab  | Circuit Network             | 16x16, 32x32     | ICO/PNG |
| Welcome Page | Circuit Network             | 128px            | SVG/PNG |
| Activity Bar | Circuit Network             | 24px             | SVG     |
| About/Help   | Circuit Network + Full Name | 256px            | PNG     |
| PWA Icons    | Circuit Network             | 192x192, 512x512 | PNG     |

#### Fuse Connect (Chrome Extension)

| Location     | Logo          | Size                  | Format |
| ------------ | ------------- | --------------------- | ------ |
| Toolbar Icon | Neon Monogram | 16x16, 48x48, 128x128 | PNG    |
| Popup Header | Neon Monogram | 32px                  | PNG    |
| Options Page | Neon Monogram | 48px                  | PNG    |
| Chrome Store | Neon Monogram | 128x128, 440x280      | PNG    |

---

## 🎨 Color Palette: "Deep Space Premium Dark"

### Primary Colors

| Name              | Hex       | Usage                     |
| ----------------- | --------- | ------------------------- |
| **Deep Obsidian** | `#020617` | Primary background        |
| **Electric Blue** | `#3b82f6` | CTAs, Primary actions     |
| **Cosmic Purple** | `#a855f7` | Secondary accent          |
| **Neon Pink**     | `#ec4899` | Highlights, Active states |
| **Cyan Glow**     | `#06b6d4` | Success, Connected states |

### Gradient Definitions

```css
/* Brand Gradient (Hero, Text clips) */
--tnf-gradient-brand: linear-gradient(to right, #60a5fa, #a78bfa, #f472b6);

/* Action Gradient (Buttons) */
--tnf-gradient-action: linear-gradient(45deg, #3b82f6, #1d4ed8);

/* Header Gradient */
--tnf-gradient-header: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Deep Space Background */
--tnf-gradient-space:
  radial-gradient(
    ellipse 80% 50% at 50% -20%,
    rgba(6, 182, 212, 0.08) 0%,
    transparent 50%
  ),
  radial-gradient(
    ellipse 60% 40% at 80% 0%,
    rgba(139, 92, 246, 0.05) 0%,
    transparent 40%
  ),
  linear-gradient(180deg, #020617 0%, #0f172a 100%);
```

---

## 📐 Typography

### Font Stack

| Usage        | Font Family       | Fallbacks                                   |
| ------------ | ----------------- | ------------------------------------------- |
| **Headings** | Outfit            | Plus Jakarta Sans, sans-serif               |
| **Body**     | Plus Jakarta Sans | -apple-system, BlinkMacSystemFont, Segoe UI |
| **Code**     | JetBrains Mono    | Fira Code, Monaco, monospace                |

### Type Scale

```css
--tnf-text-xs: 0.75rem; /* 12px */
--tnf-text-sm: 0.875rem; /* 14px */
--tnf-text-base: 1rem; /* 16px */
--tnf-text-lg: 1.125rem; /* 18px */
--tnf-text-xl: 1.25rem; /* 20px */
--tnf-text-2xl: 1.5rem; /* 24px */
--tnf-text-3xl: 2rem; /* 32px */
--tnf-text-4xl: 2.5rem; /* 40px */
```

---

## 🪟 Glassmorphism Standards

### Surface Styles

```css
/* Glass Surface */
.glass-surface {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.36);
}

/* Glass Surface Hover */
.glass-surface:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.12);
}
```

### Glow Effects

```css
--tnf-glow-sm: 0 0 10px rgba(59, 130, 246, 0.3);
--tnf-glow-md: 0 0 20px rgba(59, 130, 246, 0.4);
--tnf-glow-lg: 0 0 30px rgba(59, 130, 246, 0.5);
--tnf-glow-purple: 0 0 20px rgba(168, 85, 247, 0.3);
```

---

## 📦 Required Assets Checklist

### Per Product

#### [ ] thenewfuse.com

- [ ] favicon.ico (16, 32, 48)
- [ ] apple-touch-icon.png (180x180)
- [ ] og-image.png (1200x630)
- [ ] logo-header.svg (40px height)
- [ ] logo-footer.svg (32px height)

#### [ ] Fuse Desktop (Tauri)

- [ ] icon.png (512, 256, 128, 64, 32)
- [ ] icon.ico (Windows multi-size)
- [ ] icon.icns (macOS)
- [ ] splash.png (256px centered)
- [ ] tray-icon.png (24px, 32px)

#### [ ] SkIDEancer (SkIDEancer)

- [ ] favicon.ico (16, 32, 48)
- [ ] code-192.png (PWA)
- [ ] code-512.png (PWA)
- [ ] welcome-logo.svg (128px)
- [ ] activity-bar-icon.svg (24px)

#### [ ] Fuse Connect (Chrome)

- [ ] icon16.png
- [ ] icon48.png
- [ ] icon128.png
- [ ] icon16-connected.png (state variant)
- [ ] icon48-connected.png
- [ ] icon128-connected.png
- [ ] promotional-tile.png (440x280)

---

## 🎯 Product Naming Guidelines

### Approved Names

| Short            | Full                   | Tagline                          |
| ---------------- | ---------------------- | -------------------------------- |
| **TNF**          | The New Fuse           | "Where AI Minds Unite"           |
| **Fuse Desktop** | Fuse Desktop App       | "AI Orchestration, Native Power" |
| **SkIDEancer**   | SkIDEancer IDE         | "Code Smarter, Not Harder"       |
| **Fuse Connect** | Fuse Connect Extension | "Bridge Your Browser to AI"      |

### Voice & Tone

| ✅ Do                      | ❌ Don't                    |
| -------------------------- | --------------------------- |
| "Agent Swarms"             | "Unified Agent Ecosystem"   |
| "No babysitting required." | "Manage and monitor agents" |
| "Build Your AI Empire"     | "Get Started"               |
| "Launch Fuse Desktop"      | "Download Application"      |

---

## 🔗 Cross-Product Consistency

### Navigation Elements

Every product should have easy access to others:

```
┌─────────────────────────────────────────┐
│  [Logo]  The New Fuse                   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🏠 Dashboard                    │   │
│  │  💻 Open SkIDEancer IDE          │   │ ← Links to ide.thenewfuse.com
│  │  📱 Download Fuse Desktop        │   │ ← Links to download page
│  │  🌐 Get Fuse Connect             │   │ ← Links to Chrome store
│  │  📚 Documentation                │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Footer (All Products)

```
The New Fuse © 2025
Website | Desktop App | SkIDEancer IDE | Chrome Extension | GitHub | Docs
```

---

## 📱 Responsive Breakpoints

| Breakpoint  | Width       | Usage                        |
| ----------- | ----------- | ---------------------------- |
| **Mobile**  | < 640px     | Compact nav, stacked layouts |
| **Tablet**  | 640-1024px  | Sidebar collapses            |
| **Desktop** | 1024-1280px | Full layout                  |
| **Wide**    | > 1280px    | Expanded panels              |

```css
--tnf-breakpoint-sm: 640px;
--tnf-breakpoint-md: 768px;
--tnf-breakpoint-lg: 1024px;
--tnf-breakpoint-xl: 1280px;
--tnf-breakpoint-2xl: 1536px;
```

---

## 🔄 Implementation Checklist

### Phase 1: Logo Generation

- [ ] Create SVG versions of all logos
- [ ] Generate all size variants
- [ ] Create ICO/ICNS bundles
- [ ] Design state variants (connected, error, etc.)

### Phase 2: Website Update

- [ ] Replace placeholder favicon
- [ ] Add proper OG images
- [ ] Ensure consistent header/footer

### Phase 3: Fuse Desktop Branding

- [ ] Name the app officially
- [ ] Add app icons
- [ ] Design splash screen
- [ ] Update About dialog

### Phase 4: SkIDEancer Complete Rebrand

- [ ] Replace SkIDEancer default icons
- [ ] Update welcome page
- [ ] Apply custom theme
- [ ] Add product links

### Phase 5: Chrome Extension

- [ ] Update icons
- [ ] Redesign popup header
- [ ] Add product links

---

## 📁 Asset Directory Structure

```
/assets/brand/
├── logos/
│   ├── neon-monogram/
│   │   ├── logo.svg
│   │   ├── logo-32.png
│   │   ├── logo-64.png
│   │   ├── logo-128.png
│   │   ├── logo-256.png
│   │   └── logo-512.png
│   ├── abstract-gradient/
│   │   └── ... (same sizes)
│   └── circuit-network/
│       └── ... (same sizes)
├── favicons/
│   ├── website/
│   │   ├── favicon.ico
│   │   ├── apple-touch-icon.png
│   │   └── og-image.png
│   ├── desktop/
│   │   ├── icon.ico
│   │   ├── icon.icns
│   │   └── icon.png
│   ├── ide/
│   │   └── ...
│   └── extension/
│       └── ...
└── templates/
    ├── presentation.pptx
    ├── letterhead.docx
    └── social-media/
```

---

_Last Updated: December 21, 2025_ _Version: 1.0_
