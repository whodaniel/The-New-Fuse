# The New Fuse - Visual UX Inspection Checklist

**Audit Date**: December 8, 2025 **Server**: http://localhost:3000 **Branch**:
`claude/audit-ux-pages-01Q6nfpukMMzrjryEN6d1oyG`

---

## Inspection Criteria

For each page, we will evaluate:

### 1. Visual Consistency ✨

- [ ] Color scheme matches brand guidelines
- [ ] Typography is consistent (font families, sizes, weights)
- [ ] Spacing and padding follow design system
- [ ] Component styling is uniform across pages
- [ ] Icons and imagery maintain consistent style

### 2. Navigation & Structure 🧭

- [ ] Header is present and functional
- [ ] Footer is present and functional
- [ ] Navigation links work correctly
- [ ] Breadcrumbs (if applicable) show correct path
- [ ] Back/home buttons function properly

### 3. Branding & Identity 🎨

- [ ] Logo appears correctly
- [ ] Brand colors are properly applied
- [ ] Voice and tone are consistent
- [ ] Visual hierarchy is clear

### 4. Responsive Design 📱

- [ ] Desktop view (1920x1080)
- [ ] Laptop view (1366x768)
- [ ] Tablet view (768x1024)
- [ ] Mobile view (375x667)
- [ ] No horizontal scroll
- [ ] Touch targets are appropriate size

### 5. Loading & Error States ⚡

- [ ] Loading indicators appear correctly
- [ ] Error messages are user-friendly
- [ ] Empty states are handled gracefully
- [ ] Skeleton screens (if applicable) match final layout

### 6. Interactive Elements 🎯

- [ ] Buttons have hover states
- [ ] Links are visually distinct
- [ ] Forms have proper validation
- [ ] Inputs have focus states
- [ ] Tooltips work correctly

### 7. Accessibility ♿

- [ ] Keyboard navigation works
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG standards
- [ ] ARIA labels are present where needed
- [ ] Screen reader compatible

### 8. Performance ⚡

- [ ] Page loads quickly (< 3s)
- [ ] Images are optimized
- [ ] No layout shift (CLS)
- [ ] Animations are smooth
- [ ] No console errors

### 9. Content Quality 📝

- [ ] Text is clear and concise
- [ ] No typos or grammatical errors
- [ ] Images have alt text
- [ ] Links are descriptive
- [ ] Calls-to-action are clear

### 10. SEO & Metadata 🔍

- [ ] Page title is present and unique
- [ ] Meta description is present
- [ ] OG tags for social sharing
- [ ] Favicon loads correctly
- [ ] URLs are clean and descriptive

---

## Pages to Inspect

### ✅ Priority 1: New Informational Pages (NEWLY ROUTED)

1. **Pricing** (`/pricing`)
   - [ ] All inspection criteria
   - [ ] Screenshot taken
   - Issues: **\*\***\_**\*\***

2. **Features** (`/features`)
   - [ ] All inspection criteria
   - [ ] Screenshot taken
   - Issues: **\*\***\_**\*\***

3. **Docs** (`/docs`)
   - [ ] All inspection criteria
   - [ ] Screenshot taken
   - Issues: **\*\***\_**\*\***

4. **Support** (`/support`)
   - [ ] All inspection criteria
   - [ ] Screenshot taken
   - Issues: **\*\***\_**\*\***

5. **Integrations** (`/integrations`)
   - [ ] All inspection criteria
   - [ ] Screenshot taken
   - Issues: **\*\***\_**\*\***

6. **Blog** (`/blog`)
   - [ ] All inspection criteria
   - [ ] Screenshot taken
   - Issues: **\*\***\_**\*\***

### ✅ Priority 2: Landing & Marketing

7. **Landing Page** (`/`)
   - [ ] All inspection criteria
   - [ ] Screenshot taken
   - Issues: **\*\***\_**\*\***

8. **Privacy Policy** (`/legal/privacy-policy`)
   - [ ] All inspection criteria
   - [ ] Screenshot taken
   - Issues: **\*\***\_**\*\***

