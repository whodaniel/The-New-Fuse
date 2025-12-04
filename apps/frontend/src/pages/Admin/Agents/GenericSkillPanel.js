import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
var GenericSkillPanel = function (_a) {
    var title = _a.title, description = _a.description, children = _a.children;
    return (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: title }), description && _jsx(CardDescription, { children: description })] }), _jsx(CardContent, { children: children || _jsx("div", { className: "text-muted-foreground", children: "Configure this skill..." }) })] }));
};
export default GenericSkillPanel;
