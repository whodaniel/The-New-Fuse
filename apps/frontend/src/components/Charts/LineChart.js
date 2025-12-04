import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
export var LineChart = function (_a) {
    var data = _a.data, xKey = _a.xKey, yKey = _a.yKey, _b = _a.height, height = _b === void 0 ? 300 : _b;
    return (_jsx(ResponsiveContainer, { width: "100%", height: height, children: _jsxs(RechartsLineChart, { data: data, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: xKey }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: yKey, stroke: "#8884d8" })] }) }));
};
