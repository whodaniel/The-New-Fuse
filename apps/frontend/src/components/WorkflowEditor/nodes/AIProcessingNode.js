import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
export var AIProcessingNode = function (_a) {
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
                }, children: _jsx("h3", { style: { margin: 0 }, children: "AI Processing" }) }), _jsxs("div", { className: "node-content", children: [_jsxs("div", { className: "form-group", style: { marginBottom: '10px' }, children: [_jsx("label", { children: "AI Task:" }), _jsx("select", { value: data.parameters.aiTask, onChange: function (e) { return onParameterChange('aiTask', e.target.value); }, style: {
                                    width: '100%',
                                    padding: '5px',
                                    marginTop: '5px'
                                }, children: _jsx("option", { value: "textAnalysis", children: "Text Analysis" }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Text Input:" }), _jsx("textarea", { value: data.parameters.textInput, onChange: function (e) { return onParameterChange('textInput', e.target.value); }, placeholder: "Enter text to analyze", style: {
                                    width: '100%',
                                    padding: '5px',
                                    marginTop: '5px',
                                    minHeight: '60px'
                                } })] })] }), _jsx(Handle, { type: "source", position: Position.Bottom, isConnectable: isConnectable })] }));
};
