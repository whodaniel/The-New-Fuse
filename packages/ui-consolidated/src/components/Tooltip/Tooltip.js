import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, forwardRef } from 'react';
export const Tooltip = forwardRef(({ children, content, side = 'top', className = '' }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    // Position classes based on side
    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    };
    return (_jsxs("div", { className: "relative inline-flex", ref: ref, children: [_jsx("div", { onMouseEnter: () => setIsVisible(true), onMouseLeave: () => setIsVisible(false), onFocus: () => setIsVisible(true), onBlur: () => setIsVisible(false), children: children }), isVisible && (_jsx("div", { className: `absolute z-50 px-3 py-2 text-sm text-white bg-black rounded-md ${positionClasses[side]} ${className}`, role: "tooltip", children: content }))] }));
});
Tooltip.displayName = 'Tooltip';
