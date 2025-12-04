import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
export var httpRequestNode = function (_a) {
    var data = _a.data, isConnectable = _a.isConnectable;
    var onParameterChange = useCallback(function (key, value) {
        data.parameters[key] = value;
    }, [data]);
    return (_jsxs("div", { className: "node-container", style: {
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '10px',
            width: '250px'
        }, children: [_jsx(Handle, { type: "target", position: Position.Top, isConnectable: isConnectable }), _jsx("div", { className: "node-header", style: {
                    borderBottom: '1px solid #eee',
                    marginBottom: '10px',
                    paddingBottom: '5px'
                }, children: _jsx("h3", { style: { margin: 0 }, children: "HTTP Request" }) }), _jsxs("div", { className: "node-content", children: [_jsxs("div", { className: "form-group", style: { marginBottom: '10px' }, children: [_jsx("label", { children: "Method:" }), _jsxs("select", { value: data.parameters.method, onChange: function (e) { return onParameterChange('method', e.target.value); }, style: {
                                    width: '100%',
                                    padding: '5px',
                                    marginTop: '5px'
                                }, children: [_jsx("option", { value: "GET", children: "GET" }), _jsx("option", { value: "POST", children: "POST" }), _jsx("option", { value: "PUT", children: "PUT" }), _jsx("option", { value: "DELETE", children: "DELETE" })] })] }), _jsxs("div", { className: "form-group", style: { marginBottom: '10px' }, children: [_jsx("label", { children: "URL:" }), _jsx("input", { type: "text", value: data.parameters.url, onChange: function (e) { return onParameterChange('url', e.target.value); }, placeholder: "https://api.example.com", style: {
                                    width: '100%',
                                    padding: '5px',
                                    marginTop: '5px'
                                } })] }), _jsxs("div", { className: "form-group", style: { marginBottom: '10px' }, children: [_jsx("label", { children: "Headers (JSON):" }), _jsx("textarea", { value: data.parameters.headers ? JSON.stringify(data.parameters.headers, null, 2) : '', onChange: function (e) {
                                    try {
                                        var headers = JSON.parse(e.target.value);
                                        onParameterChange('headers', headers);
                                    }
                                    catch (error) {
                                    }
                                }, placeholder: '{"Content-Type": "application/json"}', style: {
                                    width: '100%',
                                    padding: '5px',
                                    marginTop: '5px',
                                    minHeight: '60px'
                                } })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Body (JSON):" }), _jsx("textarea", { value: data.parameters.body, onChange: function (e) { return onParameterChange('body', e.target.value); }, placeholder: '{"key": "value"}', style: {
                                    width: '100%',
                                    padding: '5px',
                                    marginTop: '5px',
                                    minHeight: '60px'
                                } })] })] }), _jsx(Handle, { type: "source", position: Position.Bottom, isConnectable: isConnectable })] }));
};
