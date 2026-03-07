# UI/UX QUALITY ASSURANCE CHECKLIST

## 🚨 MANDATORY PRE-DEPLOYMENT CHECKS

**CRITICAL**: Before marking ANY page as complete, you MUST verify ALL items
below.

---

## 1. VISUAL RENDERING VERIFICATION

### Browser Testing (REQUIRED)

- [ ] Open page in actual browser at `localhost:3001`
- [ ] Take screenshots at multiple scroll positions
- [ ] Verify NO elements are rendering at incorrect sizes
- [ ] Verify NO elements are overlapping or covering content
- [ ] Verify ALL text is readable (not too small, not cut off)
- [ ] Verify ALL icons are correct size (typically 16-24px)
- [ ] Verify ALL images/SVGs render at intended dimensions

### Common SVG Issues to Check

- [ ] SVGs have explicit `width` and `height` attributes OR
      `className="w-X h-X"`
- [ ] SVGs have `viewBox` attribute set correctly
- [ ] SVGs are NOT expanding to fill parent container unexpectedly
- [ ] SVG paths have proper `fill` colors (not `currentColor` unless intended)
- [ ] Test: Remove SVG and re-add to verify it doesn't break layout

### Layout Verification

- [ ] Card/container backgrounds are visible (not transparent/invisible)
- [ ] Form inputs have visible borders and backgrounds
- [ ] Buttons are properly sized (56-80px tall for primary CTAs)
- [ ] Spacing between elements is consistent (16-32px minimum)
- [ ] No elements are cut off at viewport edges

---

## 2. CONTRAST & READABILITY

### Text Contrast (WCAG AAA: 7:1 for body text)

