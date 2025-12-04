import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
var columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};
export var FeaturesSection = function (_a) {
    var title = _a.title, subtitle = _a.subtitle, children = _a.children, _b = _a.columns, columns = _b === void 0 ? 3 : _b, id = _a.id;
    return (_jsx("section", { id: id, className: "py-16 sm:py-20 lg:py-24", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 }, className: "text-center mb-12 sm:mb-16", children: [_jsx("h2", { className: "text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4", children: title }), subtitle && (_jsx("p", { className: "text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto", children: subtitle }))] }), _jsx("div", { className: "grid ".concat(columnClasses[columns], " gap-6 lg:gap-8"), children: children })] }) }));
};
export default FeaturesSection;
