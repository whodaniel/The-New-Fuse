import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@/shared/ui/core/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
export function MetricCard(_a) {
    var title = _a.title, value = _a.value, unit = _a.unit, history = _a.history, _b = _a.color, color = _b === void 0 ? '#2563eb' : _b;
    return (_jsx(Card, { className: "h-full", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "mb-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: title }), _jsxs("p", { className: "text-3xl font-bold text-primary", children: [value.toFixed(2), " ", unit] })] }), _jsx("div", { className: "h-[100px]", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: history, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-gray-200" }), _jsx(XAxis, { dataKey: "timestamp", tickFormatter: function (timestamp) { return new Date(timestamp).toLocaleTimeString(); }, className: "text-xs" }), _jsx(YAxis, { className: "text-xs" }), _jsx(Tooltip, { labelFormatter: function (timestamp) { return new Date(timestamp).toLocaleTimeString(); }, contentStyle: {
                                        backgroundColor: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.375rem'
                                    } }), _jsx(Line, { type: "monotone", dataKey: "value", stroke: color, dot: false, strokeWidth: 2 })] }) }) })] }) }));
}
