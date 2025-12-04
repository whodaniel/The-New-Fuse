import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
export default function API() {
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium", children: "API Settings" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Manage your API keys and integrations" })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "API Keys" }) }), _jsx(CardContent, { className: "space-y-4", children: _jsxs("div", { className: "grid gap-2", children: [_jsx(Label, { htmlFor: "api-key", children: "API Key" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { id: "api-key", type: "password" }), _jsx(Button, { variant: "outline", children: "Generate New" })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Webhooks" }) }), _jsx(CardContent, { className: "space-y-4", children: _jsxs("div", { className: "grid gap-2", children: [_jsx(Label, { htmlFor: "webhook-url", children: "Webhook URL" }), _jsx(Input, { id: "webhook-url", placeholder: "https://" })] }) })] })] }));
}
