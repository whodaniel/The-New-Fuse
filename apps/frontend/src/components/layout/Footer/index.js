import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
export function Footer() {
    return (_jsx("footer", { className: "border-t bg-card py-4 px-6", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("p", { className: "text-sm text-muted-foreground", children: ["\u00A9 ", new Date().getFullYear(), " The New Fuse. All rights reserved."] }), _jsxs("nav", { className: "flex space-x-4", children: [_jsx(Link, { to: "/legal/privacy-policy", className: "text-sm text-muted-foreground hover:text-foreground", children: "Privacy Policy" }), _jsx(Link, { to: "/legal/terms-of-service", className: "text-sm text-muted-foreground hover:text-foreground", children: "Terms of Service" })] })] }) }));
}
