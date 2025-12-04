import React from 'react';
export interface HeroCTAProps {
    onGetStarted?: () => void;
    onWatchDemo?: () => void;
    className?: string;
}
/**
 * Primary Hero CTA Component
 *
 * Features:
 * - Dual CTA buttons (primary + secondary)
 * - Compelling action-oriented copy
 * - Eye-catching design with gradient accents
 * - Analytics tracking built-in
 * - Responsive layout
 */
export declare const HeroCTA: React.FC<HeroCTAProps>;
/**
 * Hero CTA with Trust Indicators
 *
 * Enhanced version with social proof elements
 */
export declare const HeroCTAWithTrust: React.FC<HeroCTAProps & {
    stats?: {
        users?: string;
        rating?: string;
    };
}>;
