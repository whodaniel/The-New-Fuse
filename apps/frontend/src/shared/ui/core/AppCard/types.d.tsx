import { VariantProps } from 'class-variance-authority';
import { HTMLAttributes } from 'react';
import { appCardVariants } from './AppCard.js';
export interface AppCardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof appCardVariants> {
    asChild?: boolean;
}
export interface AppCardHeaderProps extends HTMLAttributes<HTMLDivElement> {
    asChild?: boolean;
}
export interface AppCardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
    asChild?: boolean;
}
export interface AppCardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
    asChild?: boolean;
}
export interface AppCardContentProps extends HTMLAttributes<HTMLDivElement> {
    asChild?: boolean;
}
export interface AppCardFooterProps extends HTMLAttributes<HTMLDivElement> {
    asChild?: boolean;
}
