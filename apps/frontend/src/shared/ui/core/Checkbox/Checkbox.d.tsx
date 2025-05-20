import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { type VariantProps } from 'class-variance-authority';
declare const checkboxVariants: (props?: ({
    variant?: "default" | "outline" | "ghost" | "filled" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
    state?: "default" | "success" | "error" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, VariantProps<typeof checkboxVariants> {
    error?: string;
    success?: string;
    label?: string;
    description?: string;
    indeterminate?: boolean;
    containerClassName?: string;
    labelClassName?: string;
    descriptionClassName?: string;
}
declare const Checkbox: React.ForwardRefExoticComponent<CheckboxProps & React.RefAttributes<HTMLButtonElement>>;
export { Checkbox };
