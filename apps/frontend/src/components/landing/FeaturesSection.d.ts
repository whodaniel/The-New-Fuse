import React from 'react';
export interface FeaturesSectionProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    columns?: 1 | 2 | 3 | 4;
    id?: string;
}
export declare const FeaturesSection: React.FC<FeaturesSectionProps>;
export default FeaturesSection;
