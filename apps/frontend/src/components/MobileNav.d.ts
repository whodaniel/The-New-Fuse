interface NavLink {
    label: string;
    href: string;
}
interface MobileNavProps {
    links?: NavLink[];
    logo?: string;
    brandName?: string;
}
export default function MobileNav({ links, logo, brandName }: MobileNavProps): import("react/jsx-runtime").JSX.Element;
export {};
