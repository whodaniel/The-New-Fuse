var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { Zap, Network, Shield, Rocket, GitBranch, BarChart3 } from 'lucide-react';
import MobileNav from '../../components/MobileNav';
import { HeroCTAWithTrust, SecondaryCTA, EmailSignupForm, SocialProofSection, defaultStats, defaultTestimonials, defaultTrustBadges, FeaturesSection, FeatureCard, } from '../../components/landing';
export default function LandingPage() {
    var _this = this;
    var navigate = useNavigate();
    // Form submission handlers
    var handleEmailSignup = function (email, type) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // TODO: Implement email signup API call
            console.log('Email signup:', { email: email, type: type });
            return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
        });
    }); };
    var handleDemoRequest = function (data) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // TODO: Implement demo request API call
            console.log('Demo request:', data);
            return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
        });
    }); };
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(MobileNav, {}), _jsx("section", { id: "hero", className: "relative pt-24 pb-16 px-4 sm:px-6 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32", children: _jsx("div", { className: "container mx-auto max-w-7xl", children: _jsxs("div", { className: "flex flex-col lg:flex-row items-center gap-8 lg:gap-12", children: [_jsxs("div", { className: "flex-1 text-center lg:text-left animate-slide-in-up", children: [_jsxs("h1", { className: "text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6 leading-tight", children: ["Welcome to", ' ', _jsx("span", { className: "text-primary", children: "The New Fuse" })] }), _jsx("p", { className: "text-base sm:text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto lg:mx-0", children: "Discover a new way to collaborate and manage your workspaces efficiently. Build powerful AI-driven workflows with ease." }), _jsx("div", { className: "flex justify-center lg:justify-start", children: _jsx(HeroCTAWithTrust, { onGetStarted: function () { return navigate('/login'); }, onWatchDemo: function () { }, stats: { users: '10,000+', rating: '4.9/5' } }) })] }), _jsx("div", { className: "flex-1 w-full max-w-lg lg:max-w-none animate-slide-in-right", children: _jsx("div", { className: "relative aspect-square md:aspect-video rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm p-8 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-24 h-24 md:w-32 md:h-32 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center", children: _jsx("svg", { className: "w-12 h-12 md:w-16 md:h-16 text-primary", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 10V3L4 14h7v7l9-11h-7z" }) }) }), _jsx("p", { className: "text-muted-foreground text-sm md:text-base", children: "Powered by AI" })] }) }) })] }) }) }), _jsxs(FeaturesSection, { id: "features", title: "Powerful Features", subtitle: "Everything you need to build and deploy AI-powered applications", columns: 3, children: [_jsx(FeatureCard, { icon: Network, title: "Multi-Agent System", description: "Deploy multiple AI agents that work together seamlessly", accent: "blue", delay: 0 }), _jsx(FeatureCard, { icon: Zap, title: "Lightning Fast", description: "Optimized performance for real-time AI interactions", accent: "purple", delay: 0.1 }), _jsx(FeatureCard, { icon: Shield, title: "Secure by Default", description: "Enterprise-grade security with end-to-end encryption", accent: "green", delay: 0.2 }), _jsx(FeatureCard, { icon: GitBranch, title: "Workflow Builder", description: "Visual workflow editor for complex automation tasks", accent: "orange", delay: 0 }), _jsx(FeatureCard, { icon: BarChart3, title: "Real-time Analytics", description: "Monitor and optimize your AI agents with detailed insights", accent: "blue", delay: 0.1 }), _jsx(FeatureCard, { icon: Rocket, title: "Cloud Integration", description: "Seamlessly integrate with your favorite cloud services", accent: "pink", delay: 0.2 })] }), _jsx(SocialProofSection, { stats: defaultStats, testimonials: defaultTestimonials, trustBadges: defaultTrustBadges }), _jsx("section", { id: "about", className: "py-16 px-4 sm:px-6 md:py-24", children: _jsx("div", { className: "container mx-auto max-w-7xl", children: _jsxs("div", { className: "flex flex-col lg:flex-row items-center gap-8 lg:gap-12", children: [_jsx("div", { className: "flex-1 animate-slide-in-left", children: _jsx("div", { className: "aspect-video rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center", children: _jsx("p", { className: "text-muted-foreground", children: "About Illustration" }) }) }), _jsxs("div", { className: "flex-1 animate-slide-in-right", children: [_jsx("h2", { className: "text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4", children: "Built for the Future" }), _jsx("p", { className: "text-base md:text-lg text-muted-foreground mb-6", children: "The New Fuse combines cutting-edge AI technology with an intuitive interface to help you build, deploy, and manage intelligent automation workflows." }), _jsx("ul", { className: "space-y-3", children: [
                                            'Enterprise-ready infrastructure',
                                            'Scalable multi-agent architecture',
                                            'Real-time collaboration tools',
                                            'Comprehensive API documentation',
                                        ].map(function (item, index) { return (_jsxs("li", { className: "flex items-start gap-3", children: [_jsx("svg", { className: "w-6 h-6 text-primary flex-shrink-0 mt-0.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }), _jsx("span", { className: "text-base text-foreground", children: item })] }, index)); }) })] })] }) }) }), _jsx("section", { id: "pricing", className: "py-16 px-4 sm:px-6 md:py-24 bg-muted/30", children: _jsxs("div", { className: "container mx-auto max-w-7xl", children: [_jsxs("div", { className: "text-center mb-12 md:mb-16", children: [_jsx("h2", { className: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4", children: "Simple Pricing" }), _jsx("p", { className: "text-base md:text-lg text-muted-foreground max-w-2xl mx-auto", children: "Choose the plan that fits your needs" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto", children: [
                                {
                                    name: 'Starter',
                                    price: 'Free',
                                    features: [
                                        '3 AI Agents',
                                        'Basic Workflows',
                                        'Community Support',
                                        '1GB Storage',
                                    ],
                                },
                                {
                                    name: 'Pro',
                                    price: '$29/mo',
                                    features: [
                                        '10 AI Agents',
                                        'Advanced Workflows',
                                        'Priority Support',
                                        '10GB Storage',
                                    ],
                                    highlighted: true,
                                },
                                {
                                    name: 'Enterprise',
                                    price: 'Custom',
                                    features: [
                                        'Unlimited Agents',
                                        'Custom Workflows',
                                        'Dedicated Support',
                                        'Unlimited Storage',
                                    ],
                                },
                            ].map(function (plan, index) { return (_jsxs("div", { className: "bg-background rounded-lg p-6 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border ".concat(plan.highlighted
                                    ? 'border-primary scale-105'
                                    : 'border-border'), children: [_jsx("h3", { className: "text-xl md:text-2xl font-bold text-foreground mb-2", children: plan.name }), _jsx("p", { className: "text-3xl md:text-4xl font-bold text-primary mb-6", children: plan.price }), _jsx("ul", { className: "space-y-3 mb-6", children: plan.features.map(function (feature, idx) { return (_jsxs("li", { className: "flex items-start gap-2", children: [_jsx("svg", { className: "w-5 h-5 text-primary flex-shrink-0 mt-0.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }), _jsx("span", { className: "text-base text-foreground", children: feature })] }, idx)); }) }), _jsx("button", { className: "w-full min-h-touch rounded-md px-6 py-3 text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ".concat(plan.highlighted
                                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary'
                                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary'), children: "Get Started" })] }, index)); }) })] }) }), _jsx(SecondaryCTA, { variant: "gradient", title: "Ready to Transform Your Workflow?", description: "Join thousands of teams already using The New Fuse to streamline their agent-to-agent collaboration.", benefits: [
                    'Set up in minutes, not hours',
                    'No coding required',
                    'Cancel anytime',
                    '24/7 customer support',
                ], ctaText: "Start Your Free Trial", onCtaClick: function () { return navigate('/login'); } }), _jsx("section", { id: "contact", className: "py-16 px-4 sm:px-6 md:py-24", children: _jsx("div", { className: "container mx-auto max-w-4xl", children: _jsx(EmailSignupForm, { title: "Stay Updated", description: "Get the latest updates, tips, and exclusive content delivered to your inbox.", placeholder: "Enter your email address", buttonText: "Subscribe", type: "newsletter", onSubmit: handleEmailSignup, showPrivacyNote: true }) }) }), _jsx("footer", { className: "bg-muted/50 border-t border-border py-12 px-4 sm:px-6", children: _jsxs("div", { className: "container mx-auto max-w-7xl", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-foreground mb-4", children: "The New Fuse" }), _jsx("p", { className: "text-base text-muted-foreground", children: "Building the future of AI-powered automation." })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-base font-semibold text-foreground mb-4", children: "Product" }), _jsxs("ul", { className: "space-y-2", children: [_jsx("li", { children: _jsx("a", { href: "#features", className: "text-base text-muted-foreground hover:text-foreground transition-colors min-h-touch inline-block", children: "Features" }) }), _jsx("li", { children: _jsx("a", { href: "#pricing", className: "text-base text-muted-foreground hover:text-foreground transition-colors min-h-touch inline-block", children: "Pricing" }) })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-base font-semibold text-foreground mb-4", children: "Company" }), _jsxs("ul", { className: "space-y-2", children: [_jsx("li", { children: _jsx("a", { href: "#about", className: "text-base text-muted-foreground hover:text-foreground transition-colors min-h-touch inline-block", children: "About" }) }), _jsx("li", { children: _jsx("a", { href: "#contact", className: "text-base text-muted-foreground hover:text-foreground transition-colors min-h-touch inline-block", children: "Contact" }) })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-base font-semibold text-foreground mb-4", children: "Legal" }), _jsxs("ul", { className: "space-y-2", children: [_jsx("li", { children: _jsx("a", { href: "/privacy", className: "text-base text-muted-foreground hover:text-foreground transition-colors min-h-touch inline-block", children: "Privacy" }) }), _jsx("li", { children: _jsx("a", { href: "/terms", className: "text-base text-muted-foreground hover:text-foreground transition-colors min-h-touch inline-block", children: "Terms" }) })] })] })] }), _jsx("div", { className: "border-t border-border pt-8 text-center", children: _jsx("p", { className: "text-base text-muted-foreground", children: "\u00A9 2025 The New Fuse. All rights reserved." }) })] }) })] }));
}
