import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';

// Define ClassProp inline to avoid external dependency
interface ClassProp {
  class?: string;
  className?: string;
}

declare const cardVariants: (props?: ({
    variant?: "default" | "elevated" | null | undefined;
} & ClassProp) | undefined) => string;

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
}
declare const Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>;
export { Card, cardVariants };
