"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s)
                if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WidgetConfigModal = void 0;
var react_1 = require("react");
var Modal_1 = require("../../../core/components/ui/Modal");
var Input_1 = require("@/shared/ui/core/Input");
var Button_1 = require("../../../core/components/ui/Button");
var WidgetConfigModal = function (_a) {
    var widget = _a.widget, isOpen = _a.isOpen, onClose = _a.onClose, onSave = _a.onSave;
    var _b = (0, react_1.useState)(widget), config = _b[0], setConfig = _b[1];
    var handleSave = function () {
        onSave(config);
        onClose();
    };
    var updateConfig = function (key, value) {
        setConfig(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = value, _a)));
        });
    };
    return isOpen = { isOpen };
    onClose = { onClose };
    title = "Configure Widget";
    size = "lg" >
        className;
    "space-y-6" >
        { /* Basic Settings */}
        < div >
        className;
    "text-lg font-medium text-gray-900 mb-4" >
        Basic;
    Settings
        < /h3>
        < div;
    className = "space-y-4" >
        htmlFor;
    "title";
    className = "block text-sm font-medium text-gray-700" >
        Title
        < /label>
        < Input_1.Input;
    id = "title";
    value = { config, : .title };
    onChange = { function(e) { return updateConfig('title', e.target.value); } };
    className = "mt-1" /  >
        /div>
        < div >
        htmlFor;
    "description";
    className = "block text-sm font-medium text-gray-700" >
        Description
        < /label>
        < Input_1.Input;
    id = "description";
    value = { config, : .description || '' };
    onChange = { function(e) { return updateConfig('description', e.target.value); } };
    className = "mt-1" /  >
        /div>
        < div >
        htmlFor;
    "size";
    className = "block text-sm font-medium text-gray-700" >
        Size
        < /label>
        < select;
    id = "size";
    value = { config, : .size };
    onChange = { function(e) {
            return updateConfig('size', e.target.value);
        } };
    className = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" >
        value;
    "small" > Small < /option>
        < option;
    value = "medium" > Medium < /option>
        < option;
    value = "large" > Large < /option>
        < /select>
        < /div>
        < /div>
        < /div>;
    { /* Widget-specific Settings */ }
    className;
    "text-lg font-medium text-gray-900 mb-4" >
        Widget;
    Settings
        < /h3>;
    {
        config.type === 'metric' && className;
        "space-y-4" >
            className;
        "block text-sm font-medium text-gray-700" >
            Color
            < /label>
            < select;
        value = { config, : .data.color || '' };
        onChange = { function(e) {
                return updateConfig('data', __assign(__assign({}, config.data), { color: e.target.value }));
            } };
        className = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" >
            value;
        "" > Default < /option>
            < option;
        value = "blue" > Blue < /option>
            < option;
        value = "green" > Green < /option>
            < option;
        value = "yellow" > Yellow < /option>
            < option;
        value = "red" > Red < /option>
            < option;
        value = "indigo" > Indigo < /option>
            < option;
        value = "purple" > Purple < /option>
            < /select>
            < /div>
            < /div>;
    }
    {
        config.type === 'chart' && className;
        "space-y-4" >
            className;
        "block text-sm font-medium text-gray-700" >
            Chart;
        Type
            < /label>
            < select;
        value = { config, : .data.type || 'line' };
        onChange = { function(e) {
                return updateConfig('data', __assign(__assign({}, config.data), { type: e.target.value }));
            } };
        className = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" >
            value;
        "line" > Line < /option>
            < option;
        value = "bar" > Bar < /option>
            < option;
        value = "pie" > Pie < /option>
            < /select>
            < /div>
            < /div>;
    }
    {
        (config.type === 'list' || config.type === 'table') && className;
        "space-y-4" >
            className;
        "block text-sm font-medium text-gray-700" >
            Items;
        Per;
        Page
            < /label>
            < Input_1.Input;
        type = "number";
        value = { config, : .data.pageSize || 5 };
        onChange = { function(e) {
                return updateConfig('data', __assign(__assign({}, config.data), { pageSize: parseInt(e.target.value, 10) }));
            } };
        min = { 1:  };
        max = { 50:  };
        className = "mt-1" /  >
            /div>
            < /div>;
    }
    /div>;
    { /* Refresh Settings */ }
    className;
    "text-lg font-medium text-gray-900 mb-4" >
        Refresh;
    Settings
        < /h3>
        < div >
        className;
    "block text-sm font-medium text-gray-700" >
        Auto - refresh;
    Interval(seconds)
        < /label>
        < Input_1.Input;
    type = "number";
    value = { config, : .refreshInterval || 0 };
    onChange = { function(e) {
            return updateConfig('refreshInterval', parseInt(e.target.value, 10));
        } };
    min = { 0:  };
    step = { 5:  };
    className = "mt-1" /  >
        className;
    "mt-1 text-sm text-gray-500" >
        Set;
    to;
    0;
    to;
    disable;
    auto - refresh
        < /p>
        < /div>
        < /div>
        < /div>;
    { /* Footer */ }
    className;
    "mt-6 flex justify-end space-x-3" >
        variant;
    "outline";
    onClick = { onClose } >
        Cancel
        < /Button_1.Button>
        < Button_1.Button;
    variant = "primary";
    onClick = { handleSave } >
        Save;
    Changes
        < /Button_1.Button>
        < /div>
        < /Modal_1.Modal>;
    ;
};
exports.WidgetConfigModal = WidgetConfigModal;
//# sourceMappingURL=WidgetConfigModal.js.map