var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { LandingFooter } from '@/components/layout/LandingFooter';
import { SEOHead } from '@/components/seo/SEOHead';
import { usePagePerformance } from '@/hooks/usePagePerformance';
import { Bot, Workflow, MessageSquare, Shield, Zap, Globe, Code, Users, BarChart3, Cpu, Network, Terminal, Github, Chrome, ArrowRight, CheckCircle, Star, Sparkles, Target, Rocket, Play, Clock, TrendingUp, Layers, Box, GitBranch, Database, Cloud, Activity, Puzzle } from 'lucide-react';
// Animated gradient background
var AnimatedBackground = function () { return (_jsxs("div", { className: "absolute inset-0 overflow-hidden pointer-events-none", children: [_jsx("div", { className: "absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-blob" }), _jsx("div", { className: "absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-green-500/20 to-blue-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" }), _jsx("div", { className: "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-blob animation-delay-4000" })] })); };
// Animated counter component
var AnimatedCounter = function (_a) {
    var end = _a.end, _b = _a.duration, duration = _b === void 0 ? 2000 : _b, _c = _a.suffix, suffix = _c === void 0 ? '' : _c;
    var _d = useState(0), count = _d[0], setCount = _d[1];
    useEffect(function () {
        var startTime;
        var animate = function (timestamp) {
            if (!startTime)
                startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [end, duration]);
    return _jsxs("span", { children: [count.toLocaleString(), suffix] });
};
// Feature card with hover effects
var ModernFeatureCard = function (_a) {
    var Icon = _a.icon, title = _a.title, description = _a.description, gradient = _a.gradient;
    return (_jsxs(Card, { className: "group relative overflow-hidden border-0 bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2", children: [_jsx("div", { className: "absolute inset-0 ".concat(gradient, " opacity-0 group-hover:opacity-10 transition-opacity duration-300") }), _jsx(CardContent, { className: "p-8", children: _jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-14 h-14 rounded-2xl ".concat(gradient, " flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg"), children: _jsx(Icon, { className: "h-7 w-7 text-white" }) }), _jsx("h3", { className: "text-xl font-bold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors", children: title }), _jsx("p", { className: "text-gray-600 leading-relaxed", children: description })] }) })] }));
};
// Use case card
var UseCaseCard = function (_a) {
    var Icon = _a.icon, title = _a.title, description = _a.description, features = _a.features, color = _a.color;
    return (_jsx(Card, { className: "group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200 bg-gradient-to-br from-white to-gray-50", children: _jsxs(CardContent, { className: "p-6", children: [_jsx("div", { className: "w-12 h-12 rounded-xl bg-gradient-to-br ".concat(color, " flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"), children: _jsx(Icon, { className: "h-6 w-6 text-white" }) }), _jsx("h3", { className: "text-lg font-bold mb-2 text-gray-900", children: title }), _jsx("p", { className: "text-gray-600 mb-4 text-sm", children: description }), _jsx("ul", { className: "space-y-2", children: features.map(function (feature, idx) { return (_jsxs("li", { className: "flex items-start text-sm text-gray-600", children: [_jsx(CheckCircle, { className: "h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" }), _jsx("span", { children: feature })] }, idx)); }) })] }) }));
};
export var LandingRedesigned = function () {
    usePagePerformance('Landing Page Redesigned');
    return (_jsxs("div", { className: "min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50", children: [_jsx(SEOHead, { title: "The New Fuse - Revolutionary AI Collaboration Platform | MCP & A2A Protocol", description: "Transform your workflow with The New Fuse - the most advanced AI agent orchestration platform. Build, deploy, and manage intelligent agents with MCP protocol, workflow automation, and real-time collaboration.", keywords: ['AI platform', 'AI agents', 'workflow automation', 'agent orchestration', 'MCP protocol', 'A2A protocol', 'AI collaboration', 'intelligent automation', 'enterprise AI', 'AI development platform'], canonical: typeof window !== 'undefined' ? window.location.origin : '' }), _jsx(LandingHeader, {}), _jsxs("main", { className: "flex-grow", role: "main", children: [_jsxs("section", { className: "relative min-h-screen flex items-center justify-center overflow-hidden", "aria-labelledby": "hero-heading", children: [_jsx(AnimatedBackground, {}), _jsx("div", { className: "relative container mx-auto px-4 py-20", children: _jsxs("div", { className: "max-w-6xl mx-auto text-center", children: [_jsx("div", { className: "flex justify-center mb-8 animate-fade-in-up", children: _jsxs(Badge, { className: "px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 text-sm font-semibold shadow-lg", children: [_jsx(Sparkles, { className: "w-4 h-4 mr-2" }), "Powered by MCP & A2A Protocols"] }) }), _jsxs("h1", { id: "hero-heading", className: "text-6xl lg:text-8xl font-black mb-8 animate-fade-in-up animation-delay-200", children: [_jsx("span", { className: "block text-gray-900", children: "The Future of" }), _jsx("span", { className: "block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent", children: "AI Orchestration" })] }), _jsx("p", { className: "text-xl lg:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400", children: "Build intelligent workflows, orchestrate AI agents, and automate complex tasks with the most powerful AI collaboration platform ever created." }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up animation-delay-600", children: [_jsx(Button, { asChild: true, size: "lg", className: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-7 text-lg font-bold shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 group border-0", children: _jsxs(Link, { to: "/auth/register", children: [_jsx(Rocket, { className: "mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" }), "Start Building Free", _jsx(ArrowRight, { className: "ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" })] }) }), _jsxs(Button, { size: "lg", variant: "outline", className: "border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 px-10 py-7 text-lg font-semibold group transition-all duration-300", onClick: function () {
                                                        var videoSection = document.getElementById('demo-video');
                                                        videoSection === null || videoSection === void 0 ? void 0 : videoSection.scrollIntoView({ behavior: 'smooth' });
                                                    }, children: [_jsx(Play, { className: "mr-2 h-5 w-5 group-hover:scale-110 transition-transform" }), "Watch Demo"] })] }), _jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto animate-fade-in-up animation-delay-800", children: [
                                                { value: 10000, suffix: '+', label: 'Active Users', icon: Users, color: 'from-blue-500 to-blue-600' },
                                                { value: 250, suffix: '+', label: 'AI Agents', icon: Bot, color: 'from-purple-500 to-purple-600' },
                                                { value: 5000, suffix: '+', label: 'Workflows', icon: Workflow, color: 'from-green-500 to-green-600' },
                                                { value: 99.9, suffix: '%', label: 'Uptime', icon: Activity, color: 'from-orange-500 to-orange-600' }
                                            ].map(function (stat, idx) { return (_jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r {stat.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity" }), _jsx(Card, { className: "border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm", children: _jsxs(CardContent, { className: "p-6 text-center", children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-gradient-to-r ".concat(stat.color, " flex items-center justify-center mx-auto mb-3"), children: _jsx(stat.icon, { className: "h-6 w-6 text-white" }) }), _jsx("div", { className: "text-3xl font-black text-gray-900 mb-1", children: _jsx(AnimatedCounter, { end: stat.value, suffix: stat.suffix }) }), _jsx("div", { className: "text-sm font-semibold text-gray-600", children: stat.label })] }) })] }, idx)); }) })] }) }), _jsx("div", { className: "absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce", children: _jsx("div", { className: "w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center", children: _jsx("div", { className: "w-1 h-3 bg-gray-400 rounded-full mt-2 animate-scroll" }) }) })] }), _jsx("section", { className: "py-24 bg-white relative overflow-hidden", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs("div", { className: "max-w-3xl mx-auto text-center mb-16", children: [_jsx(Badge, { className: "mb-4 bg-blue-100 text-blue-700 border-blue-200", children: "Platform Overview" }), _jsx("h2", { className: "text-4xl lg:text-5xl font-black text-gray-900 mb-6", children: "One Platform, Infinite Possibilities" }), _jsx("p", { className: "text-xl text-gray-600", children: "From AI agent management to workflow automation, The New Fuse provides everything you need to build the future of intelligent automation." })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto", children: [_jsx(ModernFeatureCard, { icon: Bot, title: "AI Agent Marketplace", description: "Discover, deploy, and manage 250+ pre-built AI agents. Each agent specializes in specific tasks, from code generation to data analysis.", gradient: "bg-gradient-to-br from-blue-500 to-blue-600" }), _jsx(ModernFeatureCard, { icon: Network, title: "MCP Protocol Native", description: "Built on Model Context Protocol for seamless integration with any AI model. Connect Claude, GPT-4, Gemini, and custom models effortlessly.", gradient: "bg-gradient-to-br from-purple-500 to-purple-600" }), _jsx(ModernFeatureCard, { icon: Workflow, title: "Visual Workflow Builder", description: "Design complex automation pipelines with drag-and-drop simplicity. Real-time execution monitoring and debugging included.", gradient: "bg-gradient-to-br from-green-500 to-green-600" }), _jsx(ModernFeatureCard, { icon: MessageSquare, title: "Agent-to-Agent Communication", description: "Implements Google's A2A protocol for intelligent multi-agent coordination. Agents collaborate automatically to solve complex problems.", gradient: "bg-gradient-to-br from-orange-500 to-orange-600" }), _jsx(ModernFeatureCard, { icon: Chrome, title: "Browser Automation", description: "Chrome extension with powerful automation capabilities. Capture context, automate web tasks, and integrate with any website.", gradient: "bg-gradient-to-br from-pink-500 to-pink-600" }), _jsx(ModernFeatureCard, { icon: Terminal, title: "VS Code Integration", description: "Native IDE extension for seamless development. Code generation, debugging, and AI assistance right in your editor.", gradient: "bg-gradient-to-br from-indigo-500 to-indigo-600" })] })] }) }), _jsx("section", { className: "py-24 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs("div", { className: "max-w-3xl mx-auto text-center mb-16", children: [_jsx(Badge, { className: "mb-4 bg-purple-100 text-purple-700 border-purple-200", children: "Why Choose Us" }), _jsx("h2", { className: "text-4xl lg:text-5xl font-black text-gray-900 mb-6", children: "Built Different from the Ground Up" }), _jsx("p", { className: "text-xl text-gray-600", children: "We didn't just build another AI tool. We created the operating system for AI collaboration." })] }), _jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto", children: [
                                        {
                                            icon: Zap,
                                            title: 'Lightning-Fast Performance',
                                            description: 'Sub-100ms response times with intelligent caching and edge computing',
                                            stats: ['<100ms latency', 'Global CDN', '99.9% uptime']
                                        },
                                        {
                                            icon: Shield,
                                            title: 'Enterprise-Grade Security',
                                            description: 'SOC 2 compliant with end-to-end encryption and RBAC',
                                            stats: ['SOC 2 Type II', 'E2E encryption', 'GDPR compliant']
                                        },
                                        {
                                            icon: Code,
                                            title: 'Developer-First Design',
                                            description: 'Comprehensive APIs, SDKs, and documentation for rapid integration',
                                            stats: ['REST & GraphQL APIs', 'TypeScript SDKs', '100% documented']
                                        },
                                        {
                                            icon: Layers,
                                            title: 'Modular Architecture',
                                            description: 'Microservices-based design that scales with your needs',
                                            stats: ['Docker ready', 'Kubernetes native', 'Horizontal scaling']
                                        }
                                    ].map(function (item, idx) { return (_jsx(Card, { className: "border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur group", children: _jsx(CardContent, { className: "p-8", children: _jsxs("div", { className: "flex items-start space-x-4", children: [_jsx("div", { className: "w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform", children: _jsx(item.icon, { className: "h-8 w-8 text-white" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-2xl font-bold mb-3 text-gray-900", children: item.title }), _jsx("p", { className: "text-gray-600 mb-4 leading-relaxed", children: item.description }), _jsx("div", { className: "flex flex-wrap gap-2", children: item.stats.map(function (stat, i) { return (_jsx(Badge, { variant: "secondary", className: "bg-blue-100 text-blue-700", children: stat }, i)); }) })] })] }) }) }, idx)); }) })] }) }), _jsx("section", { className: "py-24 bg-white", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs("div", { className: "max-w-3xl mx-auto text-center mb-16", children: [_jsx(Badge, { className: "mb-4 bg-green-100 text-green-700 border-green-200", children: "Use Cases" }), _jsx("h2", { className: "text-4xl lg:text-5xl font-black text-gray-900 mb-6", children: "Transforming Industries Worldwide" }), _jsx("p", { className: "text-xl text-gray-600", children: "From startups to enterprises, see how teams leverage The New Fuse to automate their workflows." })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto", children: [_jsx(UseCaseCard, { icon: Code, title: "Software Development", description: "Automate your entire development lifecycle", features: [
                                                'Automated code review and testing',
                                                'CI/CD pipeline orchestration',
                                                'Bug detection and fixing',
                                                'Documentation generation'
                                            ], color: "from-blue-500 to-blue-600" }), _jsx(UseCaseCard, { icon: Users, title: "Customer Support", description: "Scale your support with intelligent agents", features: [
                                                '24/7 automated responses',
                                                'Multi-language support',
                                                'Ticket routing and prioritization',
                                                'Knowledge base integration'
                                            ], color: "from-green-500 to-green-600" }), _jsx(UseCaseCard, { icon: BarChart3, title: "Data Analytics", description: "Transform raw data into actionable insights", features: [
                                                'Automated data processing',
                                                'Real-time analytics dashboards',
                                                'Predictive modeling',
                                                'Custom report generation'
                                            ], color: "from-purple-500 to-purple-600" }), _jsx(UseCaseCard, { icon: Target, title: "Marketing Automation", description: "Personalize at scale with AI agents", features: [
                                                'Content generation',
                                                'Campaign optimization',
                                                'Social media management',
                                                'Lead scoring and nurturing'
                                            ], color: "from-pink-500 to-pink-600" }), _jsx(UseCaseCard, { icon: Database, title: "Data Engineering", description: "Build robust data pipelines", features: [
                                                'ETL workflow automation',
                                                'Data quality monitoring',
                                                'Schema management',
                                                'Real-time data sync'
                                            ], color: "from-indigo-500 to-indigo-600" }), _jsx(UseCaseCard, { icon: Puzzle, title: "Business Operations", description: "Streamline operations across departments", features: [
                                                'Process automation',
                                                'Document processing',
                                                'Approval workflows',
                                                'Resource allocation'
                                            ], color: "from-orange-500 to-orange-600" })] })] }) }), _jsxs("section", { className: "py-24 bg-gradient-to-br from-gray-900 to-blue-900 text-white relative overflow-hidden", id: "demo-video", children: [_jsx("div", { className: "absolute inset-0 bg-grid-pattern opacity-10" }), _jsxs("div", { className: "container mx-auto px-4 relative", children: [_jsxs("div", { className: "max-w-3xl mx-auto text-center mb-16", children: [_jsx(Badge, { className: "mb-4 bg-white/10 text-white border-white/20", children: "Tech Stack" }), _jsx("h2", { className: "text-4xl lg:text-5xl font-black mb-6", children: "Built with Modern Technology" }), _jsx("p", { className: "text-xl text-blue-100", children: "Enterprise-grade infrastructure powered by cutting-edge technologies" })] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto", children: [
                                            { icon: Code, name: 'TypeScript', desc: 'Type-safe development' },
                                            { icon: Box, name: 'React 19', desc: 'Modern UI framework' },
                                            { icon: Terminal, name: 'NestJS', desc: 'Scalable backend' },
                                            { icon: Database, name: 'PostgreSQL', desc: 'Reliable database' },
                                            { icon: Cloud, name: 'Docker', desc: 'Containerization' },
                                            { icon: GitBranch, name: 'Git', desc: 'Version control' },
                                            { icon: Cpu, name: 'Redis', desc: 'High-speed caching' },
                                            { icon: Globe, name: 'Railway', desc: 'Cloud deployment' }
                                        ].map(function (tech, idx) { return (_jsx(Card, { className: "bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 group backdrop-blur", children: _jsxs(CardContent, { className: "p-6 text-center", children: [_jsx(tech.icon, { className: "h-10 w-10 mx-auto mb-3 text-blue-400 group-hover:scale-110 transition-transform" }), _jsx("div", { className: "font-bold text-white mb-1", children: tech.name }), _jsx("div", { className: "text-sm text-blue-200", children: tech.desc })] }) }, idx)); }) }), _jsxs("div", { className: "mt-16 text-center", children: [_jsx("p", { className: "text-blue-100 mb-6 text-lg", children: "Open source and extensible. Built by developers, for developers." }), _jsx(Button, { asChild: true, variant: "outline", size: "lg", className: "border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg", children: _jsxs(Link, { to: "https://github.com/whodaniel/fuse", target: "_blank", children: [_jsx(Github, { className: "mr-2 h-5 w-5" }), "View on GitHub"] }) })] })] })] }), _jsx("section", { className: "py-24 bg-white", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs("div", { className: "max-w-3xl mx-auto text-center mb-16", children: [_jsx(Badge, { className: "mb-4 bg-yellow-100 text-yellow-700 border-yellow-200", children: "Trusted By" }), _jsx("h2", { className: "text-4xl lg:text-5xl font-black text-gray-900 mb-6", children: "Join Thousands of Teams Building with AI" }), _jsx("p", { className: "text-xl text-gray-600", children: "From startups to Fortune 500 companies, teams worldwide trust The New Fuse" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto", children: [
                                        {
                                            quote: "The New Fuse transformed how we build and deploy AI agents. What took weeks now takes hours.",
                                            author: "Sarah Chen",
                                            role: "CTO, TechStartup Inc",
                                            rating: 5
                                        },
                                        {
                                            quote: "Best AI orchestration platform we've used. The MCP integration is seamless and powerful.",
                                            author: "Michael Rodriguez",
                                            role: "Lead Developer, DataCorp",
                                            rating: 5
                                        },
                                        {
                                            quote: "Incredible developer experience. The VS Code extension alone saved us countless hours.",
                                            author: "Emily Watson",
                                            role: "Engineering Manager, CloudSolutions",
                                            rating: 5
                                        }
                                    ].map(function (testimonial, idx) { return (_jsx(Card, { className: "border-2 border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300", children: _jsxs(CardContent, { className: "p-8", children: [_jsx("div", { className: "flex mb-4", children: __spreadArray([], Array(testimonial.rating), true).map(function (_, i) { return (_jsx(Star, { className: "h-5 w-5 fill-yellow-400 text-yellow-400" }, i)); }) }), _jsxs("p", { className: "text-gray-700 mb-6 italic leading-relaxed", children: ["\"", testimonial.quote, "\""] }), _jsxs("div", { children: [_jsx("div", { className: "font-bold text-gray-900", children: testimonial.author }), _jsx("div", { className: "text-sm text-gray-600", children: testimonial.role })] })] }) }, idx)); }) })] }) }), _jsxs("section", { className: "py-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-black/20" }), _jsx(AnimatedBackground, {}), _jsx("div", { className: "container mx-auto px-4 relative", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center", children: [_jsx("h2", { className: "text-5xl lg:text-7xl font-black mb-8", children: "Ready to Build the Future?" }), _jsx("p", { className: "text-2xl text-blue-100 mb-12 leading-relaxed", children: "Join 10,000+ developers already building with The New Fuse. Start free, scale as you grow." }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-6 justify-center mb-16", children: [_jsx(Button, { asChild: true, size: "lg", className: "bg-white text-blue-600 hover:bg-blue-50 px-12 py-8 text-xl font-bold shadow-2xl hover:shadow-white/50 transition-all duration-300 group", children: _jsxs(Link, { to: "/auth/register", children: ["Get Started Free", _jsx(ArrowRight, { className: "ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform" })] }) }), _jsx(Button, { asChild: true, size: "lg", variant: "outline", className: "border-2 border-white/30 text-white hover:bg-white/10 px-12 py-8 text-xl font-semibold backdrop-blur", children: _jsx(Link, { to: "/auth/login", children: "Sign In" }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8 text-center", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-center mb-2", children: [_jsx(CheckCircle, { className: "h-6 w-6 text-green-400 mr-2" }), _jsx("span", { className: "text-lg font-bold", children: "No Credit Card" })] }), _jsx("p", { className: "text-blue-100 text-sm", children: "Start building immediately" })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-center mb-2", children: [_jsx(Clock, { className: "h-6 w-6 text-green-400 mr-2" }), _jsx("span", { className: "text-lg font-bold", children: "5-Minute Setup" })] }), _jsx("p", { className: "text-blue-100 text-sm", children: "Deploy your first agent fast" })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-center mb-2", children: [_jsx(TrendingUp, { className: "h-6 w-6 text-green-400 mr-2" }), _jsx("span", { className: "text-lg font-bold", children: "Scale Infinitely" })] }), _jsx("p", { className: "text-blue-100 text-sm", children: "Grow without limits" })] })] })] }) })] })] }), _jsx(LandingFooter, {})] }));
};
// Export as default for backward compatibility
export default LandingRedesigned;
