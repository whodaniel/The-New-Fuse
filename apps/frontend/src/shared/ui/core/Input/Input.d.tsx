import React from 'react';
import { type VariantProps } from 'class-variance-authority';
declare const inputVariants: (props?: ({
    variant?: "default" | "outline" | "ghost" | "transparent" | "filled" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
    state?: "default" | "success" | "error" | null | undefined;
    width?: "default" | "auto" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof inputVariants> {
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    label?: string;
    helperText?: string;
    error?: string;
    success?: string;
    containerClassName?: string;
    labelClassName?: string;
    helperTextClassName?: string;
}
declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;
export { Input, inputVariants };
