import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
export default function MobileNav(_a) {
    var _b = _a.links, links = _b === void 0 ? [
        { label: 'Features', href: '#features' },
        { label: 'About', href: '#about' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Contact', href: '#contact' },
    ] : _b, _c = _a.logo, logo = _c === void 0 ? '/logo.svg' : _c, _d = _a.brandName, brandName = _d === void 0 ? 'The New Fuse' : _d;
    var _e = useState(false), isOpen = _e[0], setIsOpen = _e[1];
    var _f = useState(false), scrolled = _f[0], setScrolled = _f[1];
    // Handle scroll effect
    useEffect(function () {
        var handleScroll = function () {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return function () { return window.removeEventListener('scroll', handleScroll); };
    }, []);
    // Prevent body scroll when menu is open
    useEffect(function () {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = '';
        }
        return function () {
            document.body.style.overflow = '';
        };
    }, [isOpen]);
    var toggleMenu = function () { return setIsOpen(!isOpen); };
    var closeMenu = function () { return setIsOpen(false); };
    return (_jsxs("nav", { className: "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ".concat(scrolled ? 'bg-background/95 backdrop-blur-md shadow-md' : 'bg-transparent'), children: [_jsx("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex items-center justify-between h-16 md:h-20", children: [_jsx(Link, { to: "/", className: "flex items-center space-x-2 z-50", onClick: closeMenu, children: _jsx("span", { className: "text-xl md:text-2xl font-bold text-foreground", children: brandName }) }), _jsxs("div", { className: "hidden md:flex items-center space-x-8", children: [links.map(function (link) { return (_jsx("a", { href: link.href, className: "text-base font-medium text-muted-foreground hover:text-foreground transition-colors duration-200", children: link.label }, link.href)); }), _jsx(Link, { to: "/login", className: "inline-flex items-center justify-center min-h-touch min-w-[120px] rounded-md px-6 py-3 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200", children: "Sign In" })] }), _jsx("button", { onClick: toggleMenu, className: "md:hidden relative z-50 min-h-touch min-w-touch flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary rounded-md", "aria-label": isOpen ? 'Close menu' : 'Open menu', "aria-expanded": isOpen, children: _jsxs("div", { className: "w-6 h-5 flex flex-col justify-between", children: [_jsx("span", { className: "block h-0.5 w-full bg-foreground transform transition-all duration-300 ".concat(isOpen ? 'rotate-45 translate-y-2' : '') }), _jsx("span", { className: "block h-0.5 w-full bg-foreground transition-all duration-300 ".concat(isOpen ? 'opacity-0' : 'opacity-100') }), _jsx("span", { className: "block h-0.5 w-full bg-foreground transform transition-all duration-300 ".concat(isOpen ? '-rotate-45 -translate-y-2' : '') })] }) })] }) }), _jsx("div", { className: "md:hidden fixed inset-0 bg-background/95 backdrop-blur-lg transition-all duration-300 ".concat(isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'), style: { top: '64px' }, children: _jsxs("div", { className: "flex flex-col items-center justify-center h-full space-y-8 px-4 transition-all duration-300 ".concat(isOpen ? 'animate-fade-in' : ''), children: [links.map(function (link, index) { return (_jsx("a", { href: link.href, onClick: closeMenu, className: "text-2xl font-medium text-foreground hover:text-primary transition-colors duration-200 ".concat(isOpen ? 'animate-slide-in-up' : ''), style: { animationDelay: "".concat(index * 0.1, "s") }, children: link.label }, link.href)); }), _jsx(Link, { to: "/login", onClick: closeMenu, className: "inline-flex items-center justify-center min-h-touch w-full max-w-xs rounded-md px-6 py-3 text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 ".concat(isOpen ? 'animate-scale-in' : ''), style: { animationDelay: "".concat(links.length * 0.1, "s") }, children: "Sign In" })] }) })] }));
}
