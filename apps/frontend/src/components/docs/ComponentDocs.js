import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDocumentation } from '@/hooks/useDocumentation';
import { APIReference } from './APIReference';
import { StyleGuide } from './StyleGuide';
export var ComponentDocs = function () {
    var _a = useDocumentation(), components = _a.components, api = _a.api, styles = _a.styles;
    return (_jsxs("div", { className: "documentation", children: [_jsx(APIReference, { components: components, api: api }), _jsx(StyleGuide, { styles: styles }), _jsx(CodeExamples, {}), _jsx(BestPractices, {})] }));
};
