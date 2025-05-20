import * as React from "react";
import { Input } from './Input.js';

// Use a Union type for size instead of "number"
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: "default" | "sm" | "lg";
}

// Re-export the Input component
export { Input };
