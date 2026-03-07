import { forwardRef } from 'react';
import { cn } from '../../utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps,
} from '../Card/Card';

export interface GlassCardProps extends CardProps {
  gradient?: string;
  className?: string;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, gradient, children, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          'group relative overflow-hidden border-0 bg-white/50 backdrop-blur-sm transition-all duration-300',
          'hover:bg-white/80 hover:shadow-2xl hover:-translate-y-2',
          className
        )}
        {...props}
      >
        {gradient && (
          <div
            className={cn(
              'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300',
              gradient
            )}
          />
        )}
        {children}
      </Card>
    );
  }
);
GlassCard.displayName = 'GlassCard';

export {
  CardContent as GlassCardContent,
  CardDescription as GlassCardDescription,
  CardFooter as GlassCardFooter,
  CardHeader as GlassCardHeader,
  CardTitle as GlassCardTitle,
};
