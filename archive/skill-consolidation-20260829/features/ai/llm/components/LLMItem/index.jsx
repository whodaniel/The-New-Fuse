"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LLMItem;
import jsx_runtime_1 from 'react/jsx-runtime';
function LLMItem({ name, value, image, description, checked, onClick, }) {
    return ((0, jsx_runtime_1.jsxs)("div", { onClick: () => onClick(value), className: `w-full p-2 rounded-md hover:cursor-pointer hover:bg-theme-bg-secondary ${checked ? "bg-theme-bg-secondary" : ""}`, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", value: value, className: "peer hidden", checked: checked, readOnly: true, formNoValidate: true }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-x-4 items-center", children: [(0, jsx_runtime_1.jsx)("img", { src: image, alt: `${name} logo`, className: "w-10 h-10 rounded-md" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-sm font-semibold text-white", children: name }), (0, jsx_runtime_1.jsx)("div", { className: "mt-1 text-xs text-description", children: description })] })] })] }));
}
//# sourceMappingURL=index.js.map