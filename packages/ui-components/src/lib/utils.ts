import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names or class name objects with Tailwind CSS optimization.
 * This utility helps prevent duplicate or conflicting Tailwind classes.
 * 
 * @param inputs - Class names or class name objects to combine
 * @returns A merged and optimized class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
