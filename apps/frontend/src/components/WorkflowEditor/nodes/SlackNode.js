import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
export var slackNode = function (_a) {
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
                }, children: _jsx("h3", { style: { margin: 0 }, children: "Slack" }) }), _jsxs("div", { className: "node-content", children: [_jsxs("div", { className: "form-group", style: { marginBottom: '10px' }, children: [_jsx("label", { children: "Channel:" }), _jsx("input", { type: "text", value: data.parameters.channel, onChange: function (e) { return onParameterChange('channel', e.target.value); }, placeholder: "#channel or @username", style: {
                                    width: '100%',
                                    padding: '5px',
                                    marginTop: '5px'
                                } })] }), _jsxs("div", { className: "form-group", style: { marginBottom: '10px' }, children: [_jsx("label", { children: "Message:" }), _jsx("textarea", { value: data.parameters.text, onChange: function (e) { return onParameterChange('text', e.target.value); }, placeholder: "Message text with optional {{ $json }} variables", style: {
                                    width: '100%',
                                    padding: '5px',
                                    marginTop: '5px',
                                    minHeight: '60px'
                                } })] }), _jsxs("div", { className: "form-group", style: { marginBottom: '10px' }, children: [_jsx("label", { children: "Blocks (JSON):" }), _jsx("textarea", { value: data.parameters.blocks, onChange: function (e) { return onParameterChange('blocks', e.target.value); }, placeholder: '[{"type": "section", "text": {"type": "mrkdwn", "text": "Hello"}}]', style: {
                                    width: '100%',
                                    padding: '5px',
                                    marginTop: '5px',
                                    minHeight: '60px'
                                } })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Thread Timestamp:" }), _jsx("input", { type: "text", value: data.parameters.threadTs, onChange: function (e) { return onParameterChange('threadTs', e.target.value); }, placeholder: "Optional thread timestamp", style: {
                                    width: '100%',
                                    padding: '5px',
                                    marginTop: '5px'
                                } })] })] }), _jsx(Handle, { type: "source", position: Position.Bottom, isConnectable: isConnectable })] }));
};
