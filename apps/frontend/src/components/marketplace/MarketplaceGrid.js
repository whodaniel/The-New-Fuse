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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceGrid = void 0;
import react_1 from 'react';
import MarketplaceCard_1 from './MarketplaceCard';
import FilterBar_1 from './FilterBar';
import useToast_1 from '@/hooks/useToast';
var MarketplaceGrid = function (_a) {
    var initialItems = _a.initialItems, categories = _a.categories, tags = _a.tags;
    var _b = (0, react_1.useState)(initialItems), items = _b[0], setItems = _b[1];
    var _c = (0, react_1.useState)(initialItems), filteredItems = _c[0], setFilteredItems = _c[1];
    var _d = (0, react_1.useState)(''), searchQuery = _d[0], setSearchQuery = _d[1];
    var _e = (0, react_1.useState)(''), selectedCategory = _e[0], setSelectedCategory = _e[1];
    var _f = (0, react_1.useState)(''), selectedTag = _f[0], setSelectedTag = _f[1];
    var _g = (0, react_1.useState)([0, Infinity]), priceRange = _g[0], setPriceRange = _g[1];
    var _h = (0, react_1.useState)('popular'), sortBy = _h[0], setSortBy = _h[1];
    var toast = (0, useToast_1.useToast)().toast;
    (0, react_1.useEffect)(function () {
        var result = __spreadArray([], items, true);
        if (searchQuery) {
            result = result.filter(function (item) { return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase()); });
        }
        if (selectedCategory) {
            result = result.filter(function (item) { return item.category === selectedCategory; });
        }
        if (selectedTag) {
            result = result.filter(function (item) { return item.tags.includes(selectedTag); });
        }
        result = result.filter(function (item) { return item.price >= priceRange[0] && item.price <= priceRange[1]; });
        result.sort(function (a, b) {
            switch (sortBy) {
                case 'popular':
                    return b.downloads - a.downloads;
                case 'recent':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'rating':
                    return b.rating - a.rating;
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                default:
                    return 0;
            }
        });
        setFilteredItems(result);
    }, [items, searchQuery, selectedCategory, selectedTag, priceRange, sortBy]);
    var handlePurchase = function (item) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                toast({
                    title: 'Success',
                    description: "Successfully purchased ".concat(item.name),
                    variant: 'success',
                });
            }
            catch (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to complete purchase',
                    variant: 'error',
                });
            }
            return [2 /*return*/];
        });
    }); };
    var handlePreview = function (item) {
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx(FilterBar_1.FilterBar, { categories: categories, tags: tags, onSearchChange: setSearchQuery, onCategoryChange: setSelectedCategory, onTagChange: setSelectedTag, onSortChange: setSortBy, onPriceRangeChange: setPriceRange }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredItems.map(function (item) { return (_jsx(MarketplaceCard_1.MarketplaceCard, { item: item, onPurchase: handlePurchase, onPreview: handlePreview }, item.id)); }) }), filteredItems.length === 0 && (_jsxs("div", { className: "text-center py-12", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-gray-100", children: "No items found" }), _jsx("p", { className: "mt-2 text-sm text-gray-500 dark:text-gray-400", children: "Try adjusting your search or filter criteria" })] }))] }));
};
exports.MarketplaceGrid = MarketplaceGrid;
