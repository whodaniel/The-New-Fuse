import * as React from 'react';
import './Split.css';
/**
 * Split component props
 */
export interface SplitProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
    /**
     * Direction of the split
     * @default 'horizontal'
     */
    direction?: 'horizontal' | 'vertical';
    /**
     * Initial sizes of the panels in percentage
     * @default [50, 50]
     */
    initialSizes?: number[];
    /**
     * Minimum size of each panel in percentage
     * @default 10
     */
    minSize?: number;
    /**
     * Whether the split is resizable
     * @default true
     */
    resizable?: boolean;
    /**
     * Size of the gutter in pixels
     * @default 4
     */
    gutterSize?: number;
    /**
     * Callback when sizes change
     */
    onChange?: (sizes: number[]) => void;
    /**
     * Children to render in the split panels
     */
    children: React.ReactNode;
}
//# sourceMappingURL=Split.d.ts.map