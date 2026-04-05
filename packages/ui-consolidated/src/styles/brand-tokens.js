/**
 * The New Fuse - Brand Design Tokens
 * "World Class or Nothing"
 *
 * This file contains the core brand tokens that should be used consistently
 * across all TNF applications: Frontend, Tauri Desktop, Chrome Extension, etc.
 */
// ============================================
// BRAND COLORS
// ============================================
export const brandColors = {
    // Deep Space Background System
    obsidian: '#020617', // Primary background
    slateDark: '#0f172a', // Secondary background
    slate: '#1e293b', // Card backgrounds
    slateLight: '#334155', // Sidebar, elevated surfaces
    // Primary Gradient Colors
    primaryStart: '#667eea', // Gradient start
    primaryEnd: '#764ba2', // Gradient end
    primary: '#7c3aed', // Main primary
    primaryLight: '#8b5cf6', // Lighter variant
    primaryDark: '#6d28d9', // Darker variant
    // Electric Blue (CTAs)
    electricBlue: '#3b82f6',
    electricBlueHover: '#2563eb',
    electricBlueDark: '#1d4ed8',
    // Accent Colors
    cyan: '#06b6d4',
    cyanLight: '#22d3ee',
    violet: '#8b5cf6',
    purple: '#a855f7',
    fuchsia: '#d946ef',
    pink: '#ec4899', // Neon Pink for highlights
    // Semantic Colors
    success: '#10b981',
    successHover: '#059669',
    warning: '#f59e0b',
    warningHover: '#d97706',
    error: '#ef4444',
    errorHover: '#dc2626',
    info: '#3b82f6',
    // Workflow System Colors (Functional)
    agents: '#4f46e5', // Indigo
    tools: '#10b981', // Emerald
    prompts: '#8b5cf6', // Violet
    logic: '#f59e0b', // Amber
    // Text Colors
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
};
// ============================================
// GRADIENTS
// ============================================
export const gradients = {
    // Primary Brand Gradient (Text clips, hero elements)
    brand: 'linear-gradient(to right, #60a5fa, #a78bfa, #f472b6)',
    // Header Gradient
    header: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    // Action Gradient (Buttons, CTAs)
    action: 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
    // Deep Space Background
    deepSpace: `
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 80% 0%, rgba(139, 92, 246, 0.05) 0%, transparent 40%),
    linear-gradient(180deg, #020617 0%, #0f172a 100%)
  `,
    // Surface Highlight
    surfaceHighlight: 'linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 100%)',
};
// ============================================
// GLASSMORPHISM
// ============================================
export const glass = {
    surface: 'rgba(255, 255, 255, 0.02)',
    surfaceHover: 'rgba(255, 255, 255, 0.05)',
    surfaceActive: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderHover: 'rgba(255, 255, 255, 0.12)',
    blur: '24px',
    blurMd: '16px',
    blurSm: '10px',
};
// ============================================
// SHADOWS
// ============================================
export const shadows = {
    sm: '0 2px 8px rgba(0, 0, 0, 0.2)',
    md: '0 4px 16px rgba(0, 0, 0, 0.25)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.36)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glow: '0 0 20px rgba(124, 58, 237, 0.3)',
    glowBlue: '0 0 20px rgba(59, 130, 246, 0.3)',
    glowSm: '0 0 10px rgba(59, 130, 246, 0.3)',
    glowMd: '0 0 20px rgba(59, 130, 246, 0.4)',
    glowLg: '0 0 30px rgba(59, 130, 246, 0.5)',
};
// ============================================
// TYPOGRAPHY
// ============================================
export const typography = {
    fontFamily: {
        heading: "'Outfit', 'Plus Jakarta Sans', sans-serif",
        body: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        mono: "'JetBrains Mono', 'Fira Code', 'Monaco', monospace",
    },
    fontSize: {
        xs: '0.75rem', // 12px
        sm: '0.875rem', // 14px
        base: '1rem', // 16px
        lg: '1.125rem', // 18px
        xl: '1.25rem', // 20px
        '2xl': '1.5rem', // 24px
        '3xl': '2rem', // 32px
        '4xl': '2.5rem', // 40px
        '5xl': '3rem', // 48px
    },
    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        black: '900',
    },
    letterSpacing: {
        tight: '-0.02em',
        normal: '0',
        wide: '0.02em',
        wider: '0.05em',
    },
};
// ============================================
// SPACING
// ============================================
export const spacing = {
    xxs: '0.25rem', // 4px
    xs: '0.5rem', // 8px
    sm: '0.75rem', // 12px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
    '3xl': '4rem', // 64px
};
// ============================================
// BORDER RADIUS
// ============================================
export const borderRadius = {
    none: '0',
    sm: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
};
// ============================================
// TRANSITIONS
// ============================================
export const transitions = {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '400ms ease',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
};
// ============================================
// Z-INDEX
// ============================================
export const zIndex = {
    behind: -1,
    base: 0,
    dropdown: 100,
    sticky: 200,
    overlay: 300,
    modal: 400,
    popover: 500,
    tooltip: 600,
    max: 9999,
};
// ============================================
// COMPLETE THEME EXPORT
// ============================================
export const tnfBrandTheme = {
    colors: brandColors,
    gradients,
    glass,
    shadows,
    typography,
    spacing,
    borderRadius,
    transitions,
    zIndex,
};
// CSS Variables Generator (for use in CSS files)
export const generateCSSVariables = () => `
:root {
  /* Deep Space Background Colors */
  --tnf-obsidian: ${brandColors.obsidian};
  --tnf-slate-dark: ${brandColors.slateDark};
  --tnf-slate: ${brandColors.slate};
  --tnf-slate-light: ${brandColors.slateLight};

  /* Primary Gradient Colors */
  --tnf-primary-start: ${brandColors.primaryStart};
  --tnf-primary-end: ${brandColors.primaryEnd};
  --tnf-primary: ${brandColors.primary};
  --tnf-primary-light: ${brandColors.primaryLight};
  --tnf-primary-dark: ${brandColors.primaryDark};

  /* Electric Blue */
  --tnf-electric-blue: ${brandColors.electricBlue};

  /* Accent Colors */
  --tnf-cyan: ${brandColors.cyan};
  --tnf-cyan-light: ${brandColors.cyanLight};
  --tnf-violet: ${brandColors.violet};
  --tnf-purple: ${brandColors.purple};
  --tnf-pink: ${brandColors.pink};

  /* Semantic Colors */
  --tnf-success: ${brandColors.success};
  --tnf-warning: ${brandColors.warning};
  --tnf-error: ${brandColors.error};
  --tnf-info: ${brandColors.info};

  /* Workflow Colors */
  --tnf-agents: ${brandColors.agents};
  --tnf-tools: ${brandColors.tools};
  --tnf-prompts: ${brandColors.prompts};
  --tnf-logic: ${brandColors.logic};

  /* Text Colors */
  --tnf-text-primary: ${brandColors.textPrimary};
  --tnf-text-secondary: ${brandColors.textSecondary};
  --tnf-text-muted: ${brandColors.textMuted};

  /* Surface Colors (Glassmorphism) */
  --tnf-surface: ${glass.surface};
  --tnf-surface-hover: ${glass.surfaceHover};
  --tnf-surface-active: ${glass.surfaceActive};
  --tnf-border: ${glass.border};
  --tnf-border-hover: ${glass.borderHover};

  /* Shadows */
  --tnf-shadow-sm: ${shadows.sm};
  --tnf-shadow-md: ${shadows.md};
  --tnf-shadow-lg: ${shadows.lg};
  --tnf-shadow-glow: ${shadows.glow};

  /* Typography */
  --tnf-font-heading: ${typography.fontFamily.heading};
  --tnf-font-body: ${typography.fontFamily.body};
  --tnf-font-mono: ${typography.fontFamily.mono};

  /* Spacing */
  --tnf-space-xxs: ${spacing.xxs};
  --tnf-space-xs: ${spacing.xs};
  --tnf-space-sm: ${spacing.sm};
  --tnf-space-md: ${spacing.md};
  --tnf-space-lg: ${spacing.lg};
  --tnf-space-xl: ${spacing.xl};

  /* Border Radius */
  --tnf-radius-sm: ${borderRadius.sm};
  --tnf-radius-md: ${borderRadius.md};
  --tnf-radius-lg: ${borderRadius.lg};
  --tnf-radius-xl: ${borderRadius.xl};
  --tnf-radius-full: ${borderRadius.full};

  /* Transitions */
  --tnf-transition-fast: ${transitions.fast};
  --tnf-transition-normal: ${transitions.normal};
  --tnf-transition-slow: ${transitions.slow};
}
`;
export default tnfBrandTheme;
