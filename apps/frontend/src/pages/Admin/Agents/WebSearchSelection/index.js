import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
var AgentWebSearchSelection = function (_a) {
    var onSelect = _a.onSelect;
    var searchProviders = [
        { id: 'google', name: 'Google Search', description: 'Google web search API' },
        { id: 'bing', name: 'Bing Search', description: 'Microsoft Bing search API' },
        { id: 'duckduckgo', name: 'DuckDuckGo', description: 'Privacy-focused search' },
        { id: 'tavily', name: 'Tavily', description: 'AI-powered search for agents' },
    ];
    return (_jsx("div", { className: "space-y-4", children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: searchProviders.map(function (provider) { return (_jsxs(Card, { className: "cursor-pointer hover:shadow-md transition-shadow", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-sm", children: provider.name }), _jsx(CardDescription, { className: "text-xs", children: provider.description })] }), _jsx(CardContent, { children: _jsxs(Button, { size: "sm", onClick: function () { return onSelect === null || onSelect === void 0 ? void 0 : onSelect(provider.id); }, className: "w-full", children: ["Select ", provider.name] }) })] }, provider.id)); }) }) }));
};
export default AgentWebSearchSelection;
