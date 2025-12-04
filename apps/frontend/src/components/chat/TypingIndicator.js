import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
export var TypingIndicator = function (_a) {
    var className = _a.className, _b = _a.size, size = _b === void 0 ? 'md' : _b, _c = _a.color, color = _c === void 0 ? 'bg-gray-400' : _c, _d = _a.label, label = _d === void 0 ? 'Typing' : _d, _e = _a.showLabel, showLabel = _e === void 0 ? false : _e;
    var sizeClasses = {
        sm: 'h-1.5 w-1.5',
        md: 'h-2 w-2',
        lg: 'h-2.5 w-2.5',
    };
    return (_jsxs("div", { className: cn('flex items-center gap-2', className), children: [_jsx("div", { className: "flex items-center gap-1", children: [0, 1, 2].map(function (i) { return (_jsx(motion.div, { className: cn(sizeClasses[size], color, 'rounded-full'), animate: {
                        y: ['0%', '-50%', '0%'],
                        opacity: [1, 0.5, 1],
                    }, transition: {
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: 'easeInOut',
                    } }, i)); }) }), showLabel && (_jsx("span", { className: "text-sm text-gray-500 animate-pulse", children: label }))] }));
};
// Usage example:
export var TypingIndicatorExample = function () {
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(TypingIndicator, { size: "sm", color: "bg-blue-400" }), _jsx(TypingIndicator, { size: "md", color: "bg-green-400", showLabel: true, label: "Agent is thinking..." }), _jsx(TypingIndicator, { size: "lg", color: "bg-purple-400", className: "p-4 bg-gray-100 rounded-lg" })] }));
};
