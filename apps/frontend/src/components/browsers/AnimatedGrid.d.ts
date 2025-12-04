import { ReactNode } from 'react';
export interface AnimatedGridProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => ReactNode;
    getItemKey: (item: T) => string;
    columns?: {
        default?: number;
        md?: number;
        lg?: number;
    };
}
export declare function AnimatedGrid<T>({ items, renderItem, getItemKey, columns, }: AnimatedGridProps<T>): import("react/jsx-runtime").JSX.Element;
