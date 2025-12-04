var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { BaseNode } from './base-node';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
var TransformNode = memo(function (_a) {
    var id = _a.id, data = _a.data;
    // Handle transform code change
    var handleTransformCodeChange = function (code) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, data.config), { transformCode: code })
            });
        }
    };
    // Handle transform type change
    var handleTransformTypeChange = function (type) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, data.config), { transformType: type })
            });
        }
    };
    var inputHandles = [
        { id: 'default', label: 'Input' }
    ];
    var outputHandles = [
        { id: 'default', label: 'Output' }
    ];
    var renderContent = function () {
        var _a, _b, _c, _d;
        return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "transform-type-".concat(id), className: "text-xs", children: "Transform Type" }), _jsxs("select", { id: "transform-type-".concat(id), className: "w-full text-xs h-8 rounded-md border border-input", value: ((_a = data.config) === null || _a === void 0 ? void 0 : _a.transformType) || 'javascript', onChange: function (e) { return handleTransformTypeChange(e.target.value); }, children: [_jsx("option", { value: "javascript", children: "JavaScript" }), _jsx("option", { value: "json-path", children: "JSONPath" }), _jsx("option", { value: "template", children: "Template" })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "transform-code-".concat(id), className: "text-xs", children: "Transform Code" }), _jsx(Textarea, { id: "transform-code-".concat(id), className: "h-32 text-xs font-mono resize-none", placeholder: getPlaceholderByType((_b = data.config) === null || _b === void 0 ? void 0 : _b.transformType), value: ((_c = data.config) === null || _c === void 0 ? void 0 : _c.transformCode) || '', onChange: function (e) { return handleTransformCodeChange(e.target.value); } }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: getHelpTextByType((_d = data.config) === null || _d === void 0 ? void 0 : _d.transformType) })] })] }));
    };
    return (_jsx(BaseNode, { id: id, data: __assign(__assign({}, data), { name: data.name || 'Transform', type: 'transform', renderContent: renderContent }), inputHandles: inputHandles, outputHandles: outputHandles }));
});
// Helper functions for transform node
function getPlaceholderByType(type) {
    if (type === void 0) { type = 'javascript'; }
    switch (type) {
        case 'javascript':
            return '// Transform input data\nfunction transform(input) {\n  // Your code here\n  return input;\n}';
        case 'json-path':
            return '$.data.items[*].name';
        case 'template':
            return 'Hello {{name}}, welcome to {{company}}!';
        default:
            return '';
    }
}
function getHelpTextByType(type) {
    if (type === void 0) { type = 'javascript'; }
    switch (type) {
        case 'javascript':
            return 'Write JavaScript code to transform the input data. The input is available as the "input" parameter.';
        case 'json-path':
            return 'Use JSONPath expressions to extract data from the input JSON object.';
        case 'template':
            return 'Use handlebars-style templates with {{variable}} syntax to create text from input data.';
        default:
            return '';
    }
}
TransformNode.displayName = 'TransformNode';
export { TransformNode };
