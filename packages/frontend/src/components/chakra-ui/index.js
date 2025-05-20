import React from 'react';

/**
 * @typedef {object} ChakraComponentProps
 * @property {React.ReactNode} [children]
 * @property {any} [as]
 */

/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
const ChakraAccordion = ({ children, ...props }) => <div data-testid="mock-chakra-accordion" {...props}>{children}</div>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
const ChakraAccordionItem = ({ children, ...props }) => <div data-testid="mock-chakra-accordion-item" {...props}>{children}</div>;
/** @type {React.FC<ChakraComponentProps & React.ButtonHTMLAttributes<HTMLButtonElement>>} */
const ChakraAccordionButton = ({ children, ...props }) => <button data-testid="mock-chakra-accordion-button" {...props}>{children}</button>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
const ChakraAccordionPanel = ({ children, ...props }) => <div data-testid="mock-chakra-accordion-panel" {...props}>{children}</div>;
/** @type {React.FC<React.HTMLAttributes<HTMLSpanElement>>} */
const ChakraAccordionIcon = (props) => <span data-testid="mock-chakra-accordion-icon" {...props}>Icon</span>;

/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
const ChakraAlert = ({ children, ...props }) => <div role="alert" data-testid="mock-chakra-alert" {...props}>{children}</div>;
/** @type {React.FC<React.HTMLAttributes<HTMLSpanElement>>} */
const ChakraAlertIcon = (props) => <span data-testid="mock-chakra-alert-icon" {...props}>AlertIcon</span>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
const ChakraAlertTitle = ({ children, ...props }) => <div data-testid="mock-chakra-alert-title" {...props}>{children}</div>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
const ChakraAlertDescription = ({ children, ...props }) => <div data-testid="mock-chakra-alert-description" {...props}>{children}</div>;

/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLElement>>} */
const ChakraAspectRatio = ({ as: Component = 'div', children, ...props }) => <Component data-testid="mock-chakra-aspect-ratio" {...props}>{children}</Component>;

/** @type {React.FC<React.HTMLAttributes<HTMLDivElement>>} */
const ChakraAvatar = (props) => <div data-testid="mock-chakra-avatar" {...props}>Avatar</div>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
const ChakraAvatarBadge = ({ children, ...props }) => <div data-testid="mock-chakra-avatar-badge" {...props}>{children}</div>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
const ChakraAvatarGroup = ({ children, ...props }) => <div data-testid="mock-chakra-avatar-group" {...props}>{children}</div>;

/** @type {React.FC<React.HTMLAttributes<HTMLSpanElement>>} */
const ChakraBadge = (props) => <span data-testid="mock-chakra-badge" {...props}>Badge</span>;

/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
const ChakraBox = ({ children, ...props }) => <div data-testid="mock-chakra-box" {...props}>{children}</div>;
/** @type {React.FC<React.HTMLAttributes<HTMLElement>>} */
const ChakraBreadcrumb = (props) => <nav aria-label="breadcrumb" data-testid="mock-chakra-breadcrumb" {...props}>Breadcrumb</nav>;

/** @type {React.FC<React.ImgHTMLAttributes<HTMLImageElement>>} */
const ChakraImage = (props) => <img alt="mock" data-testid="mock-chakra-image" {...props} />;
/** @type {React.FC<ChakraComponentProps & React.AnchorHTMLAttributes<HTMLAnchorElement>>} */
const ChakraLink = (props) => <a data-testid="mock-chakra-link" {...props}>{props.children}</a>;

/** @type {React.FC<React.InputHTMLAttributes<HTMLInputElement>>} */
const ChakraRadio = (props) => <input type="radio" data-testid="mock-chakra-radio" {...props} />;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
const ChakraRadioGroup = ({ children, ...props }) => <div role="radiogroup" data-testid="mock-chakra-radio-group" {...props}>{children}</div>;

/** @type {React.FC<React.HTMLAttributes<HTMLDivElement>>} */
const ChakraSkeleton = (props) => <div data-testid="mock-chakra-skeleton" {...props}>Loading...</div>;
/** @type {React.FC<React.InputHTMLAttributes<HTMLInputElement>>} */
const ChakraSlider = (props) => <input type="range" data-testid="mock-chakra-slider" {...props} />;

