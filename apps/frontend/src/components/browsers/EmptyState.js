import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
export function EmptyState(_a) {
    var icon = _a.icon, title = _a.title, message = _a.message, action = _a.action;
    return (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "text-center py-20", children: [_jsx("div", { className: "text-6xl mb-4", children: icon }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2", children: title }), message && (_jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-4", children: message })), action && (_jsx("button", { onClick: action.onClick, className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: action.label }))] }));
}
