import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { NodeCategory } from './NodeCategory';
import { SearchBar } from './SearchBar';
import { useNodeCategories } from '../../../hooks/useNodeCategories';
export var NodeLibrary = function (_a) {
    var isPanelOpen = _a.isPanelOpen, onTogglePanel = _a.onTogglePanel;
    var _b = useNodeCategories(), categories = _b.categories, searchNodes = _b.searchNodes;
    var onDragStart = function (event, nodeType) {
        event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType));
        event.dataTransfer.effectAllowed = 'move';
    };
    return (_jsxs("div", { className: "node-library ".concat(isPanelOpen ? 'w-80' : 'w-12', " transition-width duration-300 bg-secondary border-r"), children: [_jsxs("div", { className: "flex items-center justify-between p-4", children: [_jsx("h3", { className: "font-semibold ".concat(!isPanelOpen && 'hidden'), children: "Node Library" }), _jsx("button", { onClick: onTogglePanel, className: "p-2 hover:bg-primary/10 rounded", children: isPanelOpen ? '←' : '→' })] }), isPanelOpen && (_jsxs(_Fragment, { children: [_jsx(SearchBar, { onSearch: searchNodes }), _jsx("div", { className: "overflow-y-auto h-[calc(100vh-120px)]", children: categories.map(function (category) { return (_jsx(NodeCategory, { category: category, onDragStart: onDragStart }, category.id)); }) })] }))] }));
};
