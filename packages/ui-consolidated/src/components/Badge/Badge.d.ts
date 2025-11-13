import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
/**
 * Badge variants using class-variance-authority
 */
export declare const badgeVariants: (props?: ({
    variant?: "default" | "success" | "info" | "warning" | "secondary" | "outline" | "destructive" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Badge component props
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
    /**
     * Whether the badge is dismissible
     */
    dismissible?: boolean;
    /**
     * Callback when the badge is dismissed
     */
    onDismiss?: () => void;
}
/**
 * Badge component for displaying small pieces of information
 *
 * @example
 * // Basic usage
 * <Badge>New</Badge>
 *
 * // With variants
 * <Badge variant="secondary">Secondary</Badge>
 * <Badge variant="destructive">Destructive</Badge>
 * <Badge variant="outline">Outline</Badge>
 *
 * // With sizes
 * <Badge size="sm">Small</Badge>
 * <Badge size="lg">Large</Badge>
 *
 * // Dismissible badge
 * <Badge dismissible onDismiss={() => console.log('Dismissed')}>
 *   Dismissible
 * </Badge>
 */
declare const Badge: React.ForwardRefExoticComponent<BadgeProps & React.RefAttributes<HTMLDivElement>>;
export { Badge };
//# sourceMappingURL=Badge.d.ts.map