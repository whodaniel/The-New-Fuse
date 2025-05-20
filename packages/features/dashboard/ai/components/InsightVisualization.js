"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightVisualization = void 0;
var react_1 = require("react");
var recharts_1 = require("recharts");
var material_1 = require("@mui/material");
var InsightVisualization = function (_a) {
    var type = _a.type, data = _a.data;
    var theme = (0, material_1.useTheme)();
    var getVisualization = function () {
        var _a, _b;
        switch (type) {
            case 'line':
                return data = { data } >
                    dataKey;
                "name";
                stroke = { theme, : .palette.text.secondary } /  >
                    stroke;
                {
                    theme.palette.text.secondary;
                }
                />
                    < recharts_1.Tooltip;
                contentStyle = {};
                {
                    backgroundColor: theme.palette.background.paper,
                        border;
                    "1px solid ".concat(theme.palette.divider),
                    ;
                }
        }
        />
            < recharts_1.Legend /  >
            type;
        "monotone";
        dataKey = "value";
        stroke = { theme, : .palette.primary.main };
        strokeWidth = { 2:  };
        dot = {};
        {
            r: 4;
        }
    }, activeDot = {}, { r: , 6:  };
} /  >
    {}((_a = data[0]) === null || _a === void 0 ? void 0 : _a.expected) && type;
"monotone";
dataKey = "expected";
stroke = { theme, : .palette.secondary.main };
strokeWidth = { 2:  };
strokeDasharray = "5 5";
dot = { false:  } /  > ;
/recharts_1.LineChart>;
;
'bar';
return data = { data } >
    dataKey;
"name";
stroke = { theme, : .palette.text.secondary } /  >
    stroke;
{
    theme.palette.text.secondary;
}
/>
    < recharts_1.Tooltip;
contentStyle = {};
{
    backgroundColor: theme.palette.background.paper,
        border;
    "1px solid ".concat(theme.palette.divider),
    ;
}
/>
    < recharts_1.Legend /  >
    dataKey;
"value";
fill = { theme, : .palette.primary.main };
radius = { [4, 4, 0, 0]:  } /  >
    {}((_b = data[0]) === null || _b === void 0 ? void 0 : _b.target) && dataKey;
"target";
fill = { theme, : .palette.secondary.main };
radius = { [4, 4, 0, 0]:  } /  > ;
/recharts_1.BarChart>;
;
'scatter';
return dataKey = "x";
name = "X";
stroke = { theme, : .palette.text.secondary } /  >
    dataKey;
"y";
name = "Y";
stroke = { theme, : .palette.text.secondary } /  >
    contentStyle;
{
    {
        backgroundColor: theme.palette.background.paper,
            border;
        "1px solid ".concat(theme.palette.divider),
        ;
    }
}
/>
    < recharts_1.Legend /  >
    name;
"Values";
data = { data };
fill = { theme, : .palette.primary.main } /  >
    /recharts_1.ScatterChart>;
;
'heatmap';
return data = { data };
colors = { [theme.palette.primary.light,
        theme.palette.primary.main,
        theme.palette.primary.dark,
    ]:  } /  > ;
;
return null;
;
return sx = {};
{
    width: '100%', height;
    '100%';
}
 >
    {} < /recharts_1.ResponsiveContainer>
    < /material_1.Box>;
;
;
exports.InsightVisualization = InsightVisualization;
//# sourceMappingURL=InsightVisualization.js.map