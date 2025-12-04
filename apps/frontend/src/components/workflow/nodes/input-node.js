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
import { memo, useState } from 'react';
import { BaseNode } from './base-node';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
var InputNode = memo(function (_a) {
    var _b;
    var id = _a.id, data = _a.data;
    var _c = useState(''), newInputKey = _c[0], setNewInputKey = _c[1];
    var inputMapping = ((_b = data.config) === null || _b === void 0 ? void 0 : _b.inputMapping) || {};
    // Add a new input
    var handleAddInput = function () {
        var _a;
        if (!newInputKey.trim())
            return;
        var updatedMapping = __assign(__assign({}, inputMapping), (_a = {}, _a[newInputKey] = '', _a));
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, data.config), { inputMapping: updatedMapping })
            });
        }
        setNewInputKey('');
    };
    // Remove an input
    var handleRemoveInput = function (key) {
        var updatedMapping = __assign({}, inputMapping);
        delete updatedMapping[key];
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, data.config), { inputMapping: updatedMapping })
            });
        }
    };
    // Create output handles for each input
    var outputHandles = Object.keys(inputMapping).map(function (key) { return ({
        id: key,
        label: key
    }); });
    // Add a default output handle if no inputs are defined
    if (outputHandles.length === 0) {
        outputHandles.push({ id: 'default', label: 'Output' });
    }
    var renderContent = function () { return (_jsx("div", { className: "space-y-3", children: _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { className: "text-xs", children: "Workflow Inputs" }), _jsx("div", { className: "space-y-2 mt-2", children: Object.keys(inputMapping).map(function (key) { return (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "flex-grow text-xs font-medium", children: key }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-5 w-5", onClick: function () { return handleRemoveInput(key); }, children: _jsx(X, { className: "h-3 w-3" }) })] }, key)); }) }), _jsxs("div", { className: "flex items-center space-x-2 mt-3", children: [_jsx(Input, { className: "h-7 text-xs flex-grow", placeholder: "New input name", value: newInputKey, onChange: function (e) { return setNewInputKey(e.target.value); }, onKeyDown: function (e) { return e.key === 'Enter' && handleAddInput(); } }), _jsxs(Button, { variant: "outline", size: "sm", className: "h-7 px-2", onClick: handleAddInput, children: [_jsx(Plus, { className: "h-3 w-3 mr-1" }), _jsx("span", { className: "text-xs", children: "Add" })] })] })] }) })); };
    return (_jsx(BaseNode, { id: id, data: __assign(__assign({}, data), { name: data.name || 'Workflow Input', type: 'input', renderContent: renderContent }), inputHandles: [], outputHandles: outputHandles }));
});
InputNode.displayName = 'InputNode';
export { InputNode };
