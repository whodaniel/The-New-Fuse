import React from 'react';
interface MetricCardProps {
    title: string;
    value: number;
    unit: string;
    history: Array<{
        timestamp: number;
        value: number;
    }>;
    color?: string;
}
export declare function MetricCard({ title, value, unit, history, color }: MetricCardProps): React.JSX.Element;
export {};
