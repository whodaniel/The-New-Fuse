import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
/**
 * Container variants using class-variance-authority
 */
export declare const containerVariants: (props?: ({
    size?: "default" | "full" | "md" | "sm" | "lg" | "xl" | null | undefined;
    padding?: "default" | "none" | "md" | "sm" | "lg" | "xl" | null | undefined;
    center?: boolean | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Container component props
 */
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof containerVariants> {
    /**
     * Whether to center the content
     */
    center?: boolean;
}
/**
 * Container component for constraining content width
 *
 * @example
 * // Basic usage
 * <Container>Content</Container>
 *
 * // With size
 * <Container size="sm">Small container</Container>
 *
 * // With padding
 * <Container padding="lg">Container with large padding</Container>
 *
 * // With centered content
 * <Container center>Centered content</Container>
 */
declare const Container: React.ForwardRefExoticComponent<ContainerProps & React.RefAttributes<HTMLDivElement>>;
export { Container };
//# sourceMappingURL=Container.d.ts.map