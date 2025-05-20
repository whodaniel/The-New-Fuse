"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceFilters = void 0;
var react_1 = require("react");
var Input_1 = require("@/shared/ui/core/Input");
var MarketplaceContext_1 = require("./MarketplaceContext");
var itemTypes = ['agent', 'workflow', 'template'];
var sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'recent', label: 'Most Recent' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'price', label: 'Price' },
];
var MarketplaceFilters = function () {
    var _a, _b;
    var _c = (0, MarketplaceContext_1.useMarketplace)(), state = _c.state, setFilter = _c.setFilter;
    var filter = state.filter;
    var handleSearchChange = function (e) {
        setFilter({ search: e.target.value });
    };
    var handleTypeChange = function (e) {
        var value = e.target.value;
        setFilter({ type: value || undefined });
    };
    var handleSortChange = function (e) {
        var _a = e.target.value.split('-'), sortBy = _a[0], sortOrder = _a[1];
        setFilter({ sortBy: sortBy, sortOrder: sortOrder });
    };
    var handlePriceRangeChange = function (e, index) {
        var value = parseFloat(e.target.value);
        var currentRange = filter.priceRange || [0, Infinity];
        setFilter({
            priceRange: [
                index === 0 ? value : currentRange[0],
                index === 1 ? value : currentRange[1],
            ],
        });
    };
    var handleRatingChange = function (e) {
        var value = parseInt(e.target.value, 10);
        setFilter({ rating: value || undefined });
    };
    return className = "space-y-6 p-4 bg-white rounded-lg shadow-sm" >
        { /* Search */}
        < div >
        placeholder;
    "Search marketplace...";
    value = { filter, : .search || '' };
    onChange = { handleSearchChange };
    startIcon = {} < svg;
    className = "w-5 h-5 text-gray-400";
    fill = "none";
    stroke = "currentColor";
    viewBox = "0 0 24 24" >
        strokeLinecap;
    "round";
    strokeLinejoin = "round";
    strokeWidth = { 2:  };
    d = "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /  >
        /svg>}/ >
        /div>;
    { /* Type Filter */ }
    className;
    "block text-sm font-medium text-gray-700 mb-1" >
        Type
        < /label>
        < select;
    value = { filter, : .type || '' };
    onChange = { handleTypeChange };
    className = "w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" >
        value;
    "" > All;
    Types < /option>;
    {
        itemTypes.map(function (type) {
            return key = { type };
            value = { type } >
                { type, : .charAt(0).toUpperCase() + type.slice(1) };
            s
                < /option>;
        });
    }
}
    < /select>
    < /div>;
{ /* Price Range */ }
className;
"block text-sm font-medium text-gray-700 mb-1" >
    Price;
Range
    < /label>
    < div;
className = "flex items-center space-x-2" >
    type;
"number";
placeholder = "Min";
value = {}((_a = filter.priceRange) === null || _a === void 0 ? void 0 : _a[0]) || '';
onChange = { function(e) { return handlePriceRangeChange(e, 0); } };
min = { 0:  } /  >
    className;
"text-gray-500" > -/span>
    < Input_1.Input;
type = "number";
placeholder = "Max";
value = {}((_b = filter.priceRange) === null || _b === void 0 ? void 0 : _b[1]) || '';
onChange = { function(e) { return handlePriceRangeChange(e, 1); } };
min = { 0:  } /  >
    /div>
    < /div>;
{ /* Rating Filter */ }
className;
"block text-sm font-medium text-gray-700 mb-1" >
    Minimum;
Rating
    < /label>
    < select;
value = { filter, : .rating || '' };
onChange = { handleRatingChange };
className = "w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" >
    value;
"" > Any;
Rating < /option>;
{
    [4, 3, 2, 1].map(function (rating) {
        return key = { rating };
        value = { rating } >
            { rating } + Stars
            < /option>;
    });
}
/select>
    < /div>;
{ /* Sort Options */ }
className;
"block text-sm font-medium text-gray-700 mb-1" >
    Sort;
By
    < /label>
    < select;
value = { "": .concat(filter.sortBy || 'popular', "-").concat(filter.sortOrder || 'desc') };
onChange = { handleSortChange };
className = "w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" >
    { sortOptions, : .map(function (option) {
            return key = { option, : .value } >
                value;
            {
                "".concat(option.value, "-desc");
            }
             >
                { option, : .label }(High, to, Low)
                < /option>
                < option;
            value = { "": .concat(option.value, "-asc") } >
                { option, : .label }(Low, to, High)
                < /option>
                < /react_1.default.Fragment>;
        }) };
/select>
    < /div>
    < /div>;
;
;
exports.MarketplaceFilters = MarketplaceFilters;
//# sourceMappingURL=MarketplaceFilters.js.map