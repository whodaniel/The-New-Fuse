import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Switch } from '../../../components/ui/switch';
var DefaultSkillPanel = function (_a) {
    var title = _a.title, description = _a.description, _b = _a.enabled, enabled = _b === void 0 ? false : _b, onToggle = _a.onToggle;
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-base", children: title }), description && _jsx(CardDescription, { className: "text-sm", children: description })] }), _jsx(Switch, { checked: enabled, onCheckedChange: onToggle })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "text-sm text-muted-foreground", children: enabled ? 'This skill is enabled for the agent.' : 'This skill is disabled.' }) })] }));
};
export default DefaultSkillPanel;
