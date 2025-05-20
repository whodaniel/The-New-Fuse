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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2)
        for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar)
                    ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataMappingModal = void 0;
var react_1 = require("react");
var Modal_1 = require("../../../core/components/ui/Modal");
var Input_1 = require("@/shared/ui/core/Input");
var Button_1 = require("../../../core/components/ui/Button");
var data_1 = require("../data");
var DataMappingModal = function (_a) {
    var _b;
    var isOpen = _a.isOpen, onClose = _a.onClose, onSave = _a.onSave, dataSource = _a.dataSource, initialMapping = _a.initialMapping;
    var _c = (0, react_1.useState)(initialMapping || {
        sourceId: dataSource.id,
        mapping: { path: '' },
    }), mapping = _c[0], setMapping = _c[1];
    var _d = (0, react_1.useState)(null), previewData = _d[0], setPreviewData = _d[1];
    var _e = (0, react_1.useState)([]), selectedPath = _e[0], setSelectedPath = _e[1];
    var _f = (0, data_1.useDataSource)({
        type: dataSource.type === 'websocket' ? 'websocket' : 'rest',
        config: {
            url: dataSource.config.url || '',
            method: dataSource.config.method,
            headers: dataSource.config.headers,
        },
        enabled: isOpen,
    }), sampleData = _f.data, loading = _f.loading, error = _f.error;
    (0, react_1.useEffect)(function () {
        if (sampleData) {
            setPreviewData(sampleData);
        }
    }, [sampleData]);
    var getValueFromPath = function (obj, path) {
        return path.reduce(function (curr, key) { return (curr ? curr[key] : undefined); }, obj);
    };
    var renderDataExplorer = function (data, path, level) {
        if (path === void 0) {
            path = [];
        }
        if (level === void 0) {
            level = 0;
        }
        if (!data)
            return null;
        if (Array.isArray(data)) {
            return className = "ml-4" >
                { data, : .slice(0, 3).map(function (item, index) {
                        return key = { index };
                        className = "mt-1" >
                            className;
                        "flex items-center" >
                            className;
                        "text-gray-500" > [{ index }] < /span>;
                        {
                            renderDataExplorer(item, __spreadArray(__spreadArray([], path, true), [index.toString()], false), level + 1);
                        }
                        /div>
                            < /div>;
                    }) };
        }
        {
            data.length > 3 && className;
            "text-gray-500 mt-1" >
            ;
        }
    };
};
{
    data.length - 3;
}
more;
items
    < /div>;
/div>;
;
if (typeof data === 'object') {
    return className = "ml-4" >
        { Object, : .entries(data).map(function (_a) {
                var key = _a[0], value = _a[1];
                return key = { key };
                className = "mt-1" >
                    className;
                "flex items-center" >
                    className;
                {
                    "text-left hover:bg-gray-100 px-2 py-1 rounded ".concat(JSON.stringify(__spreadArray(__spreadArray([], path, true), [key], false)) ===
                        JSON.stringify(selectedPath)
                        ? 'bg-blue-100'
                        : '');
                }
                onClick = { function() {
                        setSelectedPath(__spreadArray(__spreadArray([], path, true), [key], false));
                        setMapping(function (prev) { return (__assign(__assign({}, prev), { mapping: __assign(__assign({}, prev.mapping), { path: __spreadArray(__spreadArray([], path, true), [key], false).join('.') }) })); });
                    } } >
                    className;
                "font-medium" > { key };
                /span>{' '};
                {
                    typeof value === 'object' ? (renderDataExplorer(value, __spreadArray(__spreadArray([], path, true), [key], false), level + 1)) : className = "text-gray-600" >
                        { JSON, : .stringify(value) }
                        < /span>;
                }
            }) }
        < /button>
        < /div>
        < /div>;
    ;
}
/div>;
;
return className;
"text-gray-600" > { JSON, : .stringify(data) } < /span>;
;
return isOpen = { isOpen };
onClose = { onClose };
title = "Map Data Source";
size = "xl" >
    className;
