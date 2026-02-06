# Responsive Design Quick Reference

## Breakpoint Classes

Use these Tailwind classes for responsive design:

| Breakpoint | Min Width | Device        | Usage Example    |
| ---------- | --------- | ------------- | ---------------- |
| `xs:`      | 320px     | Mobile Small  | `xs:text-sm`     |
| `sm:`      | 375px     | Mobile Medium | `sm:flex-row`    |
| `md:`      | 768px     | Tablet        | `md:grid-cols-2` |
| `lg:`      | 1024px    | Laptop        | `lg:grid-cols-3` |
| `xl:`      | 1440px    | Desktop       | `xl:max-w-7xl`   |
| `2xl:`     | 1920px    | Large Desktop | `2xl:px-0`       |

## Common Responsive Patterns

### 1. Stack to Row Layout

```tsx
<div className="flex flex-col sm:flex-row gap-4">
  {/* Mobile: Stacked, Desktop: Side-by-side */}
</div>
```

### 2. Responsive Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Mobile: 1 col, Tablet: 2 col, Desktop: 3 col */}
</div>
```

### 3. Touch-Friendly Buttons

```tsx
<button className="min-h-touch px-6 py-3 text-base">
  {/* Minimum 44x44px touch target */}
</button>
```

### 4. Responsive Typography

```tsx
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
  {/* Scales from 30px → 36px → 48px → 48px */}
</h1>
```

### 5. Responsive Padding

```tsx
<section className="px-4 sm:px-6 md:px-8 lg:px-12">
  {/* Mobile: 16px, Tablet: 24px, Desktop: 32px, Large: 48px */}
</section>
```

### 6. Hide on Mobile

```tsx
<div className="hidden md:block">{/* Only visible on tablet and larger */}</div>
```

### 7. Show Only on Mobile

```tsx
<div className="md:hidden">{/* Only visible on mobile */}</div>
```

## Animation Classes

### Basic Animations

- `animate-fade-in` - Fade in effect
- `animate-slide-in-up` - Slide up with fade
- `animate-slide-in-down` - Slide down with fade
- `animate-slide-in-left` - Slide from left
- `animate-slide-in-right` - Slide from right
- `animate-scale-in` - Scale up with fade

### Stagger Animations

```tsx
<div className="animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
  {/* Delays animation by 100ms */}
</div>
```

## Mobile Navigation

### Using MobileNav Component

```tsx
import MobileNav from '@/components/MobileNav';

<MobileNav
  links={[
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
  ]}
  brandName="Your Brand"
/>;
```

## Responsive Images

### Using ResponsiveImage Component

```tsx
import ResponsiveImage from '@/components/ResponsiveImage';

<ResponsiveImage
  src="/images/hero.jpg"
  alt="Hero image"
  priority={true} // Above-the-fold
  aspectRatio="16/9"
  objectFit="cover"
  className="rounded-lg"
/>;
```

## Accessibility

### Reduced Motion

All animations automatically respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations become instant */
}
```

### Focus States

```tsx
<button className="focus:outline-none focus:ring-2 focus:ring-primary">
  {/* Visible focus ring */}
</button>
```

### ARIA Labels

```tsx
<button aria-label="Open menu" aria-expanded={isOpen}>
  {/* Screen reader friendly */}
</button>
```

## Common Mobile Issues & Solutions

### Issue: Text too small on mobile

**Solution:** Use base size of 16px minimum

```tsx
<p className="text-base md:text-lg">
```

### Issue: Buttons hard to tap

**Solution:** Use min-h-touch

```tsx
<button className="min-h-touch px-6">
```

### Issue: Horizontal scroll

**Solution:** Add overflow-x-hidden

```tsx
<div className="overflow-x-hidden">
```

### Issue: Images causing layout shift

**Solution:** Use aspect ratio

```tsx
<div className="aspect-video">
  <img src="..." className="object-cover w-full h-full" />
</div>
```

## Testing Commands

### Start Development Server

```bash
cd apps/frontend
npm run dev
```

### Open Responsive Tester

```bash
# Open test-responsive.html in browser
open apps/frontend/test-responsive.html
```

### Chrome DevTools

1. Open DevTools (F12)
2. Click Device Toolbar (Ctrl+Shift+M)
3. Select device or enter custom dimensions

## Performance Tips

1. **Lazy Load Images**: Use `loading="lazy"` or `ResponsiveImage` component
2. **Optimize Animations**: Keep under 300ms duration
3. **Use Touch Events**: Prefer `onClick` over `onMouseEnter` for mobile
4. **Avoid Hover States**: Use alternatives on mobile
5. **Test on Real Devices**: Emulators don't show all issues

## Common Utility Classes

### Spacing

- `p-4` = 16px padding
- `m-6` = 24px margin
- `gap-4` = 16px gap
- `space-y-8` = 32px vertical space between children

### Layout

- `container` = Centered container with max-width
- `mx-auto` = Center horizontally
- `flex items-center justify-center` = Center content

### Typography

- `font-bold` = Bold text
- `text-foreground` = Primary text color
- `text-muted-foreground` = Secondary text color
- `leading-tight` = Tighter line height

### Borders & Shadows

- `rounded-lg` = 8px border radius
- `shadow-lg` = Large shadow
- `border border-border` = 1px border

## Resources

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [WCAG Touch Target Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Mobile-First CSS](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Responsive/Mobile_first)

---

**Quick Checklist for New Components:**

- [ ] Mobile-first approach (design for 375px first)
- [ ] Responsive breakpoints implemented
- [ ] Touch targets minimum 44x44px
- [ ] Text minimum 16px base size
- [ ] Animations respect reduced motion
- [ ] No horizontal scrolling
- [ ] Tested on multiple devices
