var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useMemo } from 'react';
// Filter matching function
function matchesSearch(item, searchTerm, searchFields) {
    if (!searchTerm)
        return true;
    var lowerSearch = searchTerm.toLowerCase();
    return searchFields.some(function (field) {
        var value = item[field];
        if (typeof value === 'string') {
            return value.toLowerCase().includes(lowerSearch);
        }
        if (Array.isArray(value)) {
            return value.some(function (v) {
                return typeof v === 'string' && v.toLowerCase().includes(lowerSearch);
            });
        }
        return false;
    });
}
function matchesFilters(item, filters) {
    return Object.entries(filters).every(function (_a) {
        var key = _a[0], value = _a[1];
        if (value === 'all')
            return true;
        var itemValue = item[key];
        return itemValue === value;
    });
}
function sortItems(items, sortBy) {
    return __spreadArray([], items, true).sort(function (a, b) {
        switch (sortBy) {
            case 'popular':
                return b.downloads - a.downloads;
            case 'recent':
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            case 'rating':
                return b.rating - a.rating;
            case 'name':
                return a.name.localeCompare(b.name);
            default:
                return 0;
        }
    });
}
export function BaseBrowser(_a) {
    var _this = this;
    var items = _a.items, isLoading = _a.isLoading, renderCard = _a.renderCard, renderModal = _a.renderModal, filterFields = _a.filterFields, sortOptions = _a.sortOptions, searchPlaceholder = _a.searchPlaceholder, emptyStateIcon = _a.emptyStateIcon, emptyStateMessage = _a.emptyStateMessage, _b = _a.searchFields, searchFields = _b === void 0 ? ['name', 'description', 'tags'] : _b, onItemAction = _a.onItemAction, _c = _a.defaultSort, defaultSort = _c === void 0 ? 'popular' : _c;
    var _d = useState(''), searchTerm = _d[0], setSearchTerm = _d[1];
    var _e = useState(function () {
        var initial = {};
        filterFields.forEach(function (field) {
            initial[field.key] = 'all';
        });
        return initial;
    }), filters = _e[0], setFilters = _e[1];
    var _f = useState(defaultSort), sortBy = _f[0], setSortBy = _f[1];
    var _g = useState(null), selectedItem = _g[0], setSelectedItem = _g[1];
    // Filter and sort items
    var filteredItems = useMemo(function () {
        var result = items.filter(function (item) {
            return matchesSearch(item, searchTerm, searchFields) &&
                matchesFilters(item, filters);
        });
        return sortItems(result, sortBy);
    }, [items, searchTerm, filters, sortBy, searchFields]);
    var handleFilterChange = function (key, value) {
        setFilters(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = value, _a)));
        });
    };
    var handleAction = function (item, action) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(action === 'view-details')) return [3 /*break*/, 1];
                    setSelectedItem(item);
                    return [3 /*break*/, 3];
                case 1:
                    if (!onItemAction) return [3 /*break*/, 3];
                    return [4 /*yield*/, onItemAction(item, action)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col lg:flex-row gap-4", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx("svg", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }), _jsx("input", { type: "text", placeholder: searchPlaceholder, value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), filterFields.map(function (field) { return (_jsxs("select", { value: filters[field.key], onChange: function (e) { return handleFilterChange(field.key, e.target.value); }, className: "px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "all", children: field.label }), field.options.map(function (option) { return (_jsx("option", { value: option.value, children: option.label }, option.value)); })] }, field.key)); }), _jsx("select", { value: sortBy, onChange: function (e) { return setSortBy(e.target.value); }, className: "px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: sortOptions.map(function (option) { return (_jsx("option", { value: option.value, children: option.label }, option.value)); }) })] }), _jsxs("div", { className: "text-sm text-gray-600 dark:text-gray-400", children: ["Showing ", filteredItems.length, " ", filteredItems.length === 1 ? 'result' : 'results'] }), filteredItems.length > 0 ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredItems.map(function (item, index) { return (_jsx(React.Fragment, { children: renderCard(item, index, handleAction) }, item.id)); }) })) : (_jsxs("div", { className: "text-center py-20", children: [_jsx("div", { className: "text-6xl mb-4", children: emptyStateIcon }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2", children: emptyStateMessage }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Try adjusting your search or filter criteria" })] })), renderModal && selectedItem && renderModal(selectedItem, function () { return setSelectedItem(null); })] }));
}
