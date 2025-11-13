// Card.tsx
import React from 'react';
export const Card = ({ children, ...props }) => (<div {...props}>{children}</div>);
const Header = ({ children, ...props }) => (<div {...props}>{children}</div>);
const Title = ({ children, ...props }) => (<div {...props}>{children}</div>);
const Description = ({ children, ...props }) => (<div {...props}>{children}</div>);
const Content = ({ children, ...props }) => (<div {...props}>{children}</div>);
const Footer = ({ children, ...props }) => (<div {...props}>{children}</div>);
// Attach subcomponents as static properties
Card.Header = Header;
Card.Title = Title;
Card.Description = Description;
Card.Content = Content;
Card.Footer = Footer;
const CardWithStatics = Card;
CardWithStatics.Header = Header;
CardWithStatics.Title = Title;
CardWithStatics.Description = Description;
CardWithStatics.Content = Content;
CardWithStatics.Footer = Footer;
export { Header, Title, Description, Content, Footer, Header as CardHeader, Title as CardTitle, Description as CardDescription, Content as CardContent, Footer as CardFooter };
export default CardWithStatics;
//# sourceMappingURL=Card.js.map