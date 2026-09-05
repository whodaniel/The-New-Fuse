import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Browser-safe subset of @the-new-fuse/utils for the desktop Vite graph. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default { cn };
