/**
 * @file This file documents the design system for the application, providing a centralized reference for visual consistency.
 * It covers the color palette, typography, spacing, border radius, shadows, animations, and button patterns.
 * All design tokens are managed through Tailwind CSS and CSS variables to ensure a single source of truth.
 */

// --- COLOR PALETTE ---
/**
 * The color palette is defined using CSS variables in `apps/frontend/src/index.css` and mapped in `tailwind.config.ts`.
 * This approach allows for easy theming (e.g., light and dark modes) and consistent color usage across the application.
 *
 * Main color categories include:
 * - **Primary:** The main brand color, used for primary actions and highlights.
 * - **Secondary:** The secondary brand color, used for less prominent actions and accents.
 * - **Background:** The main background color of the application.
 * - **Foreground:** The main text color.
 * - **Card:** The background color for card components.
 * - **Destructive:** The color for destructive actions (e.g., delete).
 * - **Muted:** A muted color for less important text and elements.
 * - **Accent:** An accent color for highlighting elements.
 * - **Border:** The default border color.
 * - **Input:** The default input border color.
 * - **Ring:** The color for focus rings.
 * - **Surface:** The color for elevated surfaces (e.g., modals, dropdowns).
 * - **Success:** The color for success states.
 * - **Warning:** The color for warning states.
 */

// --- TYPOGRAPHY ---
/**
 * Typography is managed through the `theme.extend.fontFamily` and `theme.extend.fontSize` sections of `tailwind.config.ts`.
 *
 * - **Font Families:**
 *   - `sans`: 'Plus Jakarta Sans', sans-serif (for body text)
 *   - `heading`: 'Outfit', sans-serif (for headings)
 *
 * - **Font Sizes:** A range of font sizes from `xs` to `8xl` is defined, each with a specific line height, letter spacing, and font weight.
 */

// --- SPACING ---
/**
 * The spacing scale is defined in `tailwind.config.ts` and is restricted to the following values to ensure consistent layouts:
 * - `xs`: 4px
 * - `sm`: 8px
 * - `md`: 16px
 * - `lg`: 24px
 * - `xl`: 32px
 */

// --- BORDER RADIUS ---
/**
 * Border radius values are standardized to the following:
 * - `rounded-lg`: 1rem
 * - `rounded-xl`: 1.5rem
 * - `rounded-2xl`: 2rem
 */

// --- SHADOWS ---
/**
 * Shadow styles are limited to the following for visual consistency:
 * - `shadow-lg`: A larger, more prominent shadow.
 * - `shadow-xl`: An extra-large shadow for elevated elements.
 */

// --- ANIMATIONS ---
/**
 * Standardized animations are defined in `tailwind.config.ts` with consistent timing and easing functions.
 * Available animations include:
 * - `fade-in`: 0.5s ease-in-out
 * - `slide-in-up`: 0.5s ease-out
 * - `slide-in-down`: 0.5s ease-out
 * - `slide-in-left`: 0.3s ease-out
 * - `slide-in-right`: 0.3s ease-out
 * - `scale-in`: 0.3s ease-out
 */

// --- BUTTONS ---
/**
 * Button styles are managed by the `Button` component in the `@the-new-fuse/ui-consolidated` package.
 * The component uses `class-variance-authority` (CVA) to define a set of consistent button patterns.
 *
 * - **Variants:**
 *   - `default`: Primary button style.
 *   - `destructive`: For actions that delete or destroy data.
 *   - `outline`: A button with a border and transparent background.
 *   - `secondary`: A less prominent button style.
 *   - `ghost`: A button with no background or border.
 *   - `link`: A button that looks like a hyperlink.
 *
 * - **Sizes:**
 *   - `default`: The standard button size.
 *   - `sm`: A smaller button.
 *   - `lg`: A larger button.
 *   - `icon`: For buttons that only contain an icon.
 */
export {};
