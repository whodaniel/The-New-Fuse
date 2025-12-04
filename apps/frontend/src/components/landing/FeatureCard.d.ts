import React from 'react';
import { LucideIcon } from 'lucide-react';
export interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    imageSrc?: string;
    imageAlt?: string;
    accent?: 'blue' | 'purple' | 'green' | 'orange' | 'pink';
    delay?: number;
}
export declare const FeatureCard: React.FC<FeatureCardProps>;
export default FeatureCard;
