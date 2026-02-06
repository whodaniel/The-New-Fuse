# Quick Start Usage Guide

## Basic Implementation

### 1. Using FeatureCard

```tsx
import { FeatureCard } from '@/components/landing';
import { Zap } from 'lucide-react';

// Simple usage
<FeatureCard
  icon={Zap}
  title="Fast Performance"
  description="Lightning-fast response times"
  accent="blue"
/>

// With image
<FeatureCard
  icon={Zap}
  title="Fast Performance"
  description="Lightning-fast response times"
  imageSrc="/images/performance.png"
  imageAlt="Performance Dashboard"
  accent="blue"
  delay={0.2}
/>
```

### 2. Using FeaturesSection

```tsx
import { FeaturesSection, FeatureCard } from '@/components/landing';
import { Brain, Network, Workflow } from 'lucide-react';

<FeaturesSection
  title="Our Features"
  subtitle="Everything you need to succeed"
  columns={3}
  id="features"
>
  <FeatureCard
    icon={Brain}
    title="AI Powered"
    description="Advanced AI capabilities"
    accent="purple"
  />
  <FeatureCard
    icon={Network}
    title="Connected"
    description="Seamless integrations"
    accent="blue"
  />
  <FeatureCard
    icon={Workflow}
    title="Automated"
    description="Streamlined workflows"
    accent="green"
  />
</FeaturesSection>;
```

### 3. Using Complete Showcase

```tsx
import { FeatureShowcase } from '@/components/landing';

// All features pre-configured
<FeatureShowcase />;
```

### 4. Using HeroStats

```tsx
import { HeroStats } from '@/components/landing';

// Pre-configured stats
<HeroStats />;
```

### 5. Using InteractiveDemo

```tsx
import { InteractiveDemo } from '@/components/landing';

// Interactive step-by-step demo
<InteractiveDemo />;
```

## Custom Configurations

### Custom Feature Section

```tsx
import { FeaturesSection, FeatureCard } from '@/components/landing';
import { Shield, Lock, Eye } from 'lucide-react';

<FeaturesSection
  title="Security Features"
  subtitle="Enterprise-grade protection"
  columns={3}
  id="security"
>
  <FeatureCard
    icon={Shield}
    title="Advanced Protection"
    description="Multi-layered security approach"
    accent="blue"
    delay={0}
  />
  <FeatureCard
    icon={Lock}
    title="Data Encryption"
    description="End-to-end encryption for all data"
    accent="blue"
    delay={0.1}
  />
  <FeatureCard
    icon={Eye}
    title="Privacy First"
    description="Your data stays private and secure"
    accent="blue"
    delay={0.2}
  />
</FeaturesSection>;
```

### Two-Column Layout

```tsx
<FeaturesSection
  title="Integration Options"
  columns={2}
>
  <FeatureCard {...} />
  <FeatureCard {...} />
</FeaturesSection>
```

### Four-Column Layout (Grid)

```tsx
<FeaturesSection
  title="Quick Features"
  columns={4}
>
  <FeatureCard {...} />
  <FeatureCard {...} />
  <FeatureCard {...} />
  <FeatureCard {...} />
</FeaturesSection>
```

## Available Icons

All icons from Lucide React are supported. Common ones:

```tsx
import {
  // AI & ML
  Brain,
  Cpu,
  Sparkles,
  Zap,

  // Collaboration
  Users,
  MessageSquare,
  Video,
  Phone,

  // Development
  Code,
  Terminal,
  GitBranch,
  Database,

  // Features
  Shield,
  Lock,
  Globe,
  Cloud,
  Network,
  Workflow,
  Settings,
  Layers,

  // UI
  Check,
  CheckCircle2,
  ArrowRight,
  X,
  Star,
  Heart,
  ThumbsUp,
  Award,

  // Integration
  Plug,
  Link,
  Share2,
  Download,

  // Media
  Image,
  FileText,
  Folder,
  File,

  // Status
  AlertCircle,
  Info,
  HelpCircle,
} from 'lucide-react';
```

## Accent Colors

Choose from 5 pre-configured accent colors:

```tsx
accent = 'blue'; // Primary, trust, technology
accent = 'purple'; // AI, innovation, premium
accent = 'green'; // Success, growth, sustainability
accent = 'orange'; // Energy, creativity, collaboration
accent = 'pink'; // Design, creative, unique
```

## Animation Delays

Stagger animations for visual appeal:

```tsx
<FeatureCard delay={0} {...} />    // First card
<FeatureCard delay={0.1} {...} />  // Second card (100ms later)
<FeatureCard delay={0.2} {...} />  // Third card (200ms later)
```

