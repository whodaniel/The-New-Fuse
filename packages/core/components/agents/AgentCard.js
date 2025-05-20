"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCard = void 0;
var react_1 = require("react");
var Card_1 = require("../ui/Card");
var statusColors = {
    idle: 'bg-green-100 text-green-800',
    busy: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    offline: 'bg-gray-100 text-gray-800',
};
var AgentCard = function (_a) {
    var _b;
    var agent = _a.agent, onSelect = _a.onSelect, onEdit = _a.onEdit, onDelete = _a.onDelete;
    return className = "hover:shadow-md transition-shadow";
    title = {} < div;
    className = "flex items-center justify-between" >
        className;
    "text-lg font-medium text-gray-900" > { agent, : .name } < /h3>
        < span;
    className = { "px-2 py-1 rounded-full text-xs font-medium ": .concat(statusColors[agent.status]) } >
        { agent, : .status }
        < /span>
        < /div>;
}, subtitle = {} < div, className = "mt-1" >
    className;
"text-sm text-gray-500" > { agent, : .description } < /p>
    < p;
className = "text-xs text-gray-400 mt-1" > Type;
{
    agent.type;
}
/p>
    < /div>;
 >
    className;
"space-y-4" >
    className;
"text-sm font-medium text-gray-700" > Capabilities < /h4>
    < div;
className = "mt-1 flex flex-wrap gap-1" >
    { agent, : .capabilities.map(function (capability) {
            return key = { capability };
            className = "px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs" >
                { capability }
                < /span>;
        }) };
/div>
    < /div>
    < div;
className = "flex items-center justify-between text-sm text-gray-500" >
    Version;
{
    agent.metadata.version;
}
/span>
    < span > Last;
active: {
    (_b = agent.metadata.lastActive) === null || _b === void 0 ? void 0 : _b.toLocaleString();
}
/span>
    < /div>
    < /div>
    < div;
className = "mt-4 flex justify-end space-x-2" >
    { onSelect } && onClick;
{
    function () { return onSelect(agent); }
}
className = "px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors" >
    Select
    < /button>;
{
    onEdit && onClick;
    {
        function () { return onEdit(agent); }
    }
    className = "px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors" >
        Edit
        < /button>;
}
{
    onDelete && onClick;
    {
        function () { return onDelete(agent); }
    }
    className = "px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors" >
        Delete
        < /button>;
}
/div>
    < /Card_1.Card>;
;
;
exports.AgentCard = AgentCard;
export {};
//# sourceMappingURL=AgentCard.js.map