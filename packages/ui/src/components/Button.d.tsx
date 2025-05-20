import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';

// Define ClassProp inline to avoid external dependency
interface ClassProp {
  class?: string;
  className?: string;
}

declare const buttonVariants: (props?: ({
    variant?: "default" | "secondary" | "link" | "outline" | "ghost" | "destructive" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
} & ClassProp) | undefined) => string;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}
type ButtonComponent = React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
declare const Button: ButtonComponent;
export { Button, buttonVariants };
