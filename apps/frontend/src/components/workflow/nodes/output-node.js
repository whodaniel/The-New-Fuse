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
var OutputNode = memo(function (_a) {
    var _b;
    var id = _a.id, data = _a.data;
    var _c = useState(''), newOutputKey = _c[0], setNewOutputKey = _c[1];
    var outputMapping = ((_b = data.config) === null || _b === void 0 ? void 0 : _b.outputMapping) || {};
    // Add a new output
    var handleAddOutput = function () {
        var _a;
        if (!newOutputKey.trim())
            return;
        var updatedMapping = __assign(__assign({}, outputMapping), (_a = {}, _a[newOutputKey] = '', _a));
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, data.config), { outputMapping: updatedMapping })
            });
        }
        setNewOutputKey('');
    };
    // Remove an output
    var handleRemoveOutput = function (key) {
        var updatedMapping = __assign({}, outputMapping);
        delete updatedMapping[key];
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, data.config), { outputMapping: updatedMapping })
            });
        }
    };
    // Create input handles for each output
    var inputHandles = Object.keys(outputMapping).map(function (key) { return ({
        id: key,
        label: key
    }); });
    // Add a default input handle if no outputs are defined
    if (inputHandles.length === 0) {
        inputHandles.push({ id: 'default', label: 'Input' });
    }
    var renderContent = function () { return (_jsx("div", { className: "space-y-3", children: _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { className: "text-xs", children: "Workflow Outputs" }), _jsx("div", { className: "space-y-2 mt-2", children: Object.keys(outputMapping).map(function (key) { return (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "flex-grow text-xs font-medium", children: key }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-5 w-5", onClick: function () { return handleRemoveOutput(key); }, children: _jsx(X, { className: "h-3 w-3" }) })] }, key)); }) }), _jsxs("div", { className: "flex items-center space-x-2 mt-3", children: [_jsx(Input, { className: "h-7 text-xs flex-grow", placeholder: "New output name", value: newOutputKey, onChange: function (e) { return setNewOutputKey(e.target.value); }, onKeyDown: function (e) { return e.key === 'Enter' && handleAddOutput(); } }), _jsxs(Button, { variant: "outline", size: "sm", className: "h-7 px-2", onClick: handleAddOutput, children: [_jsx(Plus, { className: "h-3 w-3 mr-1" }), _jsx("span", { className: "text-xs", children: "Add" })] })] })] }) })); };
    return (_jsx(BaseNode, { id: id, data: __assign(__assign({}, data), { name: data.name || 'Workflow Output', type: 'output', renderContent: renderContent }), inputHandles: inputHandles, outputHandles: [] }));
});
OutputNode.displayName = 'OutputNode';
export { OutputNode };
