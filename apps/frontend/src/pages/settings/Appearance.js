import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
export default function Appearance() {
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium", children: "Appearance Settings" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Customize how The New Fuse looks and feels" })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Theme" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "dark-mode", children: "Dark Mode" }), _jsx(Switch, { id: "dark-mode" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "show-scrollbar", children: "Show Scrollbar" }), _jsx(Switch, { id: "show-scrollbar" })] })] })] })] }));
}
