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
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { resourcesService } from '../../services/resources.service';
import { FiStar, FiDownload, FiPlay, FiExternalLink, FiHeart, FiShare2, FiGitBranch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { BaseBrowser } from '../../components/browsers';
export default function WorkflowBrowser() {
    var _this = this;
    var _a = useState(null), selectedWorkflow = _a[0], setSelectedWorkflow = _a[1];
    var _b = useQuery({
        queryKey: ['workflows'],
        queryFn: function () { return resourcesService.getWorkflows(); },
    }), _c = _b.data, workflows = _c === void 0 ? [] : _c, isLoading = _b.isLoading;
    var filterFields = [
        {
            key: 'category',
            label: 'All Categories',
            options: [
                { value: 'productivity', label: 'Productivity' },
                { value: 'ai', label: 'AI' },
                { value: 'data', label: 'Data' },
                { value: 'automation', label: 'Automation' },
            ],
        },
        {
            key: 'complexity',
            label: 'All Complexity',
            options: [
                { value: 'simple', label: 'Simple' },
                { value: 'medium', label: 'Medium' },
                { value: 'complex', label: 'Complex' },
            ],
        },
    ];
    var sortOptions = [
        { value: 'popular', label: 'Most Popular' },
        { value: 'recent', label: 'Recently Updated' },
        { value: 'rating', label: 'Highest Rated' },
    ];
    var getComplexityColor = function (complexity) {
        switch (complexity) {
            case 'simple':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'complex':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    var handleItemAction = function (workflow, action) { return __awaiter(_this, void 0, void 0, function () {
        var _a, error_1, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = action;
                    switch (_a) {
                        case 'import': return [3 /*break*/, 1];
                        case 'favorite': return [3 /*break*/, 5];
                        case 'share': return [3 /*break*/, 9];
                        case 'view-details': return [3 /*break*/, 10];
                    }
                    return [3 /*break*/, 11];
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, resourcesService.importWorkflow(workflow.id)];
                case 2:
                    _b.sent();
                    toast.success("Workflow \"".concat(workflow.name, "\" imported to n8n successfully!"));
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _b.sent();
                    toast.error('Failed to import workflow');
                    return [3 /*break*/, 4];
                case 4: return [3 /*break*/, 11];
                case 5:
                    _b.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, resourcesService.toggleFavorite(workflow.id, 'current-user-id')];
                case 6:
                    _b.sent();
                    toast.success('Added to favorites!');
                    return [3 /*break*/, 8];
                case 7:
                    error_2 = _b.sent();
                    toast.error('Failed to add to favorites');
                    return [3 /*break*/, 8];
                case 8: return [3 /*break*/, 11];
                case 9:
                    toast.success('Share link copied to clipboard!');
                    navigator.clipboard.writeText("".concat(window.location.origin, "/resources/workflows/").concat(workflow.id));
                    return [3 /*break*/, 11];
                case 10:
                    setSelectedWorkflow(workflow);
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    }); };
    var renderCard = function (workflow, index, onAction) { return (_jsxs(Card, { className: "h-full hover:shadow-xl transition-shadow cursor-pointer group relative overflow-hidden", children: [workflow.featured && (_jsx("div", { className: "absolute top-0 right-0 bg-gradient-to-l from-yellow-400 to-yellow-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg", children: "Featured" })), _jsxs(CardHeader, { children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsx("div", { className: "text-3xl", children: "\uD83D\uDD04" }), _jsxs("div", { className: "flex items-center space-x-1 text-yellow-500", children: [_jsx(FiStar, { className: "fill-current" }), _jsx("span", { className: "text-sm font-medium", children: workflow.rating }), _jsxs("span", { className: "text-xs text-gray-500", children: ["(", workflow.reviews, ")"] })] })] }), _jsx(CardTitle, { className: "group-hover:text-green-600 transition-colors", children: workflow.name }), _jsx(CardDescription, { className: "line-clamp-2", children: workflow.description })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap gap-1", children: [workflow.tags.slice(0, 3).map(function (tag) { return (_jsx(Badge, { variant: "outline", className: "text-xs", children: tag }, tag)); }), workflow.tags.length > 3 && (_jsxs(Badge, { variant: "outline", className: "text-xs", children: ["+", workflow.tags.length - 3] }))] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "px-2 py-1 text-xs font-medium rounded-full border ".concat(getComplexityColor(workflow.complexity)), children: [workflow.complexity, " workflow"] }), _jsxs("div", { className: "flex items-center text-gray-600 text-sm", children: [_jsx(FiGitBranch, { className: "mr-1" }), workflow.nodes, " nodes"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500 mb-1 font-medium", children: "Integrations:" }), _jsxs("div", { className: "flex flex-wrap gap-1", children: [workflow.integrations.slice(0, 3).map(function (integration) { return (_jsx("span", { className: "text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded", children: integration }, integration)); }), workflow.integrations.length > 3 && (_jsxs("span", { className: "text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded", children: ["+", workflow.integrations.length - 3] }))] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [_jsxs("div", { className: "flex items-center text-gray-600", children: [_jsx(FiDownload, { className: "mr-1" }), workflow.downloads.toLocaleString(), " downloads"] }), _jsxs("div", { className: "flex items-center text-gray-600", children: [_jsx(FiPlay, { className: "mr-1" }), "v", workflow.version] })] }), _jsx("div", { className: "text-xs", children: _jsxs("p", { className: "text-gray-500 mb-1", children: [_jsx("span", { className: "font-medium", children: "Triggers:" }), " ", workflow.triggers.slice(0, 2).join(', '), workflow.triggers.length > 2 && " +".concat(workflow.triggers.length - 2)] }) })] }), _jsxs(CardFooter, { className: "flex flex-col space-y-2", children: [_jsx("button", { onClick: function () { return onAction(workflow, 'import'); }, className: "w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium", children: "Import to n8n" }), _jsxs("div", { className: "flex space-x-2 w-full", children: [_jsxs("button", { onClick: function () { return onAction(workflow, 'favorite'); }, className: "flex-1 flex items-center justify-center space-x-1 text-sm text-gray-600 hover:text-red-600 py-1 border border-gray-300 rounded-lg hover:border-red-600 transition-colors", children: [_jsx(FiHeart, {}), _jsx("span", { children: "Favorite" })] }), _jsxs("button", { onClick: function () { return onAction(workflow, 'share'); }, className: "flex-1 flex items-center justify-center space-x-1 text-sm text-gray-600 hover:text-green-600 py-1 border border-gray-300 rounded-lg hover:border-green-600 transition-colors", children: [_jsx(FiShare2, {}), _jsx("span", { children: "Share" })] }), _jsx("button", { onClick: function () { return onAction(workflow, 'view-details'); }, className: "flex items-center justify-center text-sm text-gray-600 hover:text-emerald-600 py-1 px-3 border border-gray-300 rounded-lg hover:border-emerald-600 transition-colors", children: _jsx(FiExternalLink, {}) })] })] })] })); };
    var renderModal = function (workflow, onClose) {
        if (!workflow)
            return null;
        return (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4", onClick: onClose, children: _jsx(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, className: "bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto", onClick: function (e) { return e.stopPropagation(); }, children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "text-4xl", children: "\uD83D\uDD04" }), _jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: workflow.name }), _jsxs("p", { className: "text-sm text-gray-600", children: ["by ", workflow.author] })] })] }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 text-2xl", children: "\u00D7" })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("p", { className: "text-gray-700 dark:text-gray-300", children: workflow.description }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Complexity" }), _jsx("span", { className: "inline-block px-3 py-1 text-sm font-medium rounded-full border ".concat(getComplexityColor(workflow.complexity)), children: workflow.complexity })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Nodes" }), _jsx("p", { className: "text-lg font-semibold", children: workflow.nodes })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold mb-2", children: "Triggers" }), _jsx("ul", { className: "list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300", children: workflow.triggers.map(function (trigger, i) { return (_jsx("li", { children: trigger }, i)); }) })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold mb-2", children: "Actions" }), _jsx("ul", { className: "list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300", children: workflow.actions.map(function (action, i) { return (_jsx("li", { children: action }, i)); }) })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold mb-2", children: "Integrations" }), _jsx("div", { className: "flex flex-wrap gap-2", children: workflow.integrations.map(function (integration) { return (_jsx("span", { className: "bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm", children: integration }, integration)); }) })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: function () {
                                                handleItemAction(workflow, 'import');
                                                onClose();
                                            }, className: "flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium", children: "Import to n8n" }), workflow.importUrl && (_jsxs("a", { href: workflow.importUrl, target: "_blank", rel: "noopener noreferrer", className: "flex items-center justify-center px-6 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors", children: [_jsx(FiExternalLink, { className: "mr-2" }), "View"] }))] })] })] }) }) }));
    };
    return (_jsx(BaseBrowser, { items: workflows, isLoading: isLoading, renderCard: renderCard, renderModal: renderModal, filterFields: filterFields, sortOptions: sortOptions, searchPlaceholder: "Search workflows by name, description, or tags...", emptyStateIcon: "\uD83D\uDD0D", emptyStateMessage: "No workflows found", onItemAction: handleItemAction }));
}
