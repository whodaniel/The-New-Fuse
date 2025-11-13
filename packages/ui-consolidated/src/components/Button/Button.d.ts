import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
/**
 * Button variants using class-variance-authority
 */
export declare const buttonVariants: (props?: ({
    variant?: "default" | "link" | "secondary" | "outline" | "ghost" | "destructive" | null | undefined;
    size?: "default" | "sm" | "lg" | "icon" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Button component props
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    /**
     * Whether to render the button as a child component
     */
    asChild?: boolean;
    /**
     * Whether the button is in a loading state
     */
    isLoading?: boolean;
    /**
     * Icon to display in the button
     */
    icon?: React.ReactNode;
    /**
     * Position of the icon
     */
    iconPosition?: 'start' | 'end';
}
/**
 * Button component with support for variants, sizes, loading state, and icons
 *
 * @example
 * // Basic usage
 * <Button>Click me</Button>
 *
 * // With variants
 * <Button variant="destructive">Delete</Button>
 * <Button variant="outline">Cancel</Button>
 *
 * // With sizes
 * <Button size="sm">Small</Button>
 * <Button size="lg">Large</Button>
 *
 * // With loading state
 * <Button isLoading>Processing...</Button>
 *
 * // With icon
 * <Button icon={<IconComponent />}>With Icon</Button>
 */
declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
export { Button };
//# sourceMappingURL=Button.d.ts.map