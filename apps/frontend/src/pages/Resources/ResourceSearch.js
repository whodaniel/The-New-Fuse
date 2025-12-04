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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { resourcesService } from '../../services/resources.service';
import { FiSearch, FiStar, FiDownload, FiHeart, FiShare2, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';
export default function ResourceSearch() {
    var _this = this;
    var _a = useState(''), searchTerm = _a[0], setSearchTerm = _a[1];
    var _b = useState('all'), typeFilter = _b[0], setTypeFilter = _b[1];
    var _c = useState('all'), categoryFilter = _c[0], setCategoryFilter = _c[1];
    var _d = useState(false), featuredOnly = _d[0], setFeaturedOnly = _d[1];
    var _e = useState('popular'), sortBy = _e[0], setSortBy = _e[1];
    var _f = useState('grid'), viewMode = _f[0], setViewMode = _f[1];
    // Fetch all resources
    var _g = useQuery({
        queryKey: ['all-resources'],
        queryFn: function () { return resourcesService.getAllResources(); },
    }), _h = _g.data, allResources = _h === void 0 ? [] : _h, isLoading = _g.isLoading;
    // Filter and sort resources
    var filteredResources = useMemo(function () {
        return allResources
            .filter(function (resource) {
            var matchesSearch = searchTerm === '' ||
                resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                resource.tags.some(function (tag) { return tag.toLowerCase().includes(searchTerm.toLowerCase()); }) ||
                resource.author.toLowerCase().includes(searchTerm.toLowerCase());
            var matchesType = typeFilter === 'all' || resource.type === typeFilter;
            var matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter;
            var matchesFeatured = !featuredOnly || resource.featured;
            return matchesSearch && matchesType && matchesCategory && matchesFeatured;
        })
            .sort(function (a, b) {
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
    }, [allResources, searchTerm, typeFilter, categoryFilter, featuredOnly, sortBy]);
    // Get unique tags from all resources
    var allTags = useMemo(function () {
        var tags = new Set();
        allResources.forEach(function (resource) {
            resource.tags.forEach(function (tag) { return tags.add(tag); });
        });
        return Array.from(tags).sort();
    }, [allResources]);
    var getResourceIcon = function (type) {
        switch (type) {
            case 'skill': return '⚡';
            case 'workflow': return '🔄';
            case 'template': return '🤖';
            case 'tool': return '🔧';
            case 'integration': return '🔌';
            default: return '📦';
        }
    };
    var getResourceColor = function (type) {
        switch (type) {
            case 'skill':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'workflow':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'template':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'tool':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'integration':
                return 'bg-pink-100 text-pink-800 border-pink-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    var handleAction = function (resource) {
        switch (resource.type) {
            case 'skill':
                toast.success("Installing skill: ".concat(resource.name));
                break;
            case 'workflow':
                toast.success("Importing workflow: ".concat(resource.name));
                break;
            case 'template':
                toast.success("Creating agent from template: ".concat(resource.name));
                break;
            default:
                toast.success("Using resource: ".concat(resource.name));
        }
    };
    var handleFavorite = function (resource) { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, resourcesService.toggleFavorite(resource.id, 'current-user-id')];
                case 1:
                    _a.sent();
                    toast.success('Added to favorites!');
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    toast.error('Failed to add to favorites');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleShare = function (resource) {
        toast.success('Share link copied to clipboard!');
        navigator.clipboard.writeText("".concat(window.location.origin, "/resources/").concat(resource.type, "s/").concat(resource.id));
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx(FiSearch, { className: "text-2xl text-blue-600 mr-3" }), _jsx("h3", { className: "text-lg font-semibold", children: "Search All Resources" })] }), _jsxs("div", { className: "relative mb-4", children: [_jsx(FiSearch, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" }), _jsx(Input, { type: "text", placeholder: "Search across all resources by name, description, tags, or author...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, className: "pl-10 h-12 text-base" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-3", children: [_jsxs("select", { value: typeFilter, onChange: function (e) { return setTypeFilter(e.target.value); }, className: "px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "all", children: "All Types" }), _jsx("option", { value: "skill", children: "Skills" }), _jsx("option", { value: "workflow", children: "Workflows" }), _jsx("option", { value: "template", children: "Templates" }), _jsx("option", { value: "tool", children: "Tools" }), _jsx("option", { value: "integration", children: "Integrations" })] }), _jsxs("select", { value: categoryFilter, onChange: function (e) { return setCategoryFilter(e.target.value); }, className: "px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "all", children: "All Categories" }), _jsx("option", { value: "development", children: "Development" }), _jsx("option", { value: "productivity", children: "Productivity" }), _jsx("option", { value: "communication", children: "Communication" }), _jsx("option", { value: "data", children: "Data" }), _jsx("option", { value: "automation", children: "Automation" }), _jsx("option", { value: "ai", children: "AI" }), _jsx("option", { value: "other", children: "Other" })] }), _jsxs("select", { value: sortBy, onChange: function (e) { return setSortBy(e.target.value); }, className: "px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "popular", children: "Most Popular" }), _jsx("option", { value: "recent", children: "Recently Updated" }), _jsx("option", { value: "rating", children: "Highest Rated" }), _jsx("option", { value: "name", children: "Name (A-Z)" })] }), _jsx("div", { className: "flex items-center space-x-4", children: _jsxs("label", { className: "flex items-center space-x-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: featuredOnly, onChange: function (e) { return setFeaturedOnly(e.target.checked); }, className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsx("span", { className: "text-sm font-medium", children: "Featured Only" })] }) })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "text-sm text-gray-600 dark:text-gray-400", children: ["Found ", _jsx("span", { className: "font-semibold text-gray-900 dark:text-gray-100", children: filteredResources.length }), " resources"] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-sm text-gray-600", children: "View:" }), _jsx("button", { onClick: function () { return setViewMode('grid'); }, className: "px-3 py-1 rounded-lg text-sm transition-colors ".concat(viewMode === 'grid'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'), children: "Grid" }), _jsx("button", { onClick: function () { return setViewMode('list'); }, className: "px-3 py-1 rounded-lg text-sm transition-colors ".concat(viewMode === 'list'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'), children: "List" })] })] }), viewMode === 'grid' ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: _jsx(AnimatePresence, { mode: "popLayout", children: filteredResources.map(function (resource, index) { return (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, scale: 0.9 }, transition: { delay: index * 0.03, duration: 0.3 }, layout: true, children: _jsxs(Card, { className: "h-full hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden", children: [resource.featured && (_jsx("div", { className: "absolute top-0 right-0 bg-gradient-to-l from-yellow-400 to-yellow-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg z-10", children: "Featured" })), _jsxs(CardHeader, { children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "text-3xl", children: getResourceIcon(resource.type) }), _jsx("span", { className: "px-2 py-1 text-xs font-medium rounded-full border ".concat(getResourceColor(resource.type)), children: resource.type })] }), _jsxs("div", { className: "flex items-center space-x-1 text-yellow-500", children: [_jsx(FiStar, { className: "fill-current" }), _jsx("span", { className: "text-sm font-medium", children: resource.rating })] })] }), _jsx(CardTitle, { className: "group-hover:text-blue-600 transition-colors line-clamp-1", children: resource.name }), _jsx(CardDescription, { className: "line-clamp-2", children: resource.description })] }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "flex flex-wrap gap-1", children: [resource.tags.slice(0, 3).map(function (tag) { return (_jsx(Badge, { variant: "outline", className: "text-xs", children: tag }, tag)); }), resource.tags.length > 3 && (_jsxs(Badge, { variant: "outline", className: "text-xs", children: ["+", resource.tags.length - 3] }))] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs text-gray-600", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(FiDownload, { className: "mr-1" }), resource.downloads.toLocaleString()] }), _jsxs("div", { className: "flex items-center", children: [_jsx(FiPackage, { className: "mr-1" }), "v", resource.version] })] }), _jsxs("div", { className: "text-xs text-gray-500", children: ["by ", _jsx("span", { className: "font-medium text-gray-700", children: resource.author })] })] }), _jsxs(CardFooter, { className: "flex flex-col space-y-2", children: [_jsxs("button", { onClick: function () { return handleAction(resource); }, className: "w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium", children: [resource.type === 'skill' && 'Install', resource.type === 'workflow' && 'Import', resource.type === 'template' && 'Use Template', !['skill', 'workflow', 'template'].includes(resource.type) && 'View Details'] }), _jsxs("div", { className: "flex space-x-2 w-full", children: [_jsx("button", { onClick: function () { return handleFavorite(resource); }, className: "flex-1 flex items-center justify-center space-x-1 text-sm text-gray-600 hover:text-red-600 py-1 border border-gray-300 rounded-lg hover:border-red-600 transition-colors", children: _jsx(FiHeart, {}) }), _jsx("button", { onClick: function () { return handleShare(resource); }, className: "flex-1 flex items-center justify-center space-x-1 text-sm text-gray-600 hover:text-blue-600 py-1 border border-gray-300 rounded-lg hover:border-blue-600 transition-colors", children: _jsx(FiShare2, {}) })] })] })] }) }, resource.id)); }) }) })) : (
            /* List View */
            _jsx("div", { className: "space-y-3", children: _jsx(AnimatePresence, { mode: "popLayout", children: filteredResources.map(function (resource, index) { return (_jsx(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 20 }, transition: { delay: index * 0.02, duration: 0.2 }, layout: true, children: _jsx(Card, { className: "hover:shadow-lg transition-shadow", children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4 flex-1", children: [_jsx("div", { className: "text-3xl", children: getResourceIcon(resource.type) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-1", children: [_jsx("h3", { className: "font-semibold text-lg", children: resource.name }), resource.featured && (_jsx(Badge, { className: "bg-yellow-100 text-yellow-800 border-yellow-200", children: "Featured" })), _jsx("span", { className: "px-2 py-0.5 text-xs font-medium rounded-full border ".concat(getResourceColor(resource.type)), children: resource.type })] }), _jsx("p", { className: "text-sm text-gray-600 mb-2", children: resource.description }), _jsxs("div", { className: "flex items-center space-x-4 text-xs text-gray-500", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(FiStar, { className: "mr-1 text-yellow-500 fill-current" }), resource.rating, " (", resource.reviews, " reviews)"] }), _jsxs("div", { className: "flex items-center", children: [_jsx(FiDownload, { className: "mr-1" }), resource.downloads.toLocaleString(), " downloads"] }), _jsxs("span", { children: ["by ", resource.author] }), _jsxs("span", { children: ["v", resource.version] })] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("button", { onClick: function () { return handleAction(resource); }, className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap", children: [resource.type === 'skill' && 'Install', resource.type === 'workflow' && 'Import', resource.type === 'template' && 'Use', !['skill', 'workflow', 'template'].includes(resource.type) && 'View'] }), _jsx("button", { onClick: function () { return handleFavorite(resource); }, className: "p-2 text-gray-600 hover:text-red-600 border border-gray-300 rounded-lg hover:border-red-600 transition-colors", children: _jsx(FiHeart, {}) }), _jsx("button", { onClick: function () { return handleShare(resource); }, className: "p-2 text-gray-600 hover:text-blue-600 border border-gray-300 rounded-lg hover:border-blue-600 transition-colors", children: _jsx(FiShare2, {}) })] })] }) }) }) }, resource.id)); }) }) })), filteredResources.length === 0 && (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "text-center py-20", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83D\uDD0D" }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2", children: "No resources found" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-4", children: "Try adjusting your search or filter criteria" }), _jsx("button", { onClick: function () {
                            setSearchTerm('');
                            setTypeFilter('all');
                            setCategoryFilter('all');
                            setFeaturedOnly(false);
                        }, className: "bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors", children: "Clear Filters" })] }))] }));
}
