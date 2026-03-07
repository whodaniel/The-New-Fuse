import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils';

/**
 * Container variants using class-variance-authority
 */
export const containerVariants = cva(
  'mx-auto w-full',
  {
    variants: {
      size: {
        default: 'max-w-7xl',
        sm: 'max-w-3xl',
        md: 'max-w-5xl',
        lg: 'max-w-7xl',
        xl: 'max-w-[1400px]',
        full: 'max-w-none',
      },
      padding: {
        default: 'px-4 sm:px-6 lg:px-8',
        none: 'px-0',
        sm: 'px-2',
        md: 'px-4',
        lg: 'px-6',
        xl: 'px-8',
      },
      center: {
        true: 'flex flex-col items-center',
      },
    },
    defaultVariants: {
      size: 'default',
      padding: 'default',
    },
  }
);

/**
 * Container component props
 */
export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
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
const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, padding, center, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(containerVariants({ size, padding, center }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';

export { Container };
