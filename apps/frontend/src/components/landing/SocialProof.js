import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Star, Quote, TrendingUp, Users, Award, CheckCircle2 } from 'lucide-react';
/**
 * Testimonials Component
 *
 * Displays customer testimonials with ratings
 * Supports multiple layout variants
 */
export var Testimonials = function (_a) {
    var testimonials = _a.testimonials, _b = _a.className, className = _b === void 0 ? '' : _b, _c = _a.variant, variant = _c === void 0 ? 'grid' : _c;
    var renderStars = function (rating) {
        if (rating === void 0) { rating = 5; }
        return (_jsx("div", { className: "flex gap-1", children: Array.from({ length: 5 }).map(function (_, i) { return (_jsx(Star, { className: "w-4 h-4 ".concat(i < rating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300') }, i)); }) }));
    };
    var renderTestimonial = function (testimonial) { return (_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700", children: [_jsx(Quote, { className: "w-8 h-8 text-blue-500 mb-4" }), _jsxs("p", { className: "text-gray-700 dark:text-gray-300 mb-6 leading-relaxed", children: ["\"", testimonial.content, "\""] }), testimonial.rating && (_jsx("div", { className: "mb-4", children: renderStars(testimonial.rating) })), _jsxs("div", { className: "flex items-center gap-3", children: [testimonial.avatar ? (_jsx("img", { src: testimonial.avatar, alt: testimonial.name, className: "w-12 h-12 rounded-full object-cover" })) : (_jsx("div", { className: "w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold", children: testimonial.name.charAt(0) })), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: testimonial.name }), _jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: [testimonial.role, " at ", testimonial.company] })] })] })] }, testimonial.id)); };
    if (variant === 'featured' && testimonials.length > 0) {
        // Featured layout - single large testimonial
        var featured = testimonials[0];
        return (_jsx("div", { className: "max-w-4xl mx-auto ".concat(className), children: _jsxs("div", { className: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-12 shadow-xl", children: [_jsx(Quote, { className: "w-12 h-12 text-blue-500 mb-6" }), _jsxs("blockquote", { className: "text-xl md:text-2xl text-gray-800 dark:text-gray-200 font-medium mb-8 leading-relaxed", children: ["\"", featured.content, "\""] }), _jsxs("div", { className: "flex items-center gap-4", children: [featured.avatar ? (_jsx("img", { src: featured.avatar, alt: featured.name, className: "w-16 h-16 rounded-full object-cover" })) : (_jsx("div", { className: "w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-semibold", children: featured.name.charAt(0) })), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-lg text-gray-900 dark:text-white", children: featured.name }), _jsxs("p", { className: "text-gray-600 dark:text-gray-400", children: [featured.role, " at ", featured.company] }), featured.rating && (_jsx("div", { className: "mt-2", children: renderStars(featured.rating) }))] })] })] }) }));
    }
    // Grid layout
    return (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ".concat(className), children: testimonials.map(renderTestimonial) }));
};
/**
 * Stats Component
 *
 * Displays key metrics and statistics
 * Supports multiple visual variants
 */
export var Stats = function (_a) {
    var stats = _a.stats, _b = _a.className, className = _b === void 0 ? '' : _b, _c = _a.variant, variant = _c === void 0 ? 'default' : _c;
    if (variant === 'compact') {
        // Compact inline layout
        return (_jsx("div", { className: "flex flex-wrap justify-center gap-8 ".concat(className), children: stats.map(function (stat, index) { return (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1", children: stat.value }), _jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400", children: stat.label })] }, index)); }) }));
    }
    if (variant === 'highlight') {
        // Highlight with gradient cards
        return (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ".concat(className), children: stats.map(function (stat, index) { return (_jsxs("div", { className: "bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [stat.icon && (_jsx("div", { className: "w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center", children: stat.icon })), stat.trend && (_jsxs("div", { className: "flex items-center gap-1 text-sm bg-white bg-opacity-20 rounded-full px-3 py-1", children: [_jsx(TrendingUp, { className: "w-4 h-4" }), stat.trend] }))] }), _jsx("div", { className: "text-4xl font-bold mb-2", children: stat.value }), _jsx("div", { className: "text-blue-100", children: stat.label })] }, index)); }) }));
    }
    // Default layout
    return (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ".concat(className), children: stats.map(function (stat, index) { return (_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700", children: [stat.icon && (_jsx("div", { className: "mb-4", children: stat.icon })), _jsx("div", { className: "text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2", children: stat.value }), _jsx("div", { className: "text-gray-600 dark:text-gray-400", children: stat.label }), stat.trend && (_jsxs("div", { className: "flex items-center gap-1 mt-3 text-sm text-green-600", children: [_jsx(TrendingUp, { className: "w-4 h-4" }), stat.trend] }))] }, index)); }) }));
};
export var TrustBadges = function (_a) {
    var badges = _a.badges, _b = _a.className, className = _b === void 0 ? '' : _b;
    return (_jsx("div", { className: "flex flex-wrap justify-center items-center gap-8 ".concat(className), children: badges.map(function (badge) { return (_jsxs("div", { className: "flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700", title: badge.description, children: [badge.icon && (_jsx("div", { className: "text-blue-600 dark:text-blue-400", children: badge.icon })), _jsx("span", { className: "font-medium text-gray-700 dark:text-gray-300", children: badge.name })] }, badge.id)); }) }));
};
export var LogoCloud = function (_a) {
    var _b = _a.title, title = _b === void 0 ? 'Trusted by leading companies' : _b, logos = _a.logos, _c = _a.className, className = _c === void 0 ? '' : _c;
    return (_jsxs("div", { className: "text-center ".concat(className), children: [title && (_jsx("p", { className: "text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-8", children: title })), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center", children: logos.map(function (logo) { return (_jsx("div", { className: "flex items-center justify-center grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100", children: _jsx("img", { src: logo.src, alt: logo.name, className: "max-h-12 w-auto" }) }, logo.id)); }) })] }));
};
export var SocialProofSection = function (_a) {
    var stats = _a.stats, testimonials = _a.testimonials, trustBadges = _a.trustBadges, _b = _a.className, className = _b === void 0 ? '' : _b;
    return (_jsx("section", { className: "py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 ".concat(className), children: _jsxs("div", { className: "max-w-7xl mx-auto space-y-16", children: [stats && stats.length > 0 && (_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold text-center text-gray-900 dark:text-white mb-12", children: "Trusted by Thousands" }), _jsx(Stats, { stats: stats, variant: "highlight" })] })), testimonials && testimonials.length > 0 && (_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold text-center text-gray-900 dark:text-white mb-12", children: "What Our Customers Say" }), _jsx(Testimonials, { testimonials: testimonials })] })), trustBadges && trustBadges.length > 0 && (_jsx("div", { children: _jsx(TrustBadges, { badges: trustBadges }) }))] }) }));
};
// Default data for quick setup
export var defaultStats = [
    {
        value: '10,000+',
        label: 'Active Users',
        icon: _jsx(Users, { className: "w-6 h-6 text-white" }),
        trend: '+23%',
    },
    {
        value: '99.9%',
        label: 'Uptime',
        icon: _jsx(TrendingUp, { className: "w-6 h-6 text-white" }),
    },
    {
        value: '4.9/5',
        label: 'User Rating',
        icon: _jsx(Star, { className: "w-6 h-6 text-white" }),
    },
    {
        value: '24/7',
        label: 'Support',
        icon: _jsx(Award, { className: "w-6 h-6 text-white" }),
    },
];
export var defaultTestimonials = [
    {
        id: '1',
        name: 'Sarah Chen',
        role: 'CTO',
        company: 'TechCorp',
        content: 'The New Fuse has completely transformed how our team collaborates. We\'ve seen a 40% increase in productivity since implementing it.',
        rating: 5,
    },
    {
        id: '2',
        name: 'Michael Rodriguez',
        role: 'Engineering Manager',
        company: 'StartupXYZ',
        content: 'The agent-to-agent collaboration features are game-changing. Setup was incredibly easy, and the support team is fantastic.',
        rating: 5,
    },
    {
        id: '3',
        name: 'Emily Watson',
        role: 'Product Lead',
        company: 'Innovation Labs',
        content: 'We tried several solutions, but The New Fuse is the only one that delivered on its promises. Highly recommended!',
        rating: 5,
    },
];
export var defaultTrustBadges = [
    {
        id: '1',
        name: 'SOC 2 Certified',
        icon: _jsx(CheckCircle2, { className: "w-5 h-5" }),
        description: 'Security and compliance certified',
    },
    {
        id: '2',
        name: 'GDPR Compliant',
        icon: _jsx(CheckCircle2, { className: "w-5 h-5" }),
        description: 'Privacy regulation compliant',
    },
    {
        id: '3',
        name: '256-bit Encryption',
        icon: _jsx(CheckCircle2, { className: "w-5 h-5" }),
        description: 'Enterprise-grade security',
    },
];
