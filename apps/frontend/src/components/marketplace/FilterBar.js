import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterBar = void 0;
import lucide_react_1 from 'lucide-react';
import Input_1 from '../ui/Input/Input';
import Select_1 from '../ui/Select/Select';
import Button_1 from '../ui/Button/Button';
var FilterBar = function (_a) {
    var categories = _a.categories, tags = _a.tags, onSearchChange = _a.onSearchChange, onCategoryChange = _a.onCategoryChange, onTagChange = _a.onTagChange, onSortChange = _a.onSortChange, onPriceRangeChange = _a.onPriceRangeChange;
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsx("div", { className: "flex-1", children: _jsx(Input_1.Input, { placeholder: "Search marketplace...", onChange: function (e) { return onSearchChange(e.target.value); }, icon: _jsx(lucide_react_1.Search, { className: "h-4 w-4" }) }) }), _jsx("div", { className: "w-full sm:w-48", children: _jsxs(Select_1.Select, { onValueChange: onSortChange, children: [_jsx(Select_1.SelectTrigger, { children: _jsx(Select_1.SelectValue, { placeholder: "Sort by" }) }), _jsxs(Select_1.SelectContent, { children: [_jsx(Select_1.SelectItem, { value: "popular", children: "Most Popular" }), _jsx(Select_1.SelectItem, { value: "recent", children: "Recently Added" }), _jsx(Select_1.SelectItem, { value: "rating", children: "Highest Rated" }), _jsx(Select_1.SelectItem, { value: "price-low", children: "Price: Low to High" }), _jsx(Select_1.SelectItem, { value: "price-high", children: "Price: High to Low" })] })] }) })] }), _jsxs("div", { className: "flex flex-wrap gap-4", children: [_jsx("div", { className: "w-full sm:w-auto", children: _jsxs(Select_1.Select, { onValueChange: onCategoryChange, children: [_jsx(Select_1.SelectTrigger, { className: "w-full sm:w-48", children: _jsx(Select_1.SelectValue, { placeholder: "Category" }) }), _jsx(Select_1.SelectContent, { children: categories.map(function (category) { return (_jsx(Select_1.SelectItem, { value: category, children: category }, category)); }) })] }) }), _jsx("div", { className: "w-full sm:w-auto", children: _jsxs(Select_1.Select, { onValueChange: onTagChange, children: [_jsx(Select_1.SelectTrigger, { className: "w-full sm:w-48", children: _jsx(Select_1.SelectValue, { placeholder: "Tags" }) }), _jsx(Select_1.SelectContent, { children: tags.map(function (tag) { return (_jsx(Select_1.SelectItem, { value: tag, children: tag }, tag)); }) })] }) }), _jsx("div", { className: "w-full sm:w-auto", children: _jsxs(Select_1.Select, { onValueChange: function (value) {
                                var ranges = {
                                    'all': [0, Infinity],
                                    'free': [0, 0],
                                    'paid': [0.01, Infinity],
                                    'under-10': [0, 10],
                                    'under-50': [0, 50],
                                    'over-50': [50, Infinity],
                                };
                                onPriceRangeChange(ranges[value]);
                            }, children: [_jsx(Select_1.SelectTrigger, { className: "w-full sm:w-48", children: _jsx(Select_1.SelectValue, { placeholder: "Price Range" }) }), _jsxs(Select_1.SelectContent, { children: [_jsx(Select_1.SelectItem, { value: "all", children: "All Prices" }), _jsx(Select_1.SelectItem, { value: "free", children: "Free" }), _jsx(Select_1.SelectItem, { value: "paid", children: "Paid" }), _jsx(Select_1.SelectItem, { value: "under-10", children: "Under $10" }), _jsx(Select_1.SelectItem, { value: "under-50", children: "Under $50" }), _jsx(Select_1.SelectItem, { value: "over-50", children: "$50+" })] })] }) }), _jsx(Button_1.Button, { variant: "outline", className: "w-full sm:w-auto", icon: _jsx(lucide_react_1.SlidersHorizontal, { className: "h-4 w-4" }), children: "More Filters" })] })] }));
};
exports.FilterBar = FilterBar;