/** @type {React.FC<ChakraComponentProps & React.ButtonHTMLAttributes<HTMLButtonElement>>} */
const ChakraTab = ({ children, ...props }) => <button role="tab" data-testid="mock-chakra-tab" {...props}>{children}</button>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
const ChakraTabList = ({ children, ...props }) => <div role="tablist" data-testid="mock-chakra-tablist" {...props}>{children}</div>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
const ChakraTabPanel = ({ children, ...props }) => <div role="tabpanel" data-testid="mock-chakra-tabpanel" {...props}>{children}</div>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
const ChakraTabPanels = ({ children, ...props }) => <div data-testid="mock-chakra-tabpanels" {...props}>{children}</div>;

// Exported components using the above placeholders
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
export const Accordion = ({ children, ...props }) => <ChakraAccordion {...props}>{children}</ChakraAccordion>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
export const AccordionItem = ({ children, ...props }) => <ChakraAccordionItem {...props}>{children}</ChakraAccordionItem>;
/** @type {React.FC<ChakraComponentProps & React.ButtonHTMLAttributes<HTMLButtonElement>>} */
export const AccordionButton = ({ children, ...props }) => <ChakraAccordionButton {...props}>{children}</ChakraAccordionButton>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
export const AccordionPanel = ({ children, ...props }) => <ChakraAccordionPanel {...props}>{children}</ChakraAccordionPanel>;
/** @type {React.FC<React.HTMLAttributes<HTMLSpanElement>>} */
export const AccordionIcon = (props) => <ChakraAccordionIcon {...props}/>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
export const Alert = ({ children, ...props }) => <ChakraAlert {...props}>{children}</ChakraAlert>;
/** @type {React.FC<React.HTMLAttributes<HTMLSpanElement>>} */
export const AlertIcon = (props) => <ChakraAlertIcon {...props}/>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
export const AlertTitle = ({ children, ...props }) => <ChakraAlertTitle {...props}>{children}</ChakraAlertTitle>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
export const AlertDescription = ({ children, ...props }) => <ChakraAlertDescription {...props}>{children}</ChakraAlertDescription>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLElement>>} */
export const AspectRatio = ({ as, children, ...props }) => <ChakraAspectRatio as={as} {...props}>{children}</ChakraAspectRatio>;
/** @type {React.FC<React.HTMLAttributes<HTMLDivElement>>} */
export const Avatar = (props) => <ChakraAvatar {...props} />;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
export const AvatarBadge = ({ children, ...props }) => <ChakraAvatarBadge {...props}>{children}</ChakraAvatarBadge>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
export const AvatarGroup = ({ children, ...props }) => <ChakraAvatarGroup {...props}>{children}</ChakraAvatarGroup>;
/** @type {React.FC<React.HTMLAttributes<HTMLSpanElement>>} */
export const Badge = (props) => <ChakraBadge {...props} />;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
export const Box = ({ children, ...props }) => <ChakraBox {...props}>{children}</ChakraBox>;
/** @type {React.FC<React.HTMLAttributes<HTMLElement>>} */
export const Breadcrumb = (props) => <ChakraBreadcrumb {...props} />;
/** @type {React.FC<ChakraComponentProps & React.ButtonHTMLAttributes<HTMLButtonElement>>} */
export const Button = ({ children, ...props }) => <button {...props}>{children}</button>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
export const Container = ({ children, ...props }) => <div className="container" {...props}>{children}</div>;
/** @type {React.FC<React.HTMLAttributes<HTMLHRElement>>} */
export const Divider = (props) => <hr {...props} />;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
export const Flex = ({ children, ...props }) => <div className="flex" {...props}>{children}</div>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
export const FormControl = ({ children, ...props }) => <div className="form-control" {...props}>{children}</div>;
/** @type {React.FC<ChakraComponentProps & React.LabelHTMLAttributes<HTMLLabelElement>>} */
export const FormLabel = ({ children, ...props }) => <label className="form-label" {...props}>{children}</label>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLHeadingElement>>} */
export const Heading = ({ children, ...props }) => <h2 {...props}>{children}</h2>; // Assuming h2, adjust as needed
/** @type {React.FC<React.SVGProps<SVGSVGElement> & {as?: React.ElementType}>} */
export const Icon = ({ as: Component, ...props }) => {
 if (Component) {
   // If 'as' prop is provided, assume it's an SVG or can handle SVG props
   return <Component {...props} />;
 }
 // Fallback to a span if 'as' is not provided, ensure props are compatible with span
 // Remove SVG specific props before passing to span
 const { viewBox, focusable, path, d, fill, stroke, strokeWidth, strokeLinecap, strokeLinejoin, ...spanProps } = props;
 return <span {...spanProps} />;
};
/** @type {React.FC<React.ImgHTMLAttributes<HTMLImageElement>>} */
export const Image = (props) => <ChakraImage {...props} />;
/** @type {React.FC<React.InputHTMLAttributes<HTMLInputElement>>} */
export const Input = (props) => <input {...props} />;
/** @type {React.FC<ChakraComponentProps & React.AnchorHTMLAttributes<HTMLAnchorElement>>} */
export const Link = (props) => <ChakraLink {...props} />;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLUListElement>>} */
export const List = ({ children, ...props }) => <ul {...props}>{children}</ul>;
/** @type {React.FC<ChakraComponentProps & React.LiHTMLAttributes<HTMLLIElement>>} */
export const ListItem = ({ children, ...props }) => <li {...props}>{children}</li>;
/** @type {React.FC<React.InputHTMLAttributes<HTMLInputElement>>} */
export const Radio = (props) => <ChakraRadio {...props} />;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
export const RadioGroup = ({ children, ...props }) => <ChakraRadioGroup {...props}>{children}</ChakraRadioGroup>;
/** @type {React.FC<ChakraComponentProps & React.SelectHTMLAttributes<HTMLSelectElement>>} */
export const Select = ({ children, ...props }) => <select {...props}>{children}</select>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
export const SimpleGrid = ({ children, ...props }) => <div className="grid" {...props}>{children}</div>;
/** @type {React.FC<React.HTMLAttributes<HTMLDivElement>>} */
export const Skeleton = (props) => <ChakraSkeleton {...props} />;
/** @type {React.FC<React.InputHTMLAttributes<HTMLInputElement>>} */
export const Slider = (props) => <ChakraSlider {...props} />;
/** @type {React.FC<React.InputHTMLAttributes<HTMLInputElement>>} */
export const Switch = (props) => <input type="checkbox" role="switch" {...props} />;
/** @type {React.FC<ChakraComponentProps & React.ButtonHTMLAttributes<HTMLButtonElement>>} */
export const Tab = ({ children, ...props }) => <ChakraTab {...props}>{children}</ChakraTab>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
export const TabList = ({ children, ...props }) => <ChakraTabList {...props}>{children}</ChakraTabList>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
export const TabPanel = ({ children, ...props }) => <ChakraTabPanel {...props}>{children}</ChakraTabPanel>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
export const TabPanels = ({ children, ...props }) => <ChakraTabPanels {...props}>{children}</ChakraTabPanels>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLParagraphElement>>} */
export const Text = ({ children, ...props }) => <p {...props}>{children}</p>;

