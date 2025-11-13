import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
/**
 * Pagination variants using class-variance-authority
 */
export declare const paginationVariants: (props?: ({
    variant?: "default" | "outline" | "ghost" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Pagination item variants using class-variance-authority
 */
export declare const paginationItemVariants: (props?: ({
    variant?: "default" | "outline" | "ghost" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
    isActive?: boolean | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Pagination component props
 */
export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
    /**
     * Total number of pages
     */
    count: number;
    /**
     * Current page
     * @default 1
     */
    page?: number;
    /**
     * Callback when page changes
     */
    onPageChange?: (page: number) => void;
    /**
     * Number of pages to show before and after the current page
     * @default 1
     */
    siblingCount?: number;
    /**
     * Number of pages to show at the beginning and end
     * @default 1
     */
    boundaryCount?: number;
    /**
     * Whether to show the previous and next buttons
     * @default true
     */
    showControls?: boolean;
    /**
     * Whether to show the first and last buttons
     * @default false
     */
    showFirstLast?: boolean;
    /**
     * Size of the pagination items
     */
    size?: 'default' | 'sm' | 'lg';
    /**
     * Variant of the pagination items
     */
    variant?: 'default' | 'ghost' | 'outline';
}
/**
 * Pagination item component props
 */
export interface PaginationItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof paginationItemVariants> {
    /**
     * Whether this is the current/active page
     * @default false
     */
    isActive?: boolean;
}
/**
 * Pagination component for navigating through pages
 *
 * @example
 * // Basic usage
 * <Pagination count={10} page={1} onPageChange={(page) => console.log(page)} />
 *
 * // With custom sibling and boundary count
 * <Pagination count={20} page={5} siblingCount={2} boundaryCount={2} />
 *
 * // With first and last buttons
 * <Pagination count={10} page={5} showFirstLast />
 *
 * // With different variant
 * <Pagination count={10} page={5} variant="outline" />
 *
 * // With different size
 * <Pagination count={10} page={5} size="lg" />
 */
declare const Pagination: React.ForwardRefExoticComponent<PaginationProps & React.RefAttributes<HTMLElement>>;
/**
 * Pagination item component for displaying a pagination item
 */
declare const PaginationItem: React.ForwardRefExoticComponent<PaginationItemProps & React.RefAttributes<HTMLButtonElement>>;
export { Pagination, PaginationItem };
//# sourceMappingURL=Pagination.d.ts.map