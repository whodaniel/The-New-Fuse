import React from 'react';
interface LineChartProps {
    data: Array<Record<string, any>>;
    xKey: string;
    yKey: string;
    height?: number;
}
export declare const LineChart: React.React.FC<LineChartProps>;
export {};
