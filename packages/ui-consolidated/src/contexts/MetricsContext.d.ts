import React from 'react';
interface MetricsContextType {
    metrics: any[];
    loading: boolean;
    error: string | null;
}
declare const MetricsContext: React.Context<MetricsContextType>;
export declare const useMetrics: () => MetricsContextType;
export declare const MetricsProvider: React.FC<{
    children: React.ReactNode;
}>;
export default MetricsContext;
//# sourceMappingURL=MetricsContext.d.ts.map