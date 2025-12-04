var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { useAnalytics } from '../../hooks/useAnalytics';
/**
 * Primary Hero CTA Component
 *
 * Features:
 * - Dual CTA buttons (primary + secondary)
 * - Compelling action-oriented copy
 * - Eye-catching design with gradient accents
 * - Analytics tracking built-in
 * - Responsive layout
 */
export var HeroCTA = function (_a) {
    var onGetStarted = _a.onGetStarted, onWatchDemo = _a.onWatchDemo, _b = _a.className, className = _b === void 0 ? '' : _b;
    var trackEvent = useAnalytics().trackEvent;
    var handleGetStarted = function () {
        trackEvent('cta_click', {
            location: 'hero',
            cta_type: 'primary',
            cta_text: 'Get Started Free',
        });
        onGetStarted === null || onGetStarted === void 0 ? void 0 : onGetStarted();
    };
    var handleWatchDemo = function () {
        trackEvent('cta_click', {
            location: 'hero',
            cta_type: 'secondary',
            cta_text: 'Watch Demo',
        });
        onWatchDemo === null || onWatchDemo === void 0 ? void 0 : onWatchDemo();
    };
    return (_jsxs("div", { className: "flex flex-col sm:flex-row items-center gap-4 ".concat(className), children: [_jsxs(Button, { size: "lg", onClick: handleGetStarted, className: "group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-base px-8 py-6 h-auto", children: [_jsxs("span", { className: "relative z-10 flex items-center gap-2", children: [_jsx(Sparkles, { className: "w-5 h-5" }), "Get Started Free", _jsx(ArrowRight, { className: "w-5 h-5 group-hover:translate-x-1 transition-transform" })] }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" })] }), _jsx(Button, { size: "lg", variant: "outline", onClick: handleWatchDemo, className: "group border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-300 text-base px-8 py-6 h-auto", children: _jsxs("span", { className: "flex items-center gap-2", children: [_jsx("svg", { className: "w-5 h-5 group-hover:scale-110 transition-transform", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" }) }), "Watch Demo"] }) })] }));
};
/**
 * Hero CTA with Trust Indicators
 *
 * Enhanced version with social proof elements
 */
export var HeroCTAWithTrust = function (_a) {
    var _b = _a.stats, stats = _b === void 0 ? { users: '10,000+', rating: '4.9/5' } : _b, props = __rest(_a, ["stats"]);
    return (_jsxs("div", { className: "flex flex-col items-center gap-6", children: [_jsx(HeroCTA, __assign({}, props)), _jsxs("div", { className: "flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("svg", { className: "w-5 h-5 text-green-500", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }), _jsx("span", { className: "font-medium", children: "No credit card required" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("svg", { className: "w-5 h-5 text-yellow-500", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" }) }), _jsxs("span", { className: "font-medium", children: [stats.rating, " rating"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("svg", { className: "w-5 h-5 text-blue-500", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { d: "M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" }) }), _jsxs("span", { className: "font-medium", children: [stats.users, " active users"] })] })] })] }));
};
