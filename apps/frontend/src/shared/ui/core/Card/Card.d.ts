import * as React from "react";
declare const cardVariants: (props?: ({
    variant?: "default" | "outline" | "ghost" | "elevated" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
} & import("class-variance-authority/dist/types").ClassProp) | undefined) => string;
declare const Card: React.ForwardRefExoticComponent<React.RefAttributes<unknown>>;
declare const CardHeader: React.ForwardRefExoticComponent<React.RefAttributes<unknown>>;
declare const CardTitle: React.ForwardRefExoticComponent<React.RefAttributes<unknown>>;
declare const CardDescription: React.ForwardRefExoticComponent<React.RefAttributes<unknown>>;
declare const CardContent: React.ForwardRefExoticComponent<React.RefAttributes<unknown>>;
declare const CardFooter: React.ForwardRefExoticComponent<React.RefAttributes<unknown>>;
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants, };
