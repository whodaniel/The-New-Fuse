// packages/ui-consolidated/src/lib/utils.ts
// Utility to merge class names
export function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(' ');
}