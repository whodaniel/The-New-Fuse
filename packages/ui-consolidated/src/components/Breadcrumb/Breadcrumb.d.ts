import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
/**
 * Breadcrumb variants using class-variance-authority
 */
export declare const breadcrumbVariants: (props?: ({
    size?: "default" | "sm" | "lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Breadcrumb item variants using class-variance-authority
 */
export declare const breadcrumbItemVariants: (props?: ({
    variant?: "default" | "link" | "ghost" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Breadcrumb separator variants using class-variance-authority
 */
export declare const breadcrumbSeparatorVariants: (props?: ({
    size?: "default" | "sm" | "lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Breadcrumb component props
 */
export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof breadcrumbVariants> {
    /**
     * Custom separator to use between breadcrumb items
     * @default "/"
     */
    separator?: React.ReactNode;
    size?: "default" | "sm" | "lg";
}
/**
 * Breadcrumb item component props
 */
export interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLLIElement>, VariantProps<typeof breadcrumbItemVariants> {
    /**
     * Whether this is the current/active breadcrumb item
     * @default false
     */
    isCurrent?: boolean;
    /**
     * URL for the breadcrumb item
     */
    href?: string;
    /**
     * Custom component to render for the breadcrumb item
     */
    asChild?: boolean;
}
/**
 * Breadcrumb separator component props
 */
export interface BreadcrumbSeparatorProps extends React.HTMLAttributes<HTMLLIElement>, VariantProps<typeof breadcrumbSeparatorVariants> {
}
/**
 * Breadcrumb component for displaying navigation hierarchy
 *
 * @example
 * // Basic usage
 * <Breadcrumb>
 *   <BreadcrumbItem href="/">Home</BreadcrumbItem>
 *   <BreadcrumbItem href="/products">Products</BreadcrumbItem>
 *   <BreadcrumbItem isCurrent>Product Name</BreadcrumbItem>
 * </Breadcrumb>
 *
 * // With custom separator
 * <Breadcrumb separator=">">
 *   <BreadcrumbItem href="/">Home</BreadcrumbItem>
 *   <BreadcrumbItem href="/products">Products</BreadcrumbItem>
 *   <BreadcrumbItem isCurrent>Product Name</BreadcrumbItem>
 * </Breadcrumb>
 *
 * // With different size
 * <Breadcrumb size="lg">
 *   <BreadcrumbItem href="/">Home</BreadcrumbItem>
 *   <BreadcrumbItem href="/products">Products</BreadcrumbItem>
 *   <BreadcrumbItem isCurrent>Product Name</BreadcrumbItem>
 * </Breadcrumb>
 */
declare const Breadcrumb: React.ForwardRefExoticComponent<BreadcrumbProps & React.RefAttributes<HTMLElement>>;
/**
 * Breadcrumb item component for displaying a breadcrumb item
 */
declare const BreadcrumbItem: React.ForwardRefExoticComponent<BreadcrumbItemProps & React.RefAttributes<HTMLLIElement>>;
/**
 * Breadcrumb separator component for displaying a separator between breadcrumb items
 */
declare const BreadcrumbSeparator: React.ForwardRefExoticComponent<BreadcrumbSeparatorProps & React.RefAttributes<HTMLLIElement>>;
/**
 * Breadcrumb list component for displaying a list of breadcrumb items with separators
 */
declare const BreadcrumbList: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLOListElement> & React.RefAttributes<HTMLOListElement>>;
export { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbList, };
//# sourceMappingURL=Breadcrumb.d.ts.map