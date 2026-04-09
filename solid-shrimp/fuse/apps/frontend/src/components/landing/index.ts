/**
 * Landing Page CTA Components
 *
 * High-converting call-to-action components for The New Fuse landing page
 */

// Feature Showcase Components
export { default as FeatureCard } from './FeatureCard';
export { default as FeaturesSection } from './FeaturesSection';
export { FeatureShowcase } from './FeatureShowcase';
export { HeroStats } from './HeroStats';
export { InteractiveDemo } from './InteractiveDemo';

// Hero CTA
export { HeroCTA, HeroCTAWithTrust } from './HeroCTA';
export type { HeroCTAProps } from './HeroCTA';

// Secondary CTA
export { SecondaryCTA, CompactSecondaryCTA } from './SecondaryCTA';
export type { SecondaryCTAProps } from './SecondaryCTA';

// Email Signup
export { EmailSignupForm, InlineEmailSignup } from './EmailSignupForm';
export type { EmailSignupFormProps } from './EmailSignupForm';

// Demo Request
export { DemoRequestModal, DemoRequestButton } from './DemoRequestModal';
export type { DemoRequestModalProps, DemoRequestData } from './DemoRequestModal';

// Social Proof
export {
  Testimonials,
  Stats,
  TrustBadges,
  LogoCloud,
  SocialProofSection,
  defaultStats,
  defaultTestimonials,
  defaultTrustBadges,
} from './SocialProof';
export type {
  TestimonialsProps,
  StatsProps,
  TrustBadgesProps,
  LogoCloudProps,
  SocialProofSectionProps,
  Testimonial,
  Stat,
  TrustBadge,
} from './SocialProof';
