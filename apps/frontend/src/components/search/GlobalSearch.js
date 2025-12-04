import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSearch } from '@/hooks/useSearch';
import { SearchFilters } from './SearchFilters';
import { SearchResults } from './SearchResults';
export var GlobalSearch = function () {
    var _a = useSearch(), query = _a.query, filters = _a.filters, results = _a.results, search = _a.search;
    return (_jsxs("div", { className: "global-search", children: [_jsx(SearchBar, { value: query, onChange: search, hotkey: "cmd+k" }), _jsx(SearchFilters, { filters: filters, onChange: setFilters }), _jsx(SearchResults, { results: results })] }));
};
