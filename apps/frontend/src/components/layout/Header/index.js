import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
export function Header() {
    return (_jsx("header", { className: "h-16 border-b bg-card px-6", children: _jsxs("div", { className: "flex h-full items-center justify-between", children: [_jsx(Link, { to: "/", className: "text-xl font-semibold", children: "The New Fuse" }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(Button, { variant: "ghost", size: "icon", children: _jsx(Bell, { className: "h-5 w-5" }) }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", children: _jsx(User, { className: "h-5 w-5" }) }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuItem, { children: "Profile" }), _jsx(DropdownMenuItem, { children: "Settings" }), _jsx(DropdownMenuItem, { children: "Log out" })] })] })] })] }) }));
}
