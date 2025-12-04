import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export var SearchBar = function (_a) {
    var onSearch = _a.onSearch, _b = _a.placeholder, placeholder = _b === void 0 ? "Search nodes..." : _b;
    var _c = useState(''), searchTerm = _c[0], setSearchTerm = _c[1];
    var handleInputChange = function (e) {
        var value = e.target.value;
        setSearchTerm(value);
        onSearch(value);
    };
    var handleClear = function () {
        setSearchTerm('');
        onSearch('');
    };
    return (_jsx("div", { className: "relative px-4 pb-2", children: _jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", value: searchTerm, onChange: handleInputChange, placeholder: placeholder, className: "w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" }), _jsx("div", { className: "absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none", children: _jsx("svg", { className: "w-4 h-4 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) }), searchTerm && (_jsx("button", { onClick: handleClear, className: "absolute inset-y-0 right-6 flex items-center pr-1 text-gray-400 hover:text-gray-600", children: _jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) }))] }) }));
};