- [ ] Headings: White (#FFFFFF) on dark backgrounds
- [ ] Body text: Light gray (#CBD5E1 or lighter) on dark
- [ ] Labels: Medium gray (#94A3B8 or lighter) on dark
- [ ] Placeholder text: Visible but subtle (#64748B)
- [ ] Links: Blue (#60A5FA) with hover state (#93C5FD)

### Input Field Visibility

- [ ] Input backgrounds: Semi-transparent with visible contrast
- [ ] Input borders: Clearly visible (border-white/20 minimum)
- [ ] Focus states: Blue ring (ring-2 ring-blue-500)
- [ ] Placeholder text is readable
- [ ] Input text is white/light colored

---

## 3. COMPONENT USAGE

### DO Use

- [ ] Lucide React icons (consistent library)
- [ ] Framer Motion for animations
- [ ] Tailwind utility classes
- [ ] Semantic HTML (`<main>`, `<section>`, `<article>`)

### DO NOT Use

- [ ] Multiple icon libraries mixed together
- [ ] Inline styles (use Tailwind classes)
- [ ] Generic/vague copy ("Click here", "Submit")
- [ ] System fonts (use Inter, Plus Jakarta Sans, etc.)

---

## 4. TYPOGRAPHY HIERARCHY

### Size Requirements (from ULTIMATE_UX_DESIGNER_BRIEF.md)

- [ ] Page H1: 48-72px (`text-5xl` to `text-7xl`)
- [ ] Section H2: 36-48px (`text-4xl` to `text-5xl`)
- [ ] Section H3: 24-32px (`text-2xl` to `text-3xl`)
- [ ] Body text: 16-18px minimum (`text-base` to `text-lg`)
- [ ] Small text: 14px minimum (`text-sm`)

### Font Weights

- [ ] Headings: Bold (`font-bold`)
- [ ] Subheadings: Semibold (`font-semibold`)
- [ ] Body: Regular (`font-normal` or `font-medium`)

---

## 5. COPY QUALITY

### Platform-Specific Terminology (REQUIRED)

- [ ] Use "AI Command Center" (not "platform")
- [ ] Use "Autonomous Agents" (not "bots" or "AI assistants")
- [ ] Use "Self-Evolving Systems" (not "automated workflows")
- [ ] Use "Deploy" not "Create" or "Make"
- [ ] Use "Launch" not "Start" or "Begin"

### CTA Button Text

- [ ] Action-oriented: "Start Building Free", "Deploy Your First Agent"
- [ ] NOT generic: "Submit", "Click Here", "Learn More"
- [ ] Include benefit: "Free" or "No Credit Card Required"

---

## 6. SPACING & LAYOUT

### Card/Container Padding

- [ ] Minimum 32px padding (`p-8`)
- [ ] Recommended 48px for important cards (`p-12`)
- [ ] Consistent padding across all sides

### Section Spacing

- [ ] Vertical spacing between sections: 64-100px (`space-y-16` to `space-y-24`)
- [ ] Spacing between form fields: 16-24px (`space-y-4` to `space-y-6`)
- [ ] Spacing between elements in a group: 8-16px (`space-y-2` to `space-y-4`)

### Touch Targets

- [ ] Buttons: Minimum 44x44px (preferably 56-80px tall)
- [ ] Checkboxes/Radio: Minimum 20x20px
- [ ] Links: Adequate padding around clickable area

---

## 7. ANIMATIONS & INTERACTIONS

### Framer Motion Usage

- [ ] Page entrance: Fade in + slide up
- [ ] Stagger children elements (delay: 0.1-0.2s between)
- [ ] Hover states: Scale 1.02-1.05 or translate
- [ ] Duration: 200-300ms for interactions
- [ ] Respect `prefers-reduced-motion`

### Button States

- [ ] Default: Gradient background
- [ ] Hover: Lighter gradient + scale-[1.02]
- [ ] Active: scale-[0.98]
- [ ] Disabled: opacity-50 + cursor-not-allowed
- [ ] Loading: Spinner + "Processing..." text

---

## 8. ACCESSIBILITY (WCAG 2.1 AAA)

### Semantic HTML

- [ ] Proper heading hierarchy (H1 → H2 → H3, no skipping)
- [ ] Form labels associated with inputs (`htmlFor` + `id`)
- [ ] Buttons use `<button>` (not `<div>` with `onClick`)
- [ ] Links use `<Link>` or `<a>` (not buttons)

### ARIA Labels

- [ ] All interactive elements have accessible names
- [ ] Form inputs have labels (visible or `aria-label`)
- [ ] Icon-only buttons have `aria-label`
- [ ] Error messages have `role="alert"`

### Keyboard Navigation

- [ ] Tab order is logical
- [ ] Focus states are visible (ring-2 ring-blue-500)
- [ ] Enter key submits forms
- [ ] Escape key closes modals/dialogs

---

## 9. BROWSER TESTING

### Required Browsers

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Responsive Breakpoints

- [ ] 375px (mobile)
- [ ] 768px (tablet)
- [ ] 1024px (laptop)
- [ ] 1440px (desktop)
- [ ] 1920px (large desktop)

---

## 10. PERFORMANCE

### Lighthouse Scores (Required)

- [ ] Performance: 90+
- [ ] Accessibility: 95+
- [ ] Best Practices: 90+
- [ ] SEO: 90+

### Optimization

- [ ] Images lazy-loaded
- [ ] No console errors
- [ ] No console warnings
- [ ] Build completes without errors
- [ ] No TypeScript errors

---

## 11. CODE QUALITY

### TypeScript

- [ ] No `any` types (use proper types)
- [ ] Event handlers typed: `React.FormEvent<HTMLFormElement>`
- [ ] Change handlers typed: `React.ChangeEvent<HTMLInputElement>`
- [ ] Map callbacks typed: `.map((item: Type) => ...)`

### Imports

- [ ] All local imports use `@/` alias
- [ ] No unused imports
- [ ] Imports organized: React → External → Internal

### Naming

- [ ] Components: PascalCase
- [ ] Functions: camelCase
- [ ] Constants: UPPER_SNAKE_CASE
- [ ] CSS classes: kebab-case (via Tailwind)

---

## 12. FINAL VERIFICATION

### Before Marking Complete

- [ ] Refresh browser and verify page loads
- [ ] Test all interactive elements (buttons, links, inputs)
- [ ] Test form submission (success and error states)
- [ ] Verify error messages display correctly
- [ ] Test loading states
- [ ] Verify navigation works (sign in link, etc.)
- [ ] Take final screenshots for documentation

### Documentation

- [ ] List all files modified
- [ ] Note any breaking changes
- [ ] Document any new components created
- [ ] Update relevant documentation files

---

## ⚠️ COMMON FAILURES TO AVOID

### SVG Issues

- ❌ Giant SVG logos covering entire page
- ✅ Always set explicit dimensions: `className="w-5 h-5 flex-shrink-0"`
- ✅ Always include `viewBox` attribute
- ✅ Test SVG in isolation before adding to page

### Contrast Issues

- ❌ Dark text on dark background
- ❌ Low contrast inputs (invisible borders)
- ✅ Use contrast checker: https://webaim.org/resources/contrastchecker/

### Layout Issues

- ❌ Elements overlapping
- ❌ Content cut off at edges
- ❌ Cramped spacing
- ✅ Use browser DevTools to inspect layout
- ✅ Test at multiple viewport sizes

### Copy Issues

- ❌ Generic "Create account" or "Submit"
- ❌ Vague "AI Platform" or "Automation Tool"
- ✅ Use platform-specific terminology
- ✅ Reference GETTING_STARTED.md for correct terms

---

## 🎯 QUALITY GATE

**A page is NOT complete until:**

1. You have personally viewed it in a browser
2. You have taken screenshots proving it works
3. All checklist items above are verified
4. Lighthouse accessibility score is 95+
5. No console errors exist
6. Build completes successfully

**If you cannot verify these items, DO NOT mark the page as complete.**

---

## 📸 SCREENSHOT REQUIREMENTS

For each completed page, provide:

1. Full page screenshot (desktop)
2. Mobile viewport screenshot (375px)
3. Hover state screenshot (buttons, links)
4. Form validation screenshot (error state)
5. Loading state screenshot (if applicable)

---

**Remember: It's better to take extra time to get it right than to ship broken
UI.**
