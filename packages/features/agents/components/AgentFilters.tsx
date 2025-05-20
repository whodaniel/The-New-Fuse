import React from "react";
Object.defineProperty(exports, "__esModule", { value: true }): value }));
    };
    const handleCapabilityChange: value }));
    };
    const handleModelChange: value }));
    };
    import clearFilters from 'react';
import Select_1 from '../ui/Select/Select.js';
import Button_1 from '../ui/Button/Button.js';
import lucide_react_1 from 'lucide-react';
const AgentFilters = ( { filters, onFilterChange, availableCapabilities, availableModels, }) => {
    const handleStatusChange = (value) => {
        onFilterChange(Object.assign(Object.assign({}, filters), { status (value) => {
        onFilterChange(Object.assign(Object.assign({}, filters), { capability (value) => {
        onFilterChange(Object.assign(Object.assign({}, filters), { model () => {
        onFilterChange({});
    };
    const hasActiveFilters = Object.values(filters).some(Boolean);
    return (<div className="flex flex-wrap items-center gap-4">
      <Select_1.Select value={filters.status} onValueChange={handleStatusChange}>
        <Select_1.SelectTrigger className="w-[180px]">
          <Select_1.SelectValue placeholder="Filter by status"/>
        </Select_1.SelectTrigger>
        <Select_1.SelectContent>
          <Select_1.SelectItem value="active">Active</Select_1.SelectItem>
          <Select_1.SelectItem value="inactive">Inactive</Select_1.SelectItem>
          <Select_1.SelectItem value="error">Error</Select_1.SelectItem>
        </Select_1.SelectContent>
      </Select_1.Select>

      <Select_1.Select value={filters.capability} onValueChange={handleCapabilityChange}>
        <Select_1.SelectTrigger className="w-[180px]">
          <Select_1.SelectValue placeholder="Filter by capability"/>
        </Select_1.SelectTrigger>
        <Select_1.SelectContent>
          {availableCapabilities.map((capability) => (<Select_1.SelectItem key={capability} value={capability}>
              {capability}
            </Select_1.SelectItem>))}
        </Select_1.SelectContent>
      </Select_1.Select>

      <Select_1.Select value={filters.model} onValueChange={handleModelChange}>
        <Select_1.SelectTrigger className="w-[180px]">
          <Select_1.SelectValue placeholder="Filter by model"/>
        </Select_1.SelectTrigger>
        <Select_1.SelectContent>
          {availableModels.map((model) => (<Select_1.SelectItem key={model} value={model}>
              {model}
            </Select_1.SelectItem>))}
        </Select_1.SelectContent>
      </Select_1.Select>

      {hasActiveFilters && (<Button_1.Button variant="ghost" size="sm" onClick={clearFilters} icon={<lucide_react_1.X className="h-4 w-4"/>}>
          Clear Filters
        </Button_1.Button>)}

      <Button_1.Button variant="outline" size="sm" icon={<lucide_react_1.SlidersHorizontal className="h-4 w-4"/>}>
        More Filters
      </Button_1.Button>
    </div>);
};
exports.AgentFilters = AgentFilters;
export {};
//# sourceMappingURL=AgentFilters.js.map