/**
 * @typedef {object} ThemeProviderProps
 * @property {object} [themeOverride]
 * @property {React.ReactNode} children
 */
/** @type {React.FC<ThemeProviderProps>} */
export const ThemeProvider = ({ themeOverride, children }) => {
  // console.warn('Mock Chakra ThemeProvider used. Actual theme override:', themeOverride);
  return <>{children}</>;
};
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
export const VStack = ({ children, ...props }) => <div style={{ display: 'flex', flexDirection: 'column' }} {...props}>{children}</div>;
/** @type {React.FC<ChakraComponentProps & React.HTMLAttributes<HTMLDivElement>>} */
export const HStack = ({ children, ...props }) => <div style={{ display: 'flex', flexDirection: 'row' }} {...props}>{children}</div>;

// Mock hooks
/**
 * @returns {{ colorMode: string, toggleColorMode: () => void, setColorMode: React.Dispatch<React.SetStateAction<string>> }}
 */
export const useColorMode = () => {
  const [colorMode, setColorMode] = React.useState('light');
  // console.warn('Mock Chakra useColorMode used.');
  return {
    colorMode,
    toggleColorMode: () => setColorMode(prev => prev === 'light' ? 'dark' : 'light'),
    setColorMode
  };
};

/**
 * @param {object} themeOverride
 * @returns {object}
 */
export const extendTheme = (themeOverride) => {
  // console.warn('Mock Chakra extendTheme used. Theme override:', themeOverride);
  return { ...themeOverride, mockExtended: true };
};
