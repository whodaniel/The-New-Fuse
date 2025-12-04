import { jsx as _jsx } from "react/jsx-runtime";
import { motion, AnimatePresence } from 'framer-motion';
export function AnimatedGrid(_a) {
    var items = _a.items, renderItem = _a.renderItem, getItemKey = _a.getItemKey, _b = _a.columns, columns = _b === void 0 ? { default: 1, md: 2, lg: 3 } : _b;
    var gridClasses = [
        'grid',
        "grid-cols-".concat(columns.default || 1),
        columns.md && "md:grid-cols-".concat(columns.md),
        columns.lg && "lg:grid-cols-".concat(columns.lg),
        'gap-6',
    ]
        .filter(Boolean)
        .join(' ');
    return (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: _jsx(AnimatePresence, { mode: "popLayout", children: items.map(function (item, index) { return (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, scale: 0.9 }, transition: { delay: index * 0.05, duration: 0.3 }, layout: true, children: renderItem(item, index) }, getItemKey(item))); }) }) }));
}
