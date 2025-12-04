import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
// Simple placeholder components for demo
var Container = function (_a) {
    var children = _a.children, size = _a.size, className = _a.className;
    return (_jsx("div", { className: "container ".concat(size === 'sm' ? 'max-w-sm' : size === 'md' ? 'max-w-md' : size === 'lg' ? 'max-w-lg' : 'max-w-xl', " mx-auto ").concat(className), children: children }));
};
var Split = function (_a) {
    var children = _a.children, _b = _a.direction, direction = _b === void 0 ? 'horizontal' : _b, className = _a.className;
    return (_jsx("div", { className: "".concat(direction === 'vertical' ? 'flex flex-col' : 'flex', " ").concat(className), children: children }));
};
var Sidebar = function (_a) {
    var children = _a.children, open = _a.open, collapsed = _a.collapsed, onClose = _a.onClose, className = _a.className;
    return (_jsxs("div", { className: "bg-gray-100 p-4 ".concat(open ? 'block' : 'hidden', " ").concat(collapsed ? 'w-16' : 'w-64', " ").concat(className), children: [children, onClose && _jsx("button", { onClick: onClose, className: "mt-2 text-sm", children: "Close" })] }));
};
// Temporarily using local components instead of ui-consolidated
// import {
//   Badge,
//   Button,
//   Card,
//   Input,
//   Select,
//   Container,
//   Split,
//   Layout,
//   Sidebar
// } from '@the-new-fuse/ui-consolidated';
/**
 * ComponentsShowcase - A page to showcase all UI components
 */
