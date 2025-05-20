"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-check"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
grid - cols - 2;
gap - 6;
">
    < Card_1.Card >
    Response;
Time < /Card_1.CardTitle>
    < /Card_1.CardHeader>
    < Card_1.CardContent >
    className;
require("react");
const Card_1;
-span - 2;
">
    < Card_1.CardHeader >
    Total;
Calls < /Card_1.CardTitle>
    < /Card_1.CardHeader>
    < Card_1.CardContent >
    className;
require("../ui/Card/Card");
import recharts_1 from 'recharts';
const AgentMetrics = ({ agent, responseTimeData, successRateData, totalCallsData, }) => {
    return className = "grid grid-cols-1 md";
    h - [300, px];
    ">
        < recharts_1.ResponsiveContainer;
    width = "100%";
    height = "100%" >
        data;
    {
        responseTimeData;
    }
     >
        strokeDasharray;
    "3 3" /  >
        dataKey;
    "timestamp";
    tickFormatter = {}(value);
};
new Date(value).toLocaleTimeString();
/>
    < recharts_1.YAxis;
unit = "ms" /  >
    labelFormatter;
{
    (value) => new Date(value).toLocaleString();
}
/>
    < recharts_1.Line;
type = "monotone";
dataKey = "value";
stroke = "#2563eb";
strokeWidth = { 2:  };
dot = { false:  } /  >
    /recharts_1.LineChart>
    < /recharts_1.ResponsiveContainer>
    < /div>
    < /Card_1.CardContent>
    < /Card_1.Card>
    < Card_1.Card >
    Success;
Rate < /Card_1.CardTitle>
    < /Card_1.CardHeader>
    < Card_1.CardContent >
    className;
"h-[300px]" >
    width;
"100%";
height = "100%" >
    data;
{
    successRateData;
}
 >
    strokeDasharray;
"3 3" /  >
    dataKey;
"timestamp";
tickFormatter = {}(value);
new Date(value).toLocaleTimeString();
/>
    < recharts_1.YAxis;
unit = "%";
domain = { [0, 100]:  } /  >
    labelFormatter;
{
    (value) => new Date(value).toLocaleString();
}
/>
    < recharts_1.Line;
type = "monotone";
dataKey = "value";
stroke = "#16a34a";
strokeWidth = { 2:  };
dot = { false:  } /  >
    /recharts_1.LineChart>
    < /recharts_1.ResponsiveContainer>
    < /div>
    < /Card_1.CardContent>
    < /Card_1.Card>
    < Card_1.Card;
className = "md";
h - [300, px];
">
    < recharts_1.ResponsiveContainer;
width = "100%";
height = "100%" >
    data;
{
    totalCallsData;
}
 >
    strokeDasharray;
"3 3" /  >
    dataKey;
"timestamp";
tickFormatter = {}(value);
new Date(value).toLocaleTimeString();
/>
    < recharts_1.YAxis /  >
    labelFormatter;
{
    (value) => new Date(value).toLocaleString();
}
/>
    < recharts_1.Line;
type = "monotone";
dataKey = "value";
stroke = "#9333ea";
strokeWidth = { 2:  };
dot = { false:  } /  >
    /recharts_1.LineChart>
    < /recharts_1.ResponsiveContainer>
    < /div>
    < /Card_1.CardContent>
    < /Card_1.Card>
    < Card_1.Card;
className = "md:col-span-2" >
    Summary;
Statistics < /Card_1.CardTitle>
    < /Card_1.CardHeader>
    < Card_1.CardContent >
    className;
"grid grid-cols-1 md:grid-cols-3 gap-4" >
    className;
"p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg" >
    className;
"text-sm font-medium text-blue-600 dark:text-blue-400" >
    Average;
Response;
Time
    < /div>
    < div;
className = "mt-1 text-2xl font-semibold" >
    { agent, : .metrics.averageResponseTime };
ms
    < /div>
    < /div>
    < div;
className = "p-4 bg-green-50 dark:bg-green-900/20 rounded-lg" >
    className;
"text-sm font-medium text-green-600 dark:text-green-400" >
    Success;
Rate
    < /div>
    < div;
className = "mt-1 text-2xl font-semibold" >
    { agent, : .metrics.successRate } %
        /div>
    < /div>
    < div;
className = "p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg" >
    className;
"text-sm font-medium text-purple-600 dark:text-purple-400" >
    Total;
Calls
    < /div>
    < div;
className = "mt-1 text-2xl font-semibold" >
    { agent, : .metrics.totalCalls }
    < /div>
    < /div>
    < /div>
    < /Card_1.CardContent>
    < /Card_1.Card>
    < /div>;
;
;
exports.AgentMetrics = AgentMetrics;
//# sourceMappingURL=AgentMetrics.js.map
//# sourceMappingURL=AgentMetrics.js.map