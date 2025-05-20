import React from 'react';
export declare const appCardVariants: (props?: ({
    variant?: "default" | "hover" | "gradient" | "glass" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
declare const AppCard: React.ForwardRefExoticComponent<Omit<AppCardProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const AppCardHeader: React.ForwardRefExoticComponent<Omit<AppCardHeaderProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const AppCardTitle: React.ForwardRefExoticComponent<Omit<AppCardTitleProps, "ref"> & React.RefAttributes<HTMLHeadingElement>>;
declare const AppCardDescription: React.ForwardRefExoticComponent<Omit<AppCardDescriptionProps, "ref"> & React.RefAttributes<HTMLParagraphElement>>;
declare const AppCardContent: React.ForwardRefExoticComponent<Omit<AppCardContentProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const AppCardFooter: React.ForwardRefExoticComponent<Omit<AppCardFooterProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export { AppCard, AppCardHeader, AppCardTitle, AppCardDescription, AppCardContent, AppCardFooter, };
