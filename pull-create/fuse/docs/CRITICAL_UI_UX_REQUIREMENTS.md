# CRITICAL UI/UX DESIGN REQUIREMENTS - MANDATORY READING

## ⚠️ FAILURE POINTS FROM PREVIOUS SESSIONS

### **CRITICAL ISSUE #1: VERIFY YOUR WORK IN THE BROWSER**

**Problem**: Creating designs without actually viewing them in a browser leads
to:

- Form fields stretching off-screen
- Text overlapping and jumbled together
- SVG icons rendering at massive scale (giant Google logo)
- Invisible or barely visible elements
- Gradient text effects that don't render
- Glassmorphism effects that are too subtle to see

**SOLUTION**:

1. After EVERY code change, use `browser_subagent` to navigate to the page
2. Take a screenshot
3. LOOK AT THE SCREENSHOT and verify:
   - All text is readable
   - All elements are properly sized
   - Nothing is cut off or overlapping
   - The layout looks professional
4. If you cannot verify visually, DO NOT claim the work is complete

### **CRITICAL ISSUE #2: FORM LAYOUT CONSTRAINTS**

**Problem**: Forms stretching across entire screen width

**SOLUTION**:

```tsx
// ALWAYS wrap forms in a max-width container
<div className="w-full max-w-md mx-auto">{/* form content */}</div>
```

- Use `max-w-md` (448px) for auth forms
- Use `max-w-lg` (512px) for larger forms
- Use `max-w-xl` (576px) for complex forms
- NEVER let forms exceed 600px width

### **CRITICAL ISSUE #3: SVG SIZING**

**Problem**: SVG icons expanding to fill entire screen

**SOLUTION**:

```tsx
// ALWAYS use explicit width/height attributes
<svg width="20" height="20" viewBox="0 0 24 24" className="flex-shrink-0">
  {/* paths */}
</svg>
```

- Set explicit `width` and `height` attributes (not just className)
- Add `flex-shrink-0` to prevent flex containers from shrinking
- Test SVG in isolation before adding to page

### **CRITICAL ISSUE #4: TYPOGRAPHY & SPACING**

**Problem**: Text jumbled together, poor readability

**SOLUTION**:

```tsx
// Proper spacing hierarchy
<div className="space-y-8">
  {' '}
  {/* Between major sections */}
  <div className="space-y-6">
    {' '}
    {/* Between form groups */}
    <div className="space-y-2">
      {' '}
      {/* Between label and input */}
      <label className="block text-sm font-medium">Label</label>
      <input className="w-full h-11" />
    </div>
  </div>
</div>
```

**Font Sizes**:

- Page title: `text-3xl` (30px) or `text-4xl` (36px)
- Section heading: `text-2xl` (24px)
- Labels: `text-sm` (14px)
- Body text: `text-base` (16px)
- Small text: `text-xs` (12px)

### **CRITICAL ISSUE #5: CONTRAST & VISIBILITY**

**Problem**: Elements invisible or barely visible

**SOLUTION**:

- Background: `bg-black` or `bg-slate-950`
- Cards: `bg-zinc-900` or `bg-slate-900`
- Inputs: `bg-black` with `border-zinc-700`
- Text: `text-white` for headings, `text-gray-200` for labels
- Placeholder: `placeholder-gray-500`
- Links: `text-blue-400` with `hover:text-blue-300`

**Test Contrast**: Use https://webaim.org/resources/contrastchecker/

- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text

---

## 🎯 MANDATORY WORKFLOW FOR UI WORK

### **Step 1: Plan**

1. Review existing design (take screenshot if page exists)
2. Identify specific issues
3. Plan fixes with specific CSS classes

### **Step 2: Implement**

1. Write code with proper constraints
2. Use proven patterns (see examples below)
3. No experimental effects until basics work

### **Step 3: VERIFY** (MOST IMPORTANT)

1. Use `browser_subagent` to navigate to page
2. Capture screenshot
3. Inspect screenshot for issues:
   - Is text readable?
   - Are elements properly sized?
   - Is layout clean and professional?
   - Does it look like a real company's product?
4. If NO to any question, fix and re-verify

### **Step 4: Iterate**

1. If issues found, fix them
2. Re-verify with new screenshot
3. Repeat until perfect

---

## ✅ PROVEN DESIGN PATTERNS

### **Auth Form (Login/Register)**

```tsx
<div className="min-h-screen bg-black flex items-center justify-center p-6">
  <div className="w-full max-w-md">
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Create your account</h1>
          <p className="text-gray-400">Get started in minutes</p>
        </div>

        {/* Form */}
        <form className="space-y-4">
          {/* Input Group */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Email
            </label>
            <input
              type="email"
              className="w-full h-11 px-4 bg-black border border-zinc-700 rounded-md text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="you@company.com"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  </div>
</div>
```

### **Input Field with Icon**

```tsx
<div className="space-y-2">
  <label htmlFor="email" className="block text-sm font-medium text-gray-200">
    Email
  </label>
  <div className="relative">
    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
    <input
      id="email"
      type="email"
      className="w-full h-11 pl-10 pr-4 bg-black border border-zinc-700 rounded-md text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
      placeholder="you@company.com"
    />
  </div>
</div>
```

### **Button Variants**

