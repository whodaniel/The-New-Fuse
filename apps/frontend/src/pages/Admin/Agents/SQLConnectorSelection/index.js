import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
var AgentSQLConnectorSelection = function (_a) {
    var onSelect = _a.onSelect;
    var sqlProviders = [
        { id: 'postgresql', name: 'PostgreSQL', description: 'Connect to PostgreSQL databases' },
        { id: 'mysql', name: 'MySQL', description: 'Connect to MySQL databases' },
        { id: 'mssql', name: 'SQL Server', description: 'Connect to Microsoft SQL Server' },
        { id: 'sqlite', name: 'SQLite', description: 'Connect to SQLite databases' },
    ];
    return (_jsx("div", { className: "space-y-4", children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: sqlProviders.map(function (provider) { return (_jsxs(Card, { className: "cursor-pointer hover:shadow-md transition-shadow", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-sm", children: provider.name }), _jsx(CardDescription, { className: "text-xs", children: provider.description })] }), _jsx(CardContent, { children: _jsxs(Button, { size: "sm", onClick: function () { return onSelect === null || onSelect === void 0 ? void 0 : onSelect(provider.id); }, className: "w-full", children: ["Select ", provider.name] }) })] }, provider.id)); }) }) }));
};
export default AgentSQLConnectorSelection;