"space-y-6" >
    className;
"text-lg font-medium text-gray-900 mb-4" >
    Data;
Mapping
    < /h3>
    < div;
className = "grid grid-cols-2 gap-6" >
    { /* Data Explorer */}
    < div >
    className;
"text-sm font-medium text-gray-700 mb-2" >
    Available;
Data
    < /h4>
    < div;
className = "border rounded-md p-4 bg-gray-50 h-96 overflow-auto" >
    { loading } && Loading;
sample;
data;
/div>;
{
    error && className;
    "text-red-600" >
        Error;
    loading;
    data: {
        error.message;
    }
    /div>;
}
{
    previewData && renderDataExplorer(previewData);
}
/div>
    < /div>;
{ /* Mapping Configuration */ }
className;
"text-sm font-medium text-gray-700 mb-2" >
    Mapping;
Configuration
    < /h4>
    < div;
className = "space-y-4" >
    className;
"block text-sm font-medium text-gray-700" >
    Data;
Path
    < /label>
    < Input_1.Input;
value = { mapping, : .mapping.path };
onChange = { function(e) {
        return setMapping(function (prev) { return (__assign(__assign({}, prev), { mapping: __assign(__assign({}, prev.mapping), { path: e.target.value }) })); });
    } };
placeholder = "e.g., data.items[0].value";
className = "mt-1" /  >
    /div>
    < div >
    className;
"block text-sm font-medium text-gray-700" >
    Transform;
Function
    < /label>
    < textarea;
value = { mapping, : .mapping.transform || '' };
onChange = { function(e) {
        return setMapping(function (prev) { return (__assign(__assign({}, prev), { mapping: __assign(__assign({}, prev.mapping), { transform: e.target.value }) })); });
    } };
placeholder = "(data) => { return data; }";
className = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";
rows = { 4:  } /  >
    /div>
    < div >
    className;
"block text-sm font-medium text-gray-700" >
    Preview
    < /label>
    < div;
className = "mt-1 p-4 bg-gray-100 rounded-md" >
    className;
"text-sm" >
    { JSON, : .stringify(getValueFromPath(previewData, mapping.mapping.path.split('.')), null, 2) }
    < /pre>
    < /div>
    < /div>
    < /div>
    < /div>
    < /div>
    < /div>;
{ /* Refresh Settings */ }
className;
"text-lg font-medium text-gray-900 mb-4" >
    Refresh;
Settings
    < /h3>
    < div;
className = "space-y-4" >
    className;
"block text-sm font-medium text-gray-700" >
    Refresh;
Interval(seconds)
    < /label>
    < Input_1.Input;
type = "number";
value = { mapping, : .refreshInterval || 0 };
onChange = { function(e) {
        return setMapping(function (prev) { return (__assign(__assign({}, prev), { refreshInterval: parseInt(e.target.value, 10) })); });
    } };
min = { 0:  };
className = "mt-1" /  >
    /div>
    < div;
className = "flex items-center space-x-2" >
    type;
"checkbox";
id = "error-retry";
checked = {}((_b = mapping.errorHandling) === null || _b === void 0 ? void 0 : _b.retry) || false;
onChange = { function(e) {
        return setMapping(function (prev) { return (__assign(__assign({}, prev), { errorHandling: __assign(__assign({}, prev.errorHandling), { retry: e.target.checked }) })); });
    } };
className = "rounded border-gray-300 text-blue-600 focus:ring-blue-500" /  >
    htmlFor;
"error-retry";
className = "text-sm font-medium text-gray-700" >
    Retry;
on;
error
    < /label>
    < /div>
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
onClick = { function() { return onSave(mapping); } };
disabled = {};
mapping.mapping.path;
 >
    Save;
Mapping
    < /Button_1.Button>
    < /div>
    < /Modal_1.Modal>;
;
;
exports.DataMappingModal = DataMappingModal;
//# sourceMappingURL=DataMappingModal.js.map