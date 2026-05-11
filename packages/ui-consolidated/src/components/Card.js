import { jsx as _jsx } from 'react/jsx-runtime';
export const Card = ({ children, ...props }) => _jsx('div', { ...props, children: children });
const Header = ({ children, ...props }) => _jsx('div', { ...props, children: children });
const Title = ({ children, ...props }) => _jsx('div', { ...props, children: children });
const Description = ({ children, ...props }) => _jsx('div', { ...props, children: children });
const Content = ({ children, ...props }) => _jsx('div', { ...props, children: children });
const Footer = ({ children, ...props }) => _jsx('div', { ...props, children: children });
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
export {
  Content as CardContent,
  Description as CardDescription,
  Footer as CardFooter,
  Header as CardHeader,
  Title as CardTitle,
  Content,
  Description,
  Footer,
  Header,
  Title,
};
export default CardWithStatics;
