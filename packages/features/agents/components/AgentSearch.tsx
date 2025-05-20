import React from "react";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentSearch = void 0;
import react_1 from 'react';
import lucide_react_1 from 'lucide-react';
import Input_1 from '../ui/Input/Input.js';
import useDebounce_1 from '@/hooks/useDebounce';
const AgentSearch = ({ onSearch, placeholder = 'Search agents...', }) => {
    const [searchQuery, setSearchQuery] = react_1.default.useState('');
    const debouncedSearch = (0, useDebounce_1.useDebounce)(onSearch, 300);
    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        debouncedSearch(query);
    };
    return (<div className="w-full max-w-md">
      <Input_1.Input type="text" placeholder={placeholder} value={searchQuery} onChange={handleSearch} icon={<lucide_react_1.Search className="h-4 w-4"/>} className="w-full"/>
    </div>);
};
exports.AgentSearch = AgentSearch;
export {};
//# sourceMappingURL=AgentSearch.js.map