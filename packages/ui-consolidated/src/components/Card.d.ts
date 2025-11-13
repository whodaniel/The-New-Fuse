import React, { HTMLAttributes, ReactNode } from 'react';
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}
export declare const Card: ({ children, ...props }: CardProps) => React.JSX.Element;
export interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}
declare const Header: ({ children, ...props }: CardSectionProps) => React.JSX.Element;
declare const Title: ({ children, ...props }: CardSectionProps) => React.JSX.Element;
declare const Description: ({ children, ...props }: CardSectionProps) => React.JSX.Element;
declare const Content: ({ children, ...props }: CardSectionProps) => React.JSX.Element;
declare const Footer: ({ children, ...props }: CardSectionProps) => React.JSX.Element;
export interface CardComponent extends React.FC<CardProps> {
    Header: typeof Header;
    Title: typeof Title;
    Description: typeof Description;
    Content: typeof Content;
    Footer: typeof Footer;
}
declare const CardWithStatics: CardComponent;
export { Header, Title, Description, Content, Footer, Header as CardHeader, Title as CardTitle, Description as CardDescription, Content as CardContent, Footer as CardFooter };
export default CardWithStatics;
//# sourceMappingURL=Card.d.ts.map