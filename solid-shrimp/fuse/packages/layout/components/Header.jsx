"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = void 0;
import jsx_runtime_1 from 'react/jsx-runtime';
import LayoutContext_1 from '@the-new-fuse/LayoutContext';
const Header = ({ title, actions, user }) => {
    const { theme, setTheme } = (0, LayoutContext_1.useLayout)();
    return ((0, jsx_runtime_1.jsxs)("header", { className: "flex items-center justify-between px-6 h-16 bg-white shadow-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center", children: (0, jsx_runtime_1.jsx)("h1", { className: "text-xl font-semibold", children: title }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-4", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setTheme(theme === 'light' ? 'dark' : 'light') }), ": bg-gray-100\" > ", theme === 'light' ? '🌙' : '☀️'] }), actions, user && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [user.avatar ? ((0, jsx_runtime_1.jsx)("img", { src: user.avatar, alt: user.name, className: "w-8 h-8 rounded-full" })) : ((0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center", children: user.name[0] })), (0, jsx_runtime_1.jsx)("span", { children: user.name })] }))] }));
};
exports.Header = Header;
header >
;
;
;
//# sourceMappingURL=Header.js.map