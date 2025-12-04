import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
var StatItem = function (_a) {
    var value = _a.value, label = _a.label, _b = _a.suffix, suffix = _b === void 0 ? '' : _b, _c = _a.delay, delay = _c === void 0 ? 0 : _c;
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: delay }, className: "text-center", children: [_jsxs(motion.div, { initial: { scale: 0.5 }, whileInView: { scale: 1 }, viewport: { once: true }, transition: { duration: 0.5, delay: delay + 0.2, type: 'spring' }, className: "text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2", children: [value, suffix && _jsx("span", { className: "text-2xl sm:text-3xl lg:text-4xl", children: suffix })] }), _jsx("div", { className: "text-sm sm:text-base text-gray-600 dark:text-gray-300", children: label })] }));
};
export var HeroStats = function () {
    return (_jsx("div", { className: "bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800", children: _jsx("div", { className: "max-w-7xl mx-auto py-12 sm:py-16 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "grid grid-cols-2 gap-8 md:grid-cols-4", children: [_jsx(StatItem, { value: "99.9", suffix: "%", label: "Uptime Guarantee", delay: 0 }), _jsx(StatItem, { value: "<100", suffix: "ms", label: "Average Response Time", delay: 0.1 }), _jsx(StatItem, { value: "50", suffix: "+", label: "AI Models Supported", delay: 0.2 }), _jsx(StatItem, { value: "10K", suffix: "+", label: "Active Developers", delay: 0.3 })] }) }) }));
};
export default HeroStats;
