import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Flow } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
export var ProtocolDesigner = function () {
    var _a = React.useState([]), nodes = _a[0], setNodes = _a[1];
    var _b = React.useState('json'), selectedFormat = _b[0], setSelectedFormat = _b[1];
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsxs("div", { className: "flex justify-between p-4 border-b", children: [_jsx(Select, { value: selectedFormat, onChange: function (v) { return setSelectedFormat(v); }, options: [
                            { label: 'JSON', value: 'json' },
                            { label: 'Protocol Buffers', value: 'protobuf' },
                            { label: 'GraphQL', value: 'graphql' }
                        ] }), _jsx(Button, { onClick: function () { }, children: "Export Protocol" })] }), _jsx("div", { className: "flex-1", children: _jsx(Flow, { nodes: nodes, onNodesChange: setNodes, fitView: true }) }), _jsxs(Card, { className: "m-4", children: [_jsx("h3", { children: "Protocol Validation" }), _jsx("pre", { className: "bg-gray-100 p-2 rounded", children: JSON.stringify(generateProtocolSpec(nodes), null, 2) })] })] }));
};
