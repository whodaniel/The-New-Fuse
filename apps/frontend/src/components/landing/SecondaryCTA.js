import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useAnalytics } from '../../hooks/useAnalytics';
/**
 * Secondary CTA Component
 *
 * Appears after features section to re-engage users
 * Features:
 * - Customizable title and description
 * - List of key benefits
 * - Multiple visual variants
 * - Analytics tracking
 */
export var SecondaryCTA = function (_a) {
    var _b = _a.title, title = _b === void 0 ? 'Ready to Transform Your Workflow?' : _b, _c = _a.description, description = _c === void 0 ? 'Join thousands of teams already using The New Fuse to streamline their agent-to-agent collaboration.' : _c, _d = _a.benefits, benefits = _d === void 0 ? [
        'Set up in minutes, not hours',
        'No coding required',
        'Cancel anytime',
        '24/7 customer support',
    ] : _d, _e = _a.ctaText, ctaText = _e === void 0 ? 'Start Your Free Trial' : _e, onCtaClick = _a.onCtaClick, _f = _a.className, className = _f === void 0 ? '' : _f, _g = _a.variant, variant = _g === void 0 ? 'default' : _g;
    var trackEvent = useAnalytics().trackEvent;
    var handleClick = function () {
        trackEvent('cta_click', {
            location: 'secondary_cta',
            cta_type: 'conversion',
            cta_text: ctaText,
        });
        onCtaClick === null || onCtaClick === void 0 ? void 0 : onCtaClick();
    };
    var variants = {
        default: 'bg-gray-50 dark:bg-gray-900',
        gradient: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950',
        minimal: 'bg-white dark:bg-gray-950',
    };
    return (_jsx("section", { className: "py-16 px-4 sm:px-6 lg:px-8 ".concat(variants[variant], " ").concat(className), children: _jsxs("div", { className: "max-w-4xl mx-auto text-center", children: [_jsx("h2", { className: "text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4", children: title }), _jsx("p", { className: "text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto", children: description }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 max-w-2xl mx-auto text-left", children: benefits.map(function (benefit, index) { return (_jsxs("div", { className: "flex items-start gap-3", children: [_jsx(CheckCircle2, { className: "w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" }), _jsx("span", { className: "text-gray-700 dark:text-gray-300", children: benefit })] }, index)); }) }), _jsx(Button, { size: "lg", onClick: handleClick, className: "group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-base px-10 py-6 h-auto", children: _jsxs("span", { className: "flex items-center gap-2", children: [ctaText, _jsx(ArrowRight, { className: "w-5 h-5 group-hover:translate-x-1 transition-transform" })] }) }), _jsx("p", { className: "mt-6 text-sm text-gray-500 dark:text-gray-400", children: "Free 14-day trial \u2022 No credit card required \u2022 Cancel anytime" })] }) }));
};
/**
 * Compact Secondary CTA
 *
 * Simpler version for tighter spaces
 */
export var CompactSecondaryCTA = function (_a) {
    var _b = _a.title, title = _b === void 0 ? 'Ready to get started?' : _b, _c = _a.description, description = _c === void 0 ? 'Join thousands of teams using The New Fuse.' : _c, _d = _a.ctaText, ctaText = _d === void 0 ? 'Try it Free' : _d, onCtaClick = _a.onCtaClick, _e = _a.className, className = _e === void 0 ? '' : _e;
    var trackEvent = useAnalytics().trackEvent;
    var handleClick = function () {
        trackEvent('cta_click', {
            location: 'compact_secondary_cta',
            cta_type: 'conversion',
            cta_text: ctaText,
        });
        onCtaClick === null || onCtaClick === void 0 ? void 0 : onCtaClick();
    };
    return (_jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-6 p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 ".concat(className), children: [_jsxs("div", { className: "text-white text-center sm:text-left", children: [_jsx("h3", { className: "text-2xl font-bold mb-2", children: title }), _jsx("p", { className: "text-blue-100", children: description })] }), _jsxs(Button, { size: "lg", variant: "outline", onClick: handleClick, className: "bg-white hover:bg-gray-100 text-blue-600 border-0 shadow-md hover:shadow-lg transition-all whitespace-nowrap", children: [ctaText, _jsx(ArrowRight, { className: "ml-2 w-5 h-5" })] })] }));
};