```tsx
{
  /* Primary */
}
<button className="h-11 px-6 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors">
  Primary Action
</button>;

{
  /* Secondary */
}
<button className="h-11 px-6 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-md transition-colors">
  Secondary Action
</button>;

{
  /* Outline */
}
<button className="h-11 px-6 border border-zinc-700 hover:border-zinc-600 text-white text-sm font-medium rounded-md transition-colors">
  Outline Action
</button>;
```

---

## 🚫 WHAT NOT TO DO

### **DON'T: Use Experimental Effects Before Basics Work**

- ❌ Complex glassmorphism
- ❌ Multiple gradient layers
- ❌ Animated background orbs
- ❌ Gradient text effects
- ❌ Shimmer animations

**DO INSTEAD**: Get the basics perfect first

- ✅ Clean layout
- ✅ Proper spacing
- ✅ Readable text
- ✅ Professional appearance

### **DON'T: Trust Your Code Without Verification**

- ❌ "The code looks good, it should work"
- ❌ "I added the classes, it must be fixed"
- ❌ "The file was written, the page is updated"

**DO INSTEAD**: Verify everything

- ✅ Take screenshots
- ✅ Inspect actual rendering
- ✅ Test in browser
- ✅ Show proof it works

### **DON'T: Overcomplicate**

- ❌ Custom animations before layout works
- ❌ Multiple color gradients everywhere
- ❌ Fancy effects that break on render

**DO INSTEAD**: Keep it simple

- ✅ Solid colors
- ✅ Clean borders
- ✅ Simple shadows
- ✅ Professional appearance

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before claiming ANY page is complete:

- [ ] I have navigated to the page in a browser
- [ ] I have taken a screenshot of the page
- [ ] I have verified the screenshot shows:
  - [ ] All text is readable
  - [ ] All elements are properly sized
  - [ ] Layout is clean and professional
  - [ ] Nothing is cut off or overlapping
  - [ ] Form fields are constrained (max-w-md)
  - [ ] Icons are correct size (16-24px)
  - [ ] Spacing is consistent
  - [ ] Colors have proper contrast
- [ ] I have tested all interactive elements
- [ ] I have verified the page works on mobile width
- [ ] I can confidently say this looks like a $100M company's product

**If you cannot check ALL boxes above, the work is NOT complete.**

---

## 🎨 DESIGN INSPIRATION SOURCES

When in doubt, reference these companies' designs:

- **Vercel**: Clean, minimal, professional
- **Linear**: Modern, fast, beautiful
- **Stripe**: Simple, trustworthy, elegant
- **GitHub**: Functional, clear, accessible

**DO NOT** try to be more creative than these companies. They have teams of
designers. Copy what works.

---

## 💡 KEY PRINCIPLES

1. **Simplicity First**: Get basic layout working before adding effects
2. **Verify Everything**: Never trust code without seeing it render
3. **Constraints Matter**: Use max-width, proper spacing, consistent sizing
4. **Contrast is Critical**: If you can't read it, it's broken
5. **Professional > Creative**: A clean, working design beats a broken fancy one

---

## 🔧 DEBUGGING CHECKLIST

If the design looks broken:

1. **Check max-width**: Is the container constrained?

   ```tsx
   <div className="w-full max-w-md"> {/* Add this */}
   ```

2. **Check spacing**: Are elements using space-y-\*?

   ```tsx
   <div className="space-y-4"> {/* Add this */}
   ```

3. **Check input sizing**: Are inputs using h-11?

   ```tsx
   <input className="h-11 w-full"> {/* Add this */}
   ```

4. **Check SVG sizing**: Does SVG have explicit width/height?

   ```tsx
   <svg width="20" height="20"> {/* Add this */}
   ```

5. **Check contrast**: Is text readable?
   ```tsx
   <p className="text-white"> {/* Not text-gray-900 on dark bg */}
   ```

---

## 📸 SCREENSHOT REQUIREMENTS

For EVERY page you work on, provide:

1. **Before screenshot** (if modifying existing page)
2. **After screenshot** showing the fix
3. **Mobile screenshot** (375px width)
4. **Hover state screenshot** (if interactive elements)

Store screenshots in `.gemini/antigravity/brain/` with descriptive names.

---

## ⚡ QUICK REFERENCE

**Container Widths**:

- Auth forms: `max-w-md` (448px)
- Content: `max-w-2xl` (672px)
- Wide content: `max-w-4xl` (896px)

**Spacing Scale**:

- Tight: `space-y-2` (8px)
- Normal: `space-y-4` (16px)
- Relaxed: `space-y-6` (24px)
- Loose: `space-y-8` (32px)

**Input Heights**:

- Small: `h-9` (36px)
- Medium: `h-11` (44px) ← Use this for most inputs
- Large: `h-14` (56px)

**Border Radius**:

- Small: `rounded` (4px)
- Medium: `rounded-md` (6px)
- Large: `rounded-lg` (8px)
- Extra large: `rounded-xl` (12px)

---

## 🎯 SUCCESS CRITERIA

A page is successful when:

1. It looks professional (like Vercel, Linear, Stripe)
2. All text is readable
3. Layout is clean and organized
4. Interactive elements are obvious
5. Mobile layout works
6. You would be proud to show it to a customer

**If it doesn't meet ALL criteria, keep working.**

---

**Remember: It's better to deliver a simple, working design than a complex,
broken one.**
