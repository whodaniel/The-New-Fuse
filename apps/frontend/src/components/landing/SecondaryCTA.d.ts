import React from 'react';
export interface SecondaryCTAProps {
    title?: string;
    description?: string;
    benefits?: string[];
    ctaText?: string;
    onCtaClick?: () => void;
    className?: string;
    variant?: 'default' | 'gradient' | 'minimal';
}
/**
 * Secondary CTA Component
 *
 * Appears after features section to re-engage users
 * Features:
 * - Customizable title and description
 * - List of key benefits
 * - Multiple visual variants
 * - Analytics tracking
 */
export declare const SecondaryCTA: React.FC<SecondaryCTAProps>;
/**
 * Compact Secondary CTA
 *
 * Simpler version for tighter spaces
 */
export declare const CompactSecondaryCTA: React.FC<Omit<SecondaryCTAProps, 'benefits' | 'variant'>>;