var ComponentsShowcase = function () {
    var _a = useState(''), inputValue = _a[0], setInputValue = _a[1];
    var _b = useState(''), selectValue = _b[0], setSelectValue = _b[1];
    var _c = useState(false), sidebarOpen = _c[0], setSidebarOpen = _c[1];
    var _d = useState(false), collapsed = _d[0], setCollapsed = _d[1];
    return (_jsx("div", { className: "min-h-screen bg-white", children: _jsxs("div", { className: "max-w-4xl mx-auto py-8 px-4", children: [_jsx("h1", { className: "text-3xl font-bold mb-8 text-center", children: "UI Components Showcase" }), _jsxs("section", { className: "mb-12", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4 border-b pb-2", children: "Badges" }), _jsxs("div", { className: "flex flex-wrap gap-2 mb-4", children: [_jsx(Badge, { children: "Default Badge" }), _jsx(Badge, { className: "bg-secondary", children: "Secondary" }), _jsx(Badge, { className: "bg-destructive", children: "Destructive" }), _jsx(Badge, { className: "border border-gray-300", children: "Outline" })] })] }), _jsxs("section", { className: "mb-12", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4 border-b pb-2", children: "Buttons" }), _jsxs("div", { className: "flex flex-wrap gap-2 mb-4", children: [_jsx(Button, { children: "Default" }), _jsx(Button, { variant: "destructive", children: "Destructive" }), _jsx(Button, { variant: "outline", children: "Outline" }), _jsx(Button, { variant: "secondary", children: "Secondary" }), _jsx(Button, { variant: "ghost", children: "Ghost" }), _jsx(Button, { variant: "link", children: "Link" })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Button, { size: "sm", children: "Small" }), _jsx(Button, { children: "Default" }), _jsx(Button, { size: "lg", children: "Large" }), _jsx(Button, { isLoading: true, children: "Loading" }), _jsx(Button, { disabled: true, children: "Disabled" })] })] }), _jsxs("section", { className: "mb-12", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4 border-b pb-2", children: "Cards" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs(Card, { title: "Default Card", children: [_jsx("p", { children: "This is a default card with a title and content." }), _jsx("div", { className: "mt-4", children: _jsx(Button, { children: "Card Action" }) })] }), _jsxs(Card, { variant: "outline", title: "Outline Card", children: [_jsx("p", { children: "This is an outline card with a title and content." }), _jsx("div", { className: "mt-4", children: _jsx(Button, { variant: "outline", children: "Card Action" }) })] }), _jsxs(Card, { variant: "elevated", title: "Elevated Card", children: [_jsx("p", { children: "This is an elevated card with a title and content." }), _jsx("div", { className: "mt-4", children: _jsx(Button, { variant: "secondary", children: "Card Action" }) })] })] })] }), _jsxs("section", { className: "mb-12", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4 border-b pb-2", children: "Inputs" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "default-input", children: "Default Input" }), _jsx(Input, { id: "default-input", placeholder: "Enter text here", value: inputValue, onChange: function (e) { return setInputValue(e.target.value); } })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "disabled-input", children: "Disabled Input" }), _jsx(Input, { id: "disabled-input", placeholder: "This input is disabled", disabled: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "error-input", children: "Input with Error" }), _jsx(Input, { id: "error-input", placeholder: "Enter text here", className: "border-red-500" }), _jsx("p", { className: "text-sm text-red-500", children: "This field is required" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "success-input", children: "Input with Success" }), _jsx(Input, { id: "success-input", placeholder: "Enter text here", className: "border-green-500" }), _jsx("p", { className: "text-sm text-green-500", children: "Looks good!" })] })] })] }), _jsxs("section", { className: "mb-12", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4 border-b pb-2", children: "Select" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx("div", { children: _jsx(Select, { label: "Default Select", placeholder: "Select an option", value: selectValue, onChange: function (value) { return setSelectValue(value); }, options: [
                                            { value: 'option1', label: 'Option 1' },
                                            { value: 'option2', label: 'Option 2' },
                                            { value: 'option3', label: 'Option 3' },
                                        ] }) }), _jsx("div", { children: _jsx(Select, { label: "Disabled Select", placeholder: "This select is disabled", disabled: true, options: [
                                            { value: 'option1', label: 'Option 1' },
                                            { value: 'option2', label: 'Option 2' },
                                            { value: 'option3', label: 'Option 3' },
                                        ] }) }), _jsx("div", { children: _jsx(Select, { label: "Select with Error", placeholder: "Select an option", error: "Please select an option", options: [
                                            { value: 'option1', label: 'Option 1' },
                                            { value: 'option2', label: 'Option 2' },
                                            { value: 'option3', label: 'Option 3' },
                                        ] }) }), _jsx("div", { children: _jsx(Select, { label: "Select with Success", placeholder: "Select an option", success: "Great choice!", value: "option1", options: [
                                            { value: 'option1', label: 'Option 1' },
                                            { value: 'option2', label: 'Option 2' },
                                            { value: 'option3', label: 'Option 3' },
                                        ] }) })] })] }), _jsxs("section", { className: "mb-12", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4 border-b pb-2", children: "Container" }), _jsx(Container, { size: "sm", className: "bg-gray-100 p-4 mb-4", children: _jsx("p", { children: "This is a small container" }) }), _jsx(Container, { size: "md", className: "bg-gray-100 p-4 mb-4", children: _jsx("p", { children: "This is a medium container" }) }), _jsx(Container, { size: "lg", className: "bg-gray-100 p-4 mb-4", children: _jsx("p", { children: "This is a large container" }) }), _jsx(Container, { size: "xl", className: "bg-gray-100 p-4", children: _jsx("p", { children: "This is an extra large container" }) })] }), _jsxs("section", { className: "mb-12", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4 border-b pb-2", children: "Split" }), _jsxs("div", { className: "mb-4", children: [_jsx("h3", { className: "text-lg font-medium mb-2", children: "Horizontal Split" }), _jsxs(Split, { className: "h-64 border", children: [_jsx("div", { className: "bg-gray-100 p-4", children: "Left Panel" }), _jsx("div", { className: "bg-gray-200 p-4", children: "Right Panel" })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium mb-2", children: "Vertical Split" }), _jsxs(Split, { direction: "vertical", className: "h-64 border", children: [_jsx("div", { className: "bg-gray-100 p-4", children: "Top Panel" }), _jsx("div", { className: "bg-gray-200 p-4", children: "Bottom Panel" })] })] })] }), _jsxs("section", { className: "mb-12", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4 border-b pb-2", children: "Sidebar" }), _jsxs("div", { className: "mb-4", children: [_jsx(Button, { onClick: function () { return setSidebarOpen(true); }, className: "mr-2", children: "Open Mobile Sidebar" }), _jsxs(Button, { onClick: function () { return setCollapsed(!collapsed); }, children: [collapsed ? 'Expand' : 'Collapse', " Sidebar"] })] }), _jsxs("div", { className: "relative h-96 border overflow-hidden", children: [_jsx(Sidebar, { mobile: true, open: sidebarOpen, onClose: function () { return setSidebarOpen(false); }, items: [
                                        { label: 'Home', href: '#', active: true },
                                        { label: 'Dashboard', href: '#' },
                                        { label: 'Settings', href: '#' },
                                        { label: 'Profile', href: '#' },
                                        { label: 'Help', href: '#' },
                                    ], className: "h-full" }), _jsx(Sidebar, { collapsible: true, collapsed: collapsed, onCollapse: setCollapsed, items: [
                                        { label: 'Home', href: '#', active: true },
                                        { label: 'Dashboard', href: '#' },
                                        { label: 'Settings', href: '#' },
                                        { label: 'Profile', href: '#' },
                                        { label: 'Help', href: '#' },
                                    ], className: "h-full hidden md:block" }), _jsxs("div", { className: "".concat(collapsed ? 'ml-16' : 'ml-64', " p-4 transition-all duration-300 md:block hidden"), children: [_jsx("p", { children: "Content next to sidebar" }), _jsx("p", { className: "mt-2", children: "The sidebar can be collapsed or expanded." })] }), _jsx("div", { className: "p-4 md:hidden", children: _jsx("p", { children: "Open the mobile sidebar using the button above." }) })] })] }), _jsxs("section", { className: "mb-12", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4 border-b pb-2", children: "Layout" }), _jsx("p", { className: "mb-4", children: "The Layout component provides a complete page layout with header, sidebar, and content area." }), _jsx("p", { className: "mb-4", children: "Click the button below to see a full page layout example:" }), _jsx(Button, { onClick: function () { return window.open('/layout-example', '_blank'); }, children: "View Layout Example" })] })] }) }));
};
export default ComponentsShowcase;
