# Landing Page Feature Showcase Components

This directory contains reusable components for creating an engaging,
interactive landing page for The New Fuse platform.

## Components Overview

### 1. FeatureCard

A reusable card component for displaying individual features with icons,
descriptions, and optional images.

**Props:**

```typescript
interface FeatureCardProps {
  icon: LucideIcon; // Icon component from lucide-react
  title: string; // Feature title
  description: string; // Feature description
  imageSrc?: string; // Optional screenshot/image URL
  imageAlt?: string; // Alt text for image
  accent?: 'blue' | 'purple' | 'green' | 'orange' | 'pink'; // Accent color
  delay?: number; // Animation delay in seconds
}
```

**Features:**

- Hover animations with scale and shadow effects
- Animated icon with rotation effect on hover
- Bottom border animation on view
- Responsive design (mobile, tablet, desktop)
- Dark mode support
- Configurable accent colors

**Usage:**

```tsx
import { FeatureCard } from '@/components/landing';
import { Brain } from 'lucide-react';

<FeatureCard
  icon={Brain}
  title="AI-Powered Collaboration"
  description="Deploy multiple specialized AI agents..."
  imageSrc="/images/ai-agents.png"
  accent="purple"
  delay={0.1}
/>;
```

### 2. FeaturesSection

A section wrapper component for organizing multiple feature cards in a
responsive grid layout.

**Props:**

```typescript
interface FeaturesSectionProps {
  title: string; // Section title
  subtitle?: string; // Optional subtitle
  children: React.ReactNode; // Feature cards or other content
  columns?: 1 | 2 | 3 | 4; // Number of columns
  id?: string; // Section ID for anchor links
}
```

**Features:**

- Responsive grid layouts (1-4 columns)
- Fade-in animation for title and subtitle
- Automatic spacing and padding
- Dark mode support

**Usage:**

```tsx
import { FeaturesSection, FeatureCard } from '@/components/landing';

<FeaturesSection
  id="core-features"
  title="Powerful Features"
  subtitle="Everything you need to build AI solutions"
  columns={3}
>
  <FeatureCard {...} />
  <FeatureCard {...} />
  <FeatureCard {...} />
</FeaturesSection>
```

### 3. FeatureShowcase

The main showcase component that combines multiple FeaturesSection components to
display all platform features.

**Features:**

- Pre-configured with all core features
- Multiple sections with different layouts
- Includes placeholder images
- Fully responsive
- Dark mode support

**Sections Included:**

1. **Core Features** (3 columns):
   - AI-Powered Agent Collaboration
   - MCP Protocol Integration
   - Real-Time Workflow Engine
   - Live Collaboration Features
   - Chrome Extension Capabilities
   - Lightning Fast Performance

2. **Additional Capabilities** (3 columns):
   - Enterprise-Grade Security
   - Developer-Friendly APIs
   - Version Control Integration
   - Intelligent Context Management
   - Distributed Processing
   - Global Edge Network

3. **Integration Highlights** (2 columns):
   - API-First Architecture
   - Extensible Plugin System

**Usage:**

```tsx
import { FeatureShowcase } from '@/components/landing';

<FeatureShowcase />;
```

### 4. HeroStats

A statistics component displaying key metrics with animated counters.

**Features:**

- Animated stat values with spring effect
- Responsive grid layout (2 columns on mobile, 4 on desktop)
- Dark mode support
- Staggered animation delays

**Pre-configured Stats:**

- 99.9% Uptime Guarantee
- <100ms Average Response Time
- 50+ AI Models Supported
- 10K+ Active Developers

**Usage:**

```tsx
import { HeroStats } from '@/components/landing';

<HeroStats />;
```

### 5. InteractiveDemo

An interactive component that demonstrates the platform's workflow with
step-by-step animations.

**Features:**

- 4-step interactive walkthrough
- Click-to-navigate between steps
- Animated transitions between states
- Visual preview panel with browser chrome
- Progress indicators
- Responsive design

**Steps:**

1. Natural Language Input
2. AI Agent Processing
3. Automated Execution
4. Task Complete

**Usage:**

