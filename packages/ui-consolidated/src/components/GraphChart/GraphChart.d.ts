export type ChartType = "line" | "bar" | "pie" | "area";
export interface ChartData {
    id: string;
    label: string;
    value: number;
    color?: string;
}
export interface SeriesData {
    timestamp: string | number;
    [key: string]: string | number;
}
export interface ChartProps {
    type: ChartType;
    data: ChartData[] | SeriesData[];
    title?: string;
    xAxisKey?: string;
    yAxisKey?: string;
    series?: Array<{
        key: string;
        label: string;
        color: string;
    }>;
    stacked?: boolean;
    height?: number | string;
    width?: number | string;
    colors?: string[];
    className?: string;
}
export declare function GraphChart({ type, data, title, xAxisKey, yAxisKey, series, stacked, height, width, colors, className, }: ChartProps): import("react").JSX.Element;
export { GraphChart as Chart };
//# sourceMappingURL=GraphChart.d.ts.map