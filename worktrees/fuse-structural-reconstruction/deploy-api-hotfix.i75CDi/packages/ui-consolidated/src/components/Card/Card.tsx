import { cva, type VariantProps } from 'class-variance-authority';
import React, { forwardRef } from 'react';
import { cn } from '../../utils';

/**
 * Card variants using class-variance-authority
 */
export const cardVariants = cva('rounded-md border bg-card text-card-foreground', {
  variants: {
    variant: {
      default: 'border-border',
      ghost: 'border-transparent bg-transparent',
      outline: 'border border-border/60',
      elevated: 'border border-border/50 bg-card/90',
      destructive: 'border-destructive/60',
    },
    size: {
      default: 'p-4',
      sm: 'p-3',
      lg: 'p-6',
    },
    hoverable: {
      true: 'transition-colors duration-200 hover:bg-muted/30',
    },
    clickable: {
      true: 'cursor-pointer transition-colors duration-200 hover:bg-muted/30',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    hoverable: false,
    clickable: false,
  },
});

/**
 * Card component props
 */
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

// Create compound component
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, variant, size, hoverable, clickable, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, size, hoverable, clickable }), className)}
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
  ({ className, ...props }, ref) => <div ref={ref} className={cn('p-4', className)} {...props} />
);
Header.displayName = 'Card.Header';

const Title = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold', className)} {...props} />
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
    <div ref={ref} className={cn('p-4 pt-0', className)} {...props} />
  )
);
Content.displayName = 'Card.Content';

const Footer = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-4 pt-0', className)} {...props} />
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
  Content as CardContent,
  Description as CardDescription,
  Footer as CardFooter,
  Header as CardHeader,
  Title as CardTitle,
};
