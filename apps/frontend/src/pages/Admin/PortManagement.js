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
import { useEffect, useState } from 'react';
import { Button, Input } from '@/components/core';
import Loading from '@/components/Loading';
export default function PortManagement() {
    var _a = useState([]), ports = _a[0], setPorts = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState({}), reassignValues = _c[0], setReassignValues = _c[1];
    var fetchPorts = function () {
        setLoading(true);
        fetch('/api/ports')
            .then(function (res) { return res.json(); })
            .then(function (data) { return setPorts(data); })
            .finally(function () { return setLoading(false); });
    };
    useEffect(function () {
        fetchPorts();
    }, []);
    var handleReassign = function (id) {
        var newPort = reassignValues[id];
        if (!newPort)
            return;
        fetch("/api/ports/".concat(id, "/reassign"), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ port: newPort }),
        }).then(function () { return fetchPorts(); });
    };
    if (loading)
        return _jsx(Loading, {});
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Port Management" }), _jsxs("table", { className: "min-w-full table-auto border-collapse mb-4", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "border px-2 py-1", children: "Service" }), _jsx("th", { className: "border px-2 py-1", children: "Environment" }), _jsx("th", { className: "border px-2 py-1", children: "Port" }), _jsx("th", { className: "border px-2 py-1", children: "Status" }), _jsx("th", { className: "border px-2 py-1", children: "Reassign" })] }) }), _jsx("tbody", { children: ports.map(function (p) { return (_jsxs("tr", { children: [_jsx("td", { className: "border px-2 py-1", children: p.serviceName }), _jsx("td", { className: "border px-2 py-1", children: p.environment }), _jsx("td", { className: "border px-2 py-1", children: p.port }), _jsx("td", { className: "border px-2 py-1", children: p.status }), _jsxs("td", { className: "border px-2 py-1 flex items-center space-x-2", children: [_jsx(Input, { type: "number", className: "w-20", value: reassignValues[p.id] || '', onChange: function (e) {
                                                var _a;
                                                return setReassignValues(__assign(__assign({}, reassignValues), (_a = {}, _a[p.id] = parseInt(e.target.value, 10), _a)));
                                            }, placeholder: "New port" }), _jsx(Button, { size: "sm", onClick: function () { return handleReassign(p.id); }, children: "Reassign" })] })] }, p.id)); }) })] })] }));
}
