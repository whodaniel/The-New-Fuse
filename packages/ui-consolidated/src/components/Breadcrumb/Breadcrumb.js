import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils';
/**
 * Breadcrumb variants using class-variance-authority
 */
export const breadcrumbVariants = cva('flex flex-wrap items-center', {
    variants: {
        size: {
            default: 'text-sm',
            sm: 'text-xs',
            lg: 'text-base',
        },
    },
    defaultVariants: {
        size: 'default',
    },
});
/**
 * Breadcrumb item variants using class-variance-authority
 */
export const breadcrumbItemVariants = cva('inline-flex items-center', {
    variants: {
        variant: {
            default: 'text-muted-foreground hover:text-foreground',
            ghost: 'text-muted-foreground hover:text-foreground',
            link: 'text-primary hover:underline',
        },
    },
    defaultVariants: {
        variant: 'default',
    },
});
/**
 * Breadcrumb separator variants using class-variance-authority
 */
export const breadcrumbSeparatorVariants = cva('mx-2 text-muted-foreground', {
    variants: {
        size: {
            default: 'text-xs',
            sm: 'text-[0.6rem]',
            lg: 'text-sm',
        },
    },
    defaultVariants: {
        size: 'default',
    },
});
const BreadcrumbContext = React.createContext(undefined);
const useBreadcrumb = () => {
    const context = React.useContext(BreadcrumbContext);
    if (!context) {
        throw new Error('Breadcrumb components must be used within a Breadcrumb component');
    }
    return context;
};
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
const Breadcrumb = React.forwardRef(({ className, size, separator = '/', children, ...props }, ref) => {
    return (<BreadcrumbContext.Provider value={separator,
            size,
        }>
        <nav ref={ref} aria-label="Breadcrumb" className={cn(breadcrumbVariants({ size }), className)} {...props}>
          <ol className="flex flex-wrap items-center">
            {children}
          </ol>
        </nav>
      </BreadcrumbContext.Provider>);
});
Breadcrumb.displayName = 'Breadcrumb';
/**
 * Breadcrumb item component for displaying a breadcrumb item
 */
const BreadcrumbItem = React.forwardRef(({ className, variant, isCurrent = false, href, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : href && !isCurrent ? 'a' : 'span';
    const compProps = href && !isCurrent && !asChild ? { href } : {};
    return (<li ref={ref} className={cn(breadcrumbItemVariants({ variant }), isCurrent && 'text-foreground font-medium', className)} aria-current={isCurrent ? 'page' : undefined} {...props}>
        <Comp {...compProps} className={cn('outline-none focus:underline', isCurrent && 'cursor-default')}>
          {children}
        </Comp>
      </li>);
});
BreadcrumbItem.displayName = 'BreadcrumbItem';
/**
 * Breadcrumb separator component for displaying a separator between breadcrumb items
 */
const BreadcrumbSeparator = React.forwardRef(({ className, ...props }, ref) => {
    const { separator, size } = useBreadcrumb();
    return (<li ref={ref} role="presentation" aria-hidden="true" className={cn(breadcrumbSeparatorVariants({ size }), className)} {...props}>
        {separator}
      </li>);
});
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';
/**
 * Breadcrumb list component for displaying a list of breadcrumb items with separators
 */
const BreadcrumbList = React.forwardRef(({ className, children, ...props }, ref) => {
    // Filter out any non-BreadcrumbItem children
    const items = React.Children.toArray(children).filter((child) => React.isValidElement(child) && child.type === BreadcrumbItem);
    // Add separators between items
    const itemsWithSeparators = items.reduce((acc, item, index) => {
        if (index === 0) {
            return [item];
        }
        return [
            ...acc,
            <BreadcrumbSeparator key={`}separator-${index}` /  > ,
                    item,
                }/>
        ];
    }, []);
    return (<ol ref={ref} className={cn('flex flex-wrap items-center', className)} {...props}>
        {itemsWithSeparators}
      </ol>);
});
BreadcrumbList.displayName = 'BreadcrumbList';
export { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbList, };
//# sourceMappingURL=Breadcrumb.js.map