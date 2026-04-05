import { jsx as _jsx } from "react/jsx-runtime";
import { cva } from 'class-variance-authority';
import { forwardRef } from 'react';
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
// Create compound component
const Card = forwardRef(({ className, children, variant, size, hoverable, clickable, ...rest }, ref) => {
    return (_jsx("div", { ref: ref, className: cn(cardVariants({ variant, size, hoverable, clickable }), className), ...rest, children: children }));
});
Card.displayName = 'Card';
// Create subcomponents
const Header = forwardRef(({ className, ...props }, ref) => _jsx("div", { ref: ref, className: cn('p-4', className), ...props }));
Header.displayName = 'Card.Header';
const Title = forwardRef(({ className, ...props }, ref) => (_jsx("h3", { ref: ref, className: cn('text-lg font-semibold', className), ...props })));
Title.displayName = 'Card.Title';
const Description = forwardRef(({ className, ...props }, ref) => (_jsx("p", { ref: ref, className: cn('text-sm text-muted-foreground', className), ...props })));
Description.displayName = 'Card.Description';
const Content = forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('p-4 pt-0', className), ...props })));
Content.displayName = 'Card.Content';
const Footer = forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('flex items-center p-4 pt-0', className), ...props })));
Footer.displayName = 'Card.Footer';
Card.Header = Header;
Card.Title = Title;
Card.Description = Description;
Card.Content = Content;
Card.Footer = Footer;
export { Card, Content as CardContent, Description as CardDescription, Footer as CardFooter, Header as CardHeader, Title as CardTitle, };
