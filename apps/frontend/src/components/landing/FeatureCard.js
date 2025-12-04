import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
var accentColors = {
    blue: {
        bg: 'from-blue-500/10 to-blue-600/10',
        icon: 'text-blue-600 dark:text-blue-400',
        hover: 'group-hover:shadow-blue-500/20',
        border: 'border-blue-500/20',
    },
    purple: {
        bg: 'from-purple-500/10 to-purple-600/10',
        icon: 'text-purple-600 dark:text-purple-400',
        hover: 'group-hover:shadow-purple-500/20',
        border: 'border-purple-500/20',
    },
    green: {
        bg: 'from-green-500/10 to-green-600/10',
        icon: 'text-green-600 dark:text-green-400',
        hover: 'group-hover:shadow-green-500/20',
        border: 'border-green-500/20',
    },
    orange: {
        bg: 'from-orange-500/10 to-orange-600/10',
        icon: 'text-orange-600 dark:text-orange-400',
        hover: 'group-hover:shadow-orange-500/20',
        border: 'border-orange-500/20',
    },
    pink: {
        bg: 'from-pink-500/10 to-pink-600/10',
        icon: 'text-pink-600 dark:text-pink-400',
        hover: 'group-hover:shadow-pink-500/20',
        border: 'border-pink-500/20',
    },
};
export var FeatureCard = function (_a) {
    var Icon = _a.icon, title = _a.title, description = _a.description, imageSrc = _a.imageSrc, imageAlt = _a.imageAlt, _b = _a.accent, accent = _b === void 0 ? 'blue' : _b, _c = _a.delay, delay = _c === void 0 ? 0 : _c;
    var colors = accentColors[accent];
    return (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-50px' }, transition: { duration: 0.5, delay: delay }, className: "group h-full", children: _jsxs("div", { className: "\n          relative h-full overflow-hidden rounded-2xl border ".concat(colors.border, "\n          bg-white dark:bg-gray-900\n          shadow-lg ").concat(colors.hover, "\n          transition-all duration-300\n          hover:scale-[1.02] hover:shadow-2xl\n        "), children: [_jsx("div", { className: "\n            absolute inset-0 bg-gradient-to-br ".concat(colors.bg, "\n            opacity-0 transition-opacity duration-300\n            group-hover:opacity-100\n          ") }), _jsxs("div", { className: "relative p-6 sm:p-8", children: [_jsx(motion.div, { whileHover: { rotate: [0, -10, 10, -10, 0], scale: 1.1 }, transition: { duration: 0.5 }, className: "\n              inline-flex items-center justify-center\n              w-14 h-14 sm:w-16 sm:h-16\n              rounded-xl bg-gradient-to-br ".concat(colors.bg, "\n              mb-4 sm:mb-6\n            "), children: _jsx(Icon, { className: "w-7 h-7 sm:w-8 sm:h-8 ".concat(colors.icon) }) }), _jsx("h3", { className: "text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3", children: title }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mb-6 leading-relaxed", children: description }), imageSrc && (_jsxs(motion.div, { whileHover: { scale: 1.05 }, transition: { duration: 0.3 }, className: "relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700", children: [_jsx("img", { src: imageSrc, alt: imageAlt || title, className: "w-full h-auto object-cover" }), _jsx("div", { className: "absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" })] }))] }), _jsx(motion.div, { className: "absolute bottom-0 left-0 h-1 bg-gradient-to-r ".concat(colors.bg.replace('/10', '')), initial: { width: 0 }, whileInView: { width: '100%' }, viewport: { once: true }, transition: { duration: 0.8, delay: delay + 0.2 } })] }) }));
};
export default FeatureCard;
