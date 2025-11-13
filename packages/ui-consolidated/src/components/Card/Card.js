import React, { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils';
/**
 * Card variants using class-variance-authority
 */
export const cardVariants = cva('rounded-lg border bg-card text-card-foreground shadow-sm', {
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
});
// Create compound component
const Card = forwardRef(({ className, children, variant, size, hoverable, clickable, ...rest }, ref) => {
    return (<div ref={ref} className={cn(cardVariants({ variant, size, hoverable, clickable }), className)} {...rest}>
        {children}
      </div>);
});
Card.displayName = 'Card';
// Create subcomponents
const Header = forwardRef(({ className, ...props }, ref) => (<div ref={ref} className={cn('p-6', className)} {...props}/>));
Header.displayName = 'Card.Header';
const Title = forwardRef(({ className, ...props }, ref) => (<h3 ref={ref} className={cn('text-xl font-semibold', className)} {...props}/>));
Title.displayName = 'Card.Title';
const Description = forwardRef(({ className, ...props }, ref) => (<p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props}/>));
Description.displayName = 'Card.Description';
const Content = forwardRef(({ className, ...props }, ref) => (<div ref={ref} className={cn('p-6 pt-0', className)} {...props}/>));
Content.displayName = 'Card.Content';
const Footer = forwardRef(({ className, ...props }, ref) => (<div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props}/>));
Footer.displayName = 'Card.Footer';
Card.Header = Header;
Card.Title = Title;
Card.Description = Description;
Card.Content = Content;
Card.Footer = Footer;
const CardWithSubComponents = Card;
export { CardWithSubComponents as Card, Header as CardHeader, Title as CardTitle, Description as CardDescription, Content as CardContent, Footer as CardFooter, };
//# sourceMappingURL=Card.js.map