// Card.tsx

import React, { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Card = ({ children, ...props }: CardProps) => (
  <div {...props}>{children}</div>
);

export interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const Header = ({ children, ...props }: CardSectionProps) => (
  <div {...props}>{children}</div>
);

const Title = ({ children, ...props }: CardSectionProps) => (
  <div {...props}>{children}</div>
);

const Description = ({ children, ...props }: CardSectionProps) => (
  <div {...props}>{children}</div>
);

const Content = ({ children, ...props }: CardSectionProps) => (
  <div {...props}>{children}</div>
);

const Footer = ({ children, ...props }: CardSectionProps) => (
  <div {...props}>{children}</div>
);

// Attach subcomponents as static properties
(Card as any).Header = Header;
(Card as any).Title = Title;
(Card as any).Description = Description;
(Card as any).Content = Content;
(Card as any).Footer = Footer;

// TypeScript static property typing
export interface CardComponent extends React.FC<CardProps> {
  Header: typeof Header;
  Title: typeof Title;
  Description: typeof Description;
  Content: typeof Content;
  Footer: typeof Footer;
}

const CardWithStatics = Card as CardComponent;

CardWithStatics.Header = Header;
CardWithStatics.Title = Title;
CardWithStatics.Description = Description;
CardWithStatics.Content = Content;
CardWithStatics.Footer = Footer;

export {
  Header,
  Title,
  Description,
  Content,
  Footer,
  Header as CardHeader,
  Title as CardTitle,
  Description as CardDescription,
  Content as CardContent,
  Footer as CardFooter
};
export default CardWithStatics;