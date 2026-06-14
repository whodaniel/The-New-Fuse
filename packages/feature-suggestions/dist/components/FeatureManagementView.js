"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const KanbanBoard_1 = __importDefault(require("./KanbanBoard"));
const FeatureSuggestionList_1 = require("./FeatureSuggestionList");
const useKanbanBoard_1 = require("../hooks/useKanbanBoard");
const useFeatureSuggestions_1 = require("../hooks/useFeatureSuggestions");
const types_1 = require("../types");
const FeatureManagementView = ({ suggestionService, currentUserId, }) => {
    const [viewMode, setViewMode] = (0, react_1.useState)('list');
    const [showNewSuggestionForm, setShowNewSuggestionForm] = (0, react_1.useState)(false);
    const [newSuggestion, setNewSuggestion] = (0, react_1.useState)({
        title: "",
        description: "",
        priority: types_1.SuggestionPriority.MEDIUM,
        tags: [],
    });
    // Get data from useKanbanBoard
    const { columns, loading, error, moveItem, refresh } = (0, useKanbanBoard_1.useKanbanBoard)({
        suggestionService,
    });
    // Use useFeatureSuggestions to get the remaining needed functions and data
    const { suggestions, submitSuggestion, updateSuggestionStatus, convertSuggestionToFeature } = (0, useFeatureSuggestions_1.useFeatureSuggestions)({ suggestionService });
    // Define handleDragEnd manually since it's not returned from useKanbanBoard
    const handleDragEnd = (item, sourceColumnId, targetColumnId) => {
        moveItem(item.id, sourceColumnId, targetColumnId);
    };
    const handleSubmitNewSuggestion = async (e) => {
        e.preventDefault();
        try {
            await submitSuggestion(newSuggestion.title, newSuggestion.description, currentUserId, newSuggestion.priority, newSuggestion.tags);
            setShowNewSuggestionForm(false);
            setNewSuggestion({
                title: "",
                description: "",
                priority: types_1.SuggestionPriority.MEDIUM,
                tags: [],
            });
        }
        catch (error) {
            console.error('Failed to submit suggestion:', error);
        }
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center h-64", children: (0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" }) }));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "text-red-500 p-4", children: ["Error: ", error.message] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "p-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex space-x-4", children: [(0, jsx_runtime_1.jsx)("button", { className: `px-4 py-2 rounded-lg ${viewMode === 'list'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-700'}`, onClick: () => setViewMode('list'), children: "List View" }), (0, jsx_runtime_1.jsx)("button", { className: `px-4 py-2 rounded-lg ${viewMode === 'kanban'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-700'}`, onClick: () => setViewMode('kanban'), children: "Kanban View" })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowNewSuggestionForm(true), className: "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600", children: "New Suggestion" })] }), showNewSuggestionForm && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg p-6 max-w-lg w-full", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold mb-4", children: "New Feature Suggestion" }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmitNewSuggestion, children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700", children: "Title" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: newSuggestion.title, onChange: (e) => setNewSuggestion((prev) => ({
                                                        ...prev,
                                                        title: e.target.value,
                                                    })), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", placeholder: "Enter feature title", title: "Feature title", required: true })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700", children: "Description" }), (0, jsx_runtime_1.jsx)("textarea", { value: newSuggestion.description, onChange: (e) => setNewSuggestion((prev) => ({
                                                        ...prev,
                                                        description: e.target.value,
                                                    })), rows: 4, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", placeholder: "Enter feature description", title: "Feature description", required: true })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700", children: "Priority" }), (0, jsx_runtime_1.jsx)("select", { value: newSuggestion.priority, onChange: (e) => setNewSuggestion((prev) => ({
                                                        ...prev,
                                                        priority: e.target.value,
                                                    })), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", title: "Priority level", children: Object.values(types_1.SuggestionPriority).map((priority) => ((0, jsx_runtime_1.jsx)("option", { value: priority, children: priority }, priority))) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700", children: "Tags (comma-separated)" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: newSuggestion.tags.join(', '), onChange: (e) => setNewSuggestion((prev) => ({
                                                        ...prev,
                                                        tags: e.target.value.split(',').map((t) => t.trim()),
                                                    })), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", placeholder: "Enter tags separated by commas", title: "Feature tags" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 flex justify-end space-x-3", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowNewSuggestionForm(false), className: "px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50", children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600", children: "Submit" })] })] })] }) })), viewMode === 'kanban' ? ((0, jsx_runtime_1.jsx)(KanbanBoard_1.default, { columns: columns, onDragEnd: handleDragEnd })) : ((0, jsx_runtime_1.jsx)(FeatureSuggestionList_1.FeatureSuggestionList, { suggestionService: suggestionService, suggestions: suggestions, onUpdateStatus: updateSuggestionStatus, onConvertToFeature: (suggestionId) => {
                    // This wrapper function converts the return type to void
                    convertSuggestionToFeature(suggestionId).then(() => { });
                    return Promise.resolve();
                }, onRefresh: refresh }))] }));
};
exports.default = FeatureManagementView;
//# sourceMappingURL=FeatureManagementView.js.map