import { VariantProps } from "class-variance-authority";
import { buttonVariants } from './Button.js';
import { ComponentProps } from "react";

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export type ButtonColors = 
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

export type ButtonSizes = 
  | "default"
  | "sm"
  | "lg"
  | "icon";

export interface BaseButtonProps extends ComponentProps<"button"> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export type ButtonProps = BaseButtonProps & ButtonVariants;
