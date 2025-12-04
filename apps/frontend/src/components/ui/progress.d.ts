import React from 'react';
export interface ProgressProps {
    value?: number;
    max?: number;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}
export declare const Progress: React.FC<ProgressProps>;