9. **Terms of Service** (`/legal/terms-of-service`)
   - [ ] All inspection criteria
   - [ ] Screenshot taken
   - Issues: **\*\***\_**\*\***

### ✅ Priority 3: Authentication Flow

10. **Login** (`/auth/login`)
    - [ ] All inspection criteria
    - [ ] Screenshot taken
    - Issues: **\*\***\_**\*\***

11. **Register** (`/auth/register`)
    - [ ] All inspection criteria
    - [ ] Screenshot taken
    - Issues: **\*\***\_**\*\***

12. **Forgot Password** (`/auth/forgot-password`)
    - [ ] All inspection criteria
    - [ ] Screenshot taken
    - Issues: **\*\***\_**\*\***

### ✅ Priority 4: Core Application (Requires Auth)

13. **Dashboard** (`/dashboard`)
    - [ ] All inspection criteria
    - [ ] Screenshot taken
    - Issues: **\*\***\_**\*\***

14. **AI Agent Portal** (`/ai-portal`)
    - [ ] All inspection criteria
    - [ ] Screenshot taken
    - Issues: **\*\***\_**\*\***

15. **Analytics** (`/analytics`)
    - [ ] All inspection criteria
    - [ ] Screenshot taken
    - Issues: **\*\***\_**\*\***

16. **Onboarding Flow** (`/onboarding`)
    - [ ] All inspection criteria
    - [ ] Screenshot taken
    - Issues: **\*\***\_**\*\***

### ✅ Priority 5: Demos

17. **Timeline Demo** (`/timeline-demo`)
    - [ ] All inspection criteria
    - [ ] Screenshot taken
    - Issues: **\*\***\_**\*\***

18. **Graph Demo** (`/graph-demo`)
    - [ ] All inspection criteria
    - [ ] Screenshot taken
    - Issues: **\*\***\_**\*\***

### ✅ Priority 6: Error Handling

19. **404 Not Found** (`/some-non-existent-page`)
    - [ ] All inspection criteria
    - [ ] Screenshot taken
    - Issues: **\*\***\_**\*\***

---

## Common Issues to Look For

### Layout Issues

- [ ] Overlapping content
- [ ] Misaligned elements
- [ ] Broken grid systems
- [ ] Inconsistent margins/padding
- [ ] Content overflow

### Typography Issues

- [ ] Font loading failures
- [ ] Inconsistent font sizes
- [ ] Poor readability (line height, letter spacing)
- [ ] Hierarchy problems

### Color Issues

- [ ] Insufficient contrast
- [ ] Inconsistent color usage
- [ ] Missing dark mode support
- [ ] Broken theme switching

### Interactive Issues

- [ ] Non-functional buttons
- [ ] Broken links
- [ ] Missing hover states
- [ ] Poor focus indicators
- [ ] Form validation problems

### Performance Issues

- [ ] Slow page loads
- [ ] Large unoptimized images
- [ ] JavaScript errors
- [ ] Memory leaks
- [ ] Excessive re-renders

---

## Screenshot Naming Convention

Screenshots will be saved with the following pattern:

```
screenshots/YYYY-MM-DD-{page-name}-{viewport}.png
```

Example:

- `screenshots/2025-12-08-pricing-desktop.png`
- `screenshots/2025-12-08-pricing-mobile.png`
- `screenshots/2025-12-08-landing-desktop.png`

---

## Inspection Process

1. **Open page in browser**
2. **Quick visual scan** - Look for obvious issues
3. **Test all viewports** - Desktop → Tablet → Mobile
4. **Test interactivity** - Click all buttons, links, forms
5. **Check console** - Look for errors
6. **Take screenshots** - All viewports
7. **Document issues** - Note any problems found
8. **Assign severity**:
   - 🔴 Critical (Broken functionality, major visual bug)
   - 🟡 Warning (Minor visual issue, suboptimal UX)
   - 🟢 Info (Enhancement opportunity)

---

## Next Steps After Inspection

1. Categorize all issues by severity
2. Create actionable tickets for fixes
3. Prioritize based on user impact
4. Document best practices for consistency
5. Create design system documentation
6. Set up automated visual regression testing

---

_This checklist will be filled out as we inspect each page._