```tsx
import { InteractiveDemo } from '@/components/landing';

<InteractiveDemo />;
```

## Animation Features

All components use Framer Motion for smooth animations:

### Entry Animations

- **Fade In + Slide Up**: Cards and sections fade in while sliding up
- **Scale In**: Icons and stats scale up on view
- **Staggered Delays**: Sequential animation for multiple items

### Hover Interactions

- **Scale Transform**: Cards scale to 102% on hover
- **Icon Rotation**: Icons rotate and scale on hover
- **Shadow Enhancement**: Dynamic shadow effects
- **Background Gradient**: Accent-colored gradient appears on hover

### Scroll Animations

- **Viewport Detection**: Animations trigger when elements enter viewport
- **Once Mode**: Animations play once for better performance
- **Margin Offset**: Animations trigger slightly before element is fully visible

## Responsive Design

All components are fully responsive with breakpoints:

```css
/* Mobile First Approach */
base:     < 640px   (1 column)
sm:       ≥ 640px   (2 columns)
md:       ≥ 768px   (2-3 columns)
lg:       ≥ 1024px  (3-4 columns)
xl:       ≥ 1280px  (full width)
```

## Color Schemes

### Accent Colors

Each feature card supports 5 accent colors:

- **Blue**: Primary features, core functionality
- **Purple**: AI/ML features, advanced capabilities
- **Green**: Performance, success metrics
- **Orange**: Collaboration, teamwork features
- **Pink**: Extensions, integrations

### Dark Mode

All components support dark mode through Tailwind's `dark:` variant:

- Automatic color scheme switching
- Optimized contrast ratios
- Consistent visual hierarchy

## Best Practices

### Performance

1. **Lazy Loading**: Use `React.lazy()` for landing page components
2. **Image Optimization**: Use WebP format and responsive images
3. **Animation Performance**: Animations use GPU-accelerated transforms

### Accessibility

1. **Semantic HTML**: Proper heading hierarchy
2. **Alt Text**: All images have descriptive alt text
3. **Keyboard Navigation**: Interactive elements are keyboard accessible
4. **Color Contrast**: WCAG AA compliant contrast ratios

### Customization

1. **Placeholder Images**: Replace with actual screenshots
2. **Feature Content**: Update descriptions to match your features
3. **Stats**: Update HeroStats with real metrics
4. **Accent Colors**: Choose colors that match your brand

## Integration Example

Complete landing page setup:

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  FeatureShowcase,
  HeroStats,
  InteractiveDemo,
} from '@/components/landing';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto py-24 px-4">
          <div className="text-center">
            <h1 className="text-6xl font-extrabold">
              Welcome to <span className="text-blue-600">The New Fuse</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              Collaborative AI platform for next-generation problem solving
            </p>
            <div className="mt-10 flex gap-4">
              <Link to="/login" className="btn-primary">
                Get Started
              </Link>
              <Link to="#features" className="btn-secondary">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <HeroStats />

      {/* Interactive Demo */}
      <InteractiveDemo />

      {/* Features */}
      <FeatureShowcase />
    </div>
  );
};
```

## File Structure

```
apps/frontend/src/components/landing/
├── FeatureCard.tsx          # Reusable feature card component
├── FeaturesSection.tsx      # Section wrapper with grid layout
├── FeatureShowcase.tsx      # Main showcase with all features
├── HeroStats.tsx            # Statistics display
├── InteractiveDemo.tsx      # Interactive workflow demo
├── index.tsx                # Barrel exports
└── README.md                # This file
```

## Dependencies

- **React**: ^19.2.0
- **Framer Motion**: ^12.23.24
- **Lucide React**: ^0.546.0
- **Tailwind CSS**: ^4.1.14
- **TypeScript**: ^5.9.3

## Future Enhancements

Potential improvements:

1. Add video backgrounds for hero section
2. Implement 3D animations for feature cards
3. Add code snippets in interactive demo
4. Create testimonials section
5. Add pricing comparison tables
6. Implement search/filter for features
7. Add keyboard shortcuts for demo navigation
8. Create mobile-specific animations

## Support

For questions or issues with these components, please refer to the main project
documentation or contact the development team.
