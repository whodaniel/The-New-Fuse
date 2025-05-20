import * as React from "react";
import { type ComponentProps } from "react";
import { type VariantProps } from "class-variance-authority";
import type { inputVariants } from './Input.js';

export type InputVariants = VariantProps<typeof inputVariants>;

export interface BaseInputProps extends ComponentProps<"input"> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
  errorMessage?: string;
}

export type InputProps = BaseInputProps & InputVariants;
