import { VariantProps } from 'class-variance-authority';
import { preloaderVariants } from './index.js';

export type PreloaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type PreloaderVariant = 'default' | 'light' | 'dark' | 'muted';

export interface PreloaderProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof preloaderVariants> {
  center?: boolean;
}