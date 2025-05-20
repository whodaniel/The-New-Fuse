import React from "react";
import { cn } from '../../utils/cn.js'; // Updated path with file extension
// Define CardProps interface directly here to avoid circular dependencies
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", interactive = false, padding = "md", ...props }, ref) => {
    // Generate CSS classes based on props
    const baseClasses = "rounded-lg";

    const variantClasses = {
      default: "border bg-card text-card-foreground",
      bordered: "border-2 border-primary",
      elevated: "border-none shadow-lg",
    };

    const paddingClasses = {
      none: "p-0",
      sm: "p-2",
      md: "p-4",
      lg: "p-6",
    };

    const interactiveClasses = interactive
      ? "transition-shadow hover:shadow-lg cursor-pointer active:scale-[0.99]"
      : "";

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          paddingClasses[padding],
          interactiveClasses,
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
);

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);

CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);

CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
);

CardFooter.displayName = "CardFooter";

// Define card variants for external use
export const cardVariants = {
  default: "border bg-card text-card-foreground",
  bordered: "border-2 border-primary",
  elevated: "border-none shadow-lg",
};

// Export CardProps type
export type { CardProps };

// Export components
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
