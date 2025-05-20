"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-check"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
value;
;
;
const handleCapabilityChange;
;
;
const handleModelChange;
;
;
import clearFilters from 'react';
import Select_1 from '../ui/Select/Select.js';
import Button_1 from '../ui/Button/Button.js';
import lucide_react_1 from 'lucide-react';
const AgentFilters = ({ filters, onFilterChange, availableCapabilities, availableModels, }) => {
    const handleStatusChange = (value) => {
        onFilterChange(Object.assign(Object.assign({}, filters), { status(value) { } }));
    };
};
{
    onFilterChange(Object.assign(Object.assign({}, filters), { capability(value) { } }, {
        onFilterChange(Object) { }, : .assign(Object.assign({}, filters), { model() { } }, {}),
        const: hasActiveFilters = Object.values(filters).some(Boolean),
        : .status
    }, onValueChange = { handleStatusChange } >
        className, "w-[180px]" >
        placeholder, "Filter by status" /  >
        /Select_1.SelectTrigger>
        < Select_1.SelectContent >
        value, "active" > Active < /Select_1.SelectItem>
        < Select_1.SelectItem, value = "inactive" > Inactive < /Select_1.SelectItem>
        < Select_1.SelectItem, value = "error" > Error < /Select_1.SelectItem>
        < /Select_1.SelectContent>
        < /Select_1.Select>
        < Select_1.Select, value = { filters, : .capability }, onValueChange = { handleCapabilityChange } >
        className, "w-[180px]" >
        placeholder, "Filter by capability" /  >
        (/Select_1.SelectTrigger>), { availableCapabilities, : .map((capability) => key = { capability }, value = { capability } >
            { capability }
            < /Select_1.SelectItem>) }));
}
/Select_1.SelectContent>
    < /Select_1.Select>
    < Select_1.Select;
value = { filters, : .model };
onValueChange = { handleModelChange } >
    className;
"w-[180px]" >
    placeholder;
"Filter by model" /  >
    (/Select_1.SelectTrigger>);
{
    availableModels.map((model) => key = { model }, value = { model } >
        { model }
        < /Select_1.SelectItem>);
}
/Select_1.SelectContent>
    < /Select_1.Select>;
{
    hasActiveFilters && variant;
    "ghost";
    size = "sm";
    onClick = { clearFilters };
    icon = {} < lucide_react_1.X;
    className = "h-4 w-4" /  > ;
}
 >
    Clear;
Filters
    < /Button_1.Button>;
variant;
"outline";
size = "sm";
icon = {} < lucide_react_1.SlidersHorizontal;
className = "h-4 w-4" /  > ;
 >
    More;
Filters
    < /Button_1.Button>
    < /div>;
;
;
exports.AgentFilters = AgentFilters;
//# sourceMappingURL=AgentFilters.js.map
//# sourceMappingURL=AgentFilters.js.map