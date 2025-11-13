import React from 'react';
import { type VariantProps } from 'class-variance-authority';
/**
 * Card variants using class-variance-authority
 */
export declare const cardVariants: (props?: ({
    variant?: "default" | "outline" | "ghost" | "destructive" | "elevated" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
    hoverable?: boolean | null | undefined;
    clickable?: boolean | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Card component props
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
}
declare const Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>;
declare const Header: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const Title: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>>;
declare const Description: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
declare const Content: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const Footer: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
type CardCompoundComponent = typeof Card & {
    Header: typeof Header;
    Title: typeof Title;
    Description: typeof Description;
    Content: typeof Content;
    Footer: typeof Footer;
};
declare const CardWithSubComponents: CardCompoundComponent;
export { CardWithSubComponents as Card, Header as CardHeader, Title as CardTitle, Description as CardDescription, Content as CardContent, Footer as CardFooter, };
//# sourceMappingURL=Card.d.ts.map