"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseWorkspace = void 0;
import jsx_runtime_1 from 'react/jsx-runtime';
import split_1 from '@/components/ui/split';
const BaseWorkspace = ({ header, sidebar, main, sidebarWidth = 'w-1/4', className = '' }) => {
    return ((0, jsx_runtime_1.jsxs)("div", { className: `workspace ${className}`, children: [header && (0, jsx_runtime_1.jsx)("div", { className: "workspace-header", children: header }), (0, jsx_runtime_1.jsxs)(split_1.Split, { children: [(0, jsx_runtime_1.jsx)("div", { className: `workspace-main flex-1`, children: main }), sidebar && (0, jsx_runtime_1.jsx)("div", { className: `workspace-sidebar ${sidebarWidth}`, children: sidebar })] })] }));
};
exports.BaseWorkspace = BaseWorkspace;
//# sourceMappingURL=BaseWorkspace.js.map