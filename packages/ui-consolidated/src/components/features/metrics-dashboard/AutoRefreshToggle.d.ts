import React from 'react';
interface AutoRefreshToggleProps {
    enabled: boolean;
    interval: number;
    onToggle: (enabled: boolean) => void;
    onIntervalChange: (interval: number) => void;
}
export declare const AutoRefreshToggle: React.FC<AutoRefreshToggleProps>;
export {};
//# sourceMappingURL=AutoRefreshToggle.d.ts.map