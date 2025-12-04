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
var ConditionNode = memo(function (_a) {
    var id = _a.id, data = _a.data;
    // Handle condition change
    var handleConditionChange = function (condition) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, data.config), { condition: condition })
            });
        }
    };
    var inputHandles = [
        { id: 'default', label: 'Input' }
    ];
    var outputHandles = [
        { id: 'true', label: 'True' },
        { id: 'false', label: 'False' }
    ];
    var renderContent = function () {
        var _a;
        return (_jsx("div", { className: "space-y-3", children: _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "condition-".concat(id), className: "text-xs", children: "Condition Expression" }), _jsx(Textarea, { id: "condition-".concat(id), className: "h-20 text-xs resize-none", placeholder: "e.g. input.value > 10", value: ((_a = data.config) === null || _a === void 0 ? void 0 : _a.condition) || '', onChange: function (e) { return handleConditionChange(e.target.value); } }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Enter a JavaScript expression that evaluates to true or false. The expression can reference input values from connected nodes." })] }) }));
    };
    return (_jsx(BaseNode, { id: id, data: __assign(__assign({}, data), { name: data.name || 'Condition', type: 'condition', renderContent: renderContent }), inputHandles: inputHandles, outputHandles: outputHandles }));
});
ConditionNode.displayName = 'ConditionNode';
export { ConditionNode };
