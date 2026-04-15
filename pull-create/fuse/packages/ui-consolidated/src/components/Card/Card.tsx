import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils';

/**
 * Card variants using class-variance-authority
 */
export const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      variant: {
        default: 'border-border',
        ghost: 'border-transparent shadow-none',
        outline: 'border-2',
        elevated: 'border-none shadow-lg',
        destructive: 'border-destructive',
      },
      size: {
        default: 'p-6',
        sm: 'p-4',
        lg: 'p-8',
      },
      hoverable: {
        true: 'transition-shadow duration-200 hover:shadow-md',
      },
      clickable: {
        true: 'cursor-pointer transition-all duration-200 hover:translate-y-[-2px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      hoverable: false,
      clickable: false,
    },
  }
);

/**
 * Card component props
 */
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

// Create compound component
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, variant, size, hoverable, clickable, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, size, hoverable, clickable }),
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Create subcomponents
const Header = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...props} />
  )
);
Header.displayName = 'Card.Header';

const Title = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-xl font-semibold', className)} {...props} />
  )
);
Title.displayName = 'Card.Title';

const Description = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
Description.displayName = 'Card.Description';

const Content = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
Content.displayName = 'Card.Content';

const Footer = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
Footer.displayName = 'Card.Footer';

// Attach subcomponents to Card
type CardCompoundComponent = typeof Card & {
  Header: typeof Header;
  Title: typeof Title;
  Description: typeof Description;
  Content: typeof Content;
  Footer: typeof Footer;
};

(Card as CardCompoundComponent).Header = Header;
(Card as CardCompoundComponent).Title = Title;
(Card as CardCompoundComponent).Description = Description;
(Card as CardCompoundComponent).Content = Content;
(Card as CardCompoundComponent).Footer = Footer;

export {
  Card,
  Header as CardHeader,
  Title as CardTitle,
  Description as CardDescription,
  Content as CardContent,
  Footer as CardFooter,
};
