import React from 'react';
export interface Testimonial {
    id: string;
    name: string;
    role: string;
    company: string;
    avatar?: string;
    content: string;
    rating?: number;
}
export interface Stat {
    value: string;
    label: string;
    icon?: React.ReactNode;
    trend?: string;
}
export interface TestimonialsProps {
    testimonials: Testimonial[];
    className?: string;
    variant?: 'grid' | 'carousel' | 'featured';
}
export interface StatsProps {
    stats: Stat[];
    className?: string;
    variant?: 'default' | 'compact' | 'highlight';
}
/**
 * Testimonials Component
 *
 * Displays customer testimonials with ratings
 * Supports multiple layout variants
 */
export declare const Testimonials: React.FC<TestimonialsProps>;
/**
 * Stats Component
 *
 * Displays key metrics and statistics
 * Supports multiple visual variants
 */
export declare const Stats: React.FC<StatsProps>;
/**
 * Trust Badges Component
 *
 * Displays trust indicators like certifications, awards, etc.
 */
export interface TrustBadge {
    id: string;
    name: string;
    icon?: React.ReactNode;
    description?: string;
}
export interface TrustBadgesProps {
    badges: TrustBadge[];
    className?: string;
}
export declare const TrustBadges: React.FC<TrustBadgesProps>;
/**
 * Logo Cloud Component
 *
 * Displays customer/partner logos
 */
export interface LogoCloudProps {
    title?: string;
    logos: Array<{
        id: string;
        name: string;
        src: string;
    }>;
    className?: string;
}
export declare const LogoCloud: React.FC<LogoCloudProps>;
/**
 * Combined Social Proof Section
 *
 * Pre-configured section with stats, testimonials, and trust badges
 */
export interface SocialProofSectionProps {
    stats?: Stat[];
    testimonials?: Testimonial[];
    trustBadges?: TrustBadge[];
    className?: string;
}
export declare const SocialProofSection: React.FC<SocialProofSectionProps>;
export declare const defaultStats: Stat[];
export declare const defaultTestimonials: Testimonial[];
export declare const defaultTrustBadges: TrustBadge[];
