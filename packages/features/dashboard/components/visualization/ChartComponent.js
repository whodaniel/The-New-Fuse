"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.ChartComponent = void 0;
var react_1 = require("react");
var recharts_1 = require("recharts");
var defaultColors = [
    '#2563eb',
    '#7c3aed',
    '#db2777',
    '#16a34a',
    '#ea580c',
    '#0d9488',
];
var ChartComponent = function (_a) {
    var type = _a.type, data = _a.data, xKey = _a.xKey, yKeys = _a.yKeys, _b = _a.colors, colors = _b === void 0 ? defaultColors : _b, _c = _a.stacked, stacked = _c === void 0 ? false : _c, _d = _a.className, className = _d === void 0 ? '' : _d;
    var chartColors = (0, react_1.useMemo)(function () {
        return colors.length >= yKeys.length
            ? colors
            : __spreadArray(__spreadArray([], colors, true), Array(yKeys.length - colors.length).fill(defaultColors[colors.length % defaultColors.length]), true);
    }, [colors, yKeys]);
    var renderChart = function () {
        switch (type) {
            case 'line':
                return data = { data } >
                    strokeDasharray;
                "3 3" /  >
                    dataKey;
                {
                    xKey;
                }
                />
                    < recharts_1.YAxis /  >
                    />
                    < recharts_1.Legend /  >
                    { yKeys, : .map(function (key, index) { return key = { key }; type = "monotone"; dataKey = { key }; stroke = { chartColors, [index]:  }; activeDot = {}; {
                            r: 8;
                        } } /  > ) };
        }
        /recharts_1.LineChart>;
        ;
    };
};
'bar';
return data = { data } >
    strokeDasharray;
"3 3" /  >
    dataKey;
{
    xKey;
}
/>
    < recharts_1.YAxis /  >
    />
    < recharts_1.Legend /  >
    { yKeys, : .map(function (key, index) { return key = { key }; dataKey = { key }; fill = { chartColors, [index]:  }; stackId = { stacked, 'stack': undefined } /  > ; }) };
/recharts_1.BarChart>;
;
'pie';
return data = { data };
nameKey = { xKey };
dataKey = { yKeys, [0]:  };
cx = "50%";
cy = "50%";
outerRadius = "80%";
fill = { chartColors, [0]:  };
label >
    { data, : .map(function (entry, index) { return key = { "cell-": .concat(index) }; fill = { chartColors, [index % chartColors.length]:  } /  > ; }) };
/recharts_1.Pie>
    < recharts_1.Tooltip /  >
    />
    < /recharts_1.PieChart>;
;
'area';
return data = { data } >
    strokeDasharray;
"3 3" /  >
    dataKey;
{
    xKey;
}
/>
    < recharts_1.YAxis /  >
    />
    < recharts_1.Legend /  >
    { yKeys, : .map(function (key, index) { return key = { key }; type = "monotone"; dataKey = { key }; fill = { chartColors, [index]:  }; stroke = { chartColors, [index]:  }; stackId = { stacked, 'stack': undefined } /  > ; }) };
/recharts_1.AreaChart>;
;
return null;
;
return className = { "w-full h-full min-h-[300px] ": .concat(className) } >
    {} < /recharts_1.ResponsiveContainer>
    < /div>;
;
;
exports.ChartComponent = ChartComponent;
//# sourceMappingURL=ChartComponent.js.map