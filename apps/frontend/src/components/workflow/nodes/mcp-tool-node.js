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
import { memo, useEffect, useState } from 'react';
import { BaseNode } from './base-node';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMcpTools } from '@/hooks/useMcpTools';
var MCPToolNode = memo(function (_a) {
    var id = _a.id, data = _a.data;
    var _b = useMcpTools(), servers = _b.servers, tools = _b.tools, loading = _b.loading;
    var _c = useState(null), selectedServer = _c[0], setSelectedServer = _c[1];
    var _d = useState(null), selectedTool = _d[0], setSelectedTool = _d[1];
    var _e = useState({}), paramValues = _e[0], setParamValues = _e[1];
    // Load selected server and tool
    useEffect(function () {
        var _a, _b;
        if (((_a = data.config) === null || _a === void 0 ? void 0 : _a.mcpServer) && servers.length > 0) {
            var server = servers.find(function (s) { return s.name === data.config.mcpServer; });
            if (server) {
                setSelectedServer(server);
                if ((_b = data.config) === null || _b === void 0 ? void 0 : _b.mcpTool) {
                    var tool = server.tools.find(function (t) { return t.name === data.config.mcpTool; });
                    if (tool) {
                        setSelectedTool(tool);
                        setParamValues(data.config.parameters || {});
                    }
                }
            }
        }
    }, [data.config, servers]);
    // Handle server selection change
    var handleServerChange = function (serverName) {
        var server = servers.find(function (s) { return s.name === serverName; });
        setSelectedServer(server || null);
        setSelectedTool(null);
        setParamValues({});
        if (data.onUpdate) {
            data.onUpdate({
                name: server ? "".concat(server.name, " Tool") : 'MCP Tool',
                config: __assign(__assign({}, data.config), { mcpServer: serverName, mcpTool: '', parameters: {} })
            });
        }
    };
    // Handle tool selection change
    var handleToolChange = function (toolName) {
        if (!selectedServer)
            return;
        var tool = selectedServer.tools.find(function (t) { return t.name === toolName; });
        setSelectedTool(tool || null);
        // Initialize default parameter values
        var initialParams = {};
        if (tool === null || tool === void 0 ? void 0 : tool.parameters) {
            Object.entries(tool.parameters).forEach(function (_a) {
                var key = _a[0], param = _a[1];
                if (param.default !== undefined) {
                    initialParams[key] = param.default;
                }
                else {
                    // Initialize with empty values based on type
                    switch (param.type) {
                        case 'string':
                            initialParams[key] = '';
                            break;
                        case 'number':
                            initialParams[key] = 0;
                            break;
                        case 'boolean':
                            initialParams[key] = false;
                            break;
                        case 'object':
                            initialParams[key] = {};
                            break;
                        case 'array':
                            initialParams[key] = [];
                            break;
                        default:
                            initialParams[key] = '';
                    }
                }
            });
        }
        setParamValues(initialParams);
        if (data.onUpdate) {
            data.onUpdate({
                name: tool ? tool.name : 'MCP Tool',
                config: __assign(__assign({}, data.config), { mcpTool: toolName, parameters: initialParams })
            });
        }
    };
    // Handle parameter value change
    var handleParamChange = function (paramName, value) {
        var _a;
        var updatedParams = __assign(__assign({}, paramValues), (_a = {}, _a[paramName] = value, _a));
        setParamValues(updatedParams);
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, data.config), { parameters: updatedParams })
            });
        }
    };
    // Render parameter input based on parameter type
    var renderParamInput = function (paramName, paramConfig) {
        var value = paramValues[paramName];
        switch (paramConfig.type) {
            case 'string':
                return (_jsx(Input, { id: "param-".concat(id, "-").concat(paramName), value: value || '', onChange: function (e) { return handleParamChange(paramName, e.target.value); }, placeholder: paramConfig.description || paramName, className: "h-7 text-xs" }));
            case 'number':
                return (_jsx(Input, { id: "param-".concat(id, "-").concat(paramName), type: "number", value: value, onChange: function (e) { return handleParamChange(paramName, parseFloat(e.target.value)); }, placeholder: paramConfig.description || paramName, className: "h-7 text-xs" }));
            case 'boolean':
                return (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { id: "param-".concat(id, "-").concat(paramName), type: "checkbox", checked: value, onChange: function (e) { return handleParamChange(paramName, e.target.checked); }, className: "h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary" }), _jsx("label", { htmlFor: "param-".concat(id, "-").concat(paramName), className: "text-xs", children: paramConfig.description || paramName })] }));
            case 'object':
            case 'array':
                return (_jsx(Textarea, { id: "param-".concat(id, "-").concat(paramName), value: typeof value === 'string' ? value : JSON.stringify(value, null, 2), onChange: function (e) {
                        try {
                            var parsed = JSON.parse(e.target.value);
                            handleParamChange(paramName, parsed);
                        }
                        catch (_a) {
                            handleParamChange(paramName, e.target.value);
                        }
                    }, placeholder: paramConfig.description || paramName, className: "h-16 text-xs" }));
            default:
                return (_jsx(Input, { id: "param-".concat(id, "-").concat(paramName), value: value || '', onChange: function (e) { return handleParamChange(paramName, e.target.value); }, placeholder: paramConfig.description || paramName, className: "h-7 text-xs" }));
        }
    };
    var inputHandles = [
        { id: 'default', label: 'Input' }
    ];
    var outputHandles = [
        { id: 'default', label: 'Output' },
        { id: 'error', label: 'Error' }
    ];
    var renderContent = function () {
        var _a, _b;
        return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "server-".concat(id), className: "text-xs", children: "MCP Server" }), _jsxs(Select, { value: ((_a = data.config) === null || _a === void 0 ? void 0 : _a.mcpServer) || '', onValueChange: handleServerChange, disabled: loading, children: [_jsx(SelectTrigger, { id: "server-".concat(id), className: "text-xs h-7 mt-1", children: _jsx(SelectValue, { placeholder: "Select server" }) }), _jsx(SelectContent, { children: servers.map(function (server) { return (_jsx(SelectItem, { value: server.name, className: "text-xs", children: server.name }, server.id)); }) })] })] }), selectedServer && (_jsxs("div", { children: [_jsx(Label, { htmlFor: "tool-".concat(id), className: "text-xs", children: "Tool" }), _jsxs(Select, { value: ((_b = data.config) === null || _b === void 0 ? void 0 : _b.mcpTool) || '', onValueChange: handleToolChange, children: [_jsx(SelectTrigger, { id: "tool-".concat(id), className: "text-xs h-7 mt-1", children: _jsx(SelectValue, { placeholder: "Select tool" }) }), _jsx(SelectContent, { children: selectedServer.tools.map(function (tool) { return (_jsx(SelectItem, { value: tool.name, className: "text-xs", children: tool.name }, tool.name)); }) })] })] })), selectedTool && selectedTool.parameters && Object.keys(selectedTool.parameters).length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { className: "text-xs", children: "Parameters" }), Object.entries(selectedTool.parameters).map(function (_a) {
                            var paramName = _a[0], paramConfig = _a[1];
                            return (_jsxs("div", { className: "space-y-1", children: [_jsxs(Label, { htmlFor: "param-".concat(id, "-").concat(paramName), className: "text-xs", children: [paramName, " ", paramConfig.required && _jsx("span", { className: "text-red-500", children: "*" })] }), renderParamInput(paramName, paramConfig)] }, paramName));
                        })] }))] }));
    };
    return (_jsx(BaseNode, { id: id, data: __assign(__assign({}, data), { name: (selectedTool === null || selectedTool === void 0 ? void 0 : selectedTool.name) || (selectedServer === null || selectedServer === void 0 ? void 0 : selectedServer.name) || data.name || 'MCP Tool', type: 'mcp-tool', renderContent: renderContent }), inputHandles: inputHandles, outputHandles: outputHandles }));
});
MCPToolNode.displayName = 'MCPToolNode';
export { MCPToolNode };