## Complete Landing Page Example

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  FeatureShowcase,
  HeroStats,
  InteractiveDemo,
  HeroCTA,
} from '@/components/landing';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto py-24 px-4 text-center">
          <h1 className="text-6xl font-extrabold text-gray-900 dark:text-white">
            Welcome to <span className="text-blue-600">The New Fuse</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 dark:text-gray-300">
            AI-powered collaboration platform
          </p>
          <div className="mt-10">
            <HeroCTA />
          </div>
        </div>
      </section>

      {/* Stats */}
      <HeroStats />

      {/* Demo */}
      <InteractiveDemo />

      {/* Features */}
      <FeatureShowcase />
    </div>
  );
};
```

## Customizing the Showcase

Edit `FeatureShowcase.tsx` to customize features:

```tsx
// Change feature content
<FeatureCard
  icon={YourIcon}
  title="Your Feature"
  description="Your description"
  imageSrc="your-image.png"
  accent="blue"
/>

// Add new section
<FeaturesSection
  title="Your Section"
  subtitle="Your subtitle"
  columns={3}
>
  {/* Your feature cards */}
</FeaturesSection>
```

## Replacing Placeholder Images

Replace placeholder URLs with actual images:

```tsx
// Before
imageSrc = 'https://placehold.co/600x400/667eea/ffffff/png?text=AI+Agents';

// After
imageSrc = '/images/features/ai-agents.webp';
```

Recommended image specs:

- Format: WebP or PNG
- Dimensions: 600x400 (3:2 ratio)
- File size: < 100KB
- Optimization: Use `next/image` or similar

## Dark Mode

All components support dark mode automatically via Tailwind:

```tsx
// No configuration needed, just ensure your app supports dark mode
<html className="dark">  {/* Add this class to enable dark mode */}
```

## Accessibility

Components are accessible by default:

```tsx
// Add meaningful alt text
<FeatureCard
  imageSrc="/image.png"
  imageAlt="Screenshot showing the dashboard with analytics"
  {...}
/>

// Use semantic IDs for navigation
<FeaturesSection
  id="security-features"  // Enables anchor links
  {...}
/>
```

## Responsive Behavior

Components automatically adjust for screen sizes:

- **Mobile** (< 640px): 1 column, stacked layout
- **Tablet** (640-1024px): 2 columns
- **Desktop** (> 1024px): 3-4 columns

No configuration needed!

## Performance Tips

1. **Lazy load images**:

```tsx
<img loading="lazy" src={imageSrc} alt={imageAlt} />
```

2. **Use WebP images**:

```bash
# Convert images
cwebp input.png -q 80 -o output.webp
```

3. **Optimize animations**:

```tsx
// Reduce motion for accessibility
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

4. **Code splitting**:

```tsx
const FeatureShowcase = React.lazy(
  () => import('@/components/landing/FeatureShowcase')
);
```

## Troubleshooting

### Icons not showing?

```bash
npm install lucide-react
```

### Animations not working?

```bash
npm install framer-motion
```

### TypeScript errors?

```bash
# Rebuild the project
npm run build
```

### Styles not applying?

Make sure Tailwind CSS is configured:

```js
// tailwind.config.ts
content: [
  './src/**/*.{ts,tsx}',
],
```

## Advanced Customization

### Custom Animation Delays

```tsx
// Fibonacci sequence for natural feel
<FeatureCard delay={0} {...} />
<FeatureCard delay={0.1} {...} />
<FeatureCard delay={0.2} {...} />
<FeatureCard delay={0.3} {...} />
<FeatureCard delay={0.5} {...} />
<FeatureCard delay={0.8} {...} />
```

### Custom Colors

Edit `FeatureCard.tsx` to add new accent colors:

```tsx
const accentColors = {
  // ... existing colors
  teal: {
    bg: 'from-teal-500/10 to-teal-600/10',
    icon: 'text-teal-600 dark:text-teal-400',
    hover: 'group-hover:shadow-teal-500/20',
    border: 'border-teal-500/20',
  },
};
```

### Custom Grid Layouts

Modify `FeaturesSection.tsx`:

```tsx
const columnClasses = {
  // ... existing layouts
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
  6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
};
```

## Support & Resources

- **Documentation**: See README.md in the landing directory
- **Component Source**: `/apps/frontend/src/components/landing/`
- **Icons**: https://lucide.dev/icons
- **Animations**: https://www.framer.com/motion/

---

Happy building! 🚀
