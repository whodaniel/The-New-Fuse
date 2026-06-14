"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WelcomeScreen = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Welcome Screen - First step in Get Started wizard
 */
const lucide_react_1 = require("lucide-react");
const WelcomeScreen = ({ context }) => {
    const features = [
        {
            icon: lucide_react_1.Bot,
            title: 'AI Agent Creation',
            description: 'Build powerful AI agents with custom capabilities and behaviors',
            color: 'text-blue-500',
        },
        {
            icon: lucide_react_1.Sparkles,
            title: 'Multi-Agent Orchestration',
            description: 'Coordinate multiple agents to work together on complex tasks',
            color: 'text-purple-500',
        },
        {
            icon: lucide_react_1.Zap,
            title: 'Real-time Collaboration',
            description: 'Agents and humans work seamlessly together in shared workspaces',
            color: 'text-yellow-500',
        },
        {
            icon: lucide_react_1.Shield,
            title: 'Enterprise Security',
            description: 'Role-based access control, audit logging, and multi-tenant isolation',
            color: 'text-green-500',
        },
        {
            icon: lucide_react_1.Globe,
            title: 'Cloud Deployment',
            description: 'Deploy to CloudRuntime with containerized execution environments',
            color: 'text-indigo-500',
        },
        {
            icon: lucide_react_1.Users,
            title: 'Team Management',
            description: 'Manage teams, agencies, and agent operators with fine-grained permissions',
            color: 'text-pink-500',
        },
    ];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-step-welcome", children: [(0, jsx_runtime_1.jsxs)("div", { className: "welcome-header", children: [(0, jsx_runtime_1.jsx)("div", { className: "welcome-logo", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Sparkles, { className: "w-16 h-16 text-purple-500" }) }), (0, jsx_runtime_1.jsx)("h1", { className: "welcome-title", children: "Welcome to The New Fuse" }), (0, jsx_runtime_1.jsx)("p", { className: "welcome-subtitle", children: "Your gateway to building, deploying, and managing AI agent ecosystems" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "welcome-features", children: [(0, jsx_runtime_1.jsx)("h2", { className: "features-title", children: "What You Can Accomplish" }), (0, jsx_runtime_1.jsx)("div", { className: "features-grid", children: features.map((feature, index) => {
                            const Icon = feature.icon;
                            return ((0, jsx_runtime_1.jsxs)("div", { className: "feature-card", children: [(0, jsx_runtime_1.jsx)("div", { className: `feature-icon ${feature.color}`, children: (0, jsx_runtime_1.jsx)(Icon, { className: "w-8 h-8" }) }), (0, jsx_runtime_1.jsx)("h3", { className: "feature-title", children: feature.title }), (0, jsx_runtime_1.jsx)("p", { className: "feature-description", children: feature.description })] }, index));
                        }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "welcome-getting-started", children: [(0, jsx_runtime_1.jsx)("h2", { className: "getting-started-title", children: "Getting Started" }), (0, jsx_runtime_1.jsxs)("div", { className: "getting-started-steps", children: [(0, jsx_runtime_1.jsxs)("div", { className: "step-item", children: [(0, jsx_runtime_1.jsx)("div", { className: "step-number", children: "1" }), (0, jsx_runtime_1.jsxs)("div", { className: "step-content", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Set Up Your Profile" }), (0, jsx_runtime_1.jsx)("p", { children: "Tell us about your goals and preferences" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "step-item", children: [(0, jsx_runtime_1.jsx)("div", { className: "step-number", children: "2" }), (0, jsx_runtime_1.jsxs)("div", { className: "step-content", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Create Your Workspace" }), (0, jsx_runtime_1.jsx)("p", { children: "Organize your agents and projects" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "step-item", children: [(0, jsx_runtime_1.jsx)("div", { className: "step-number", children: "3" }), (0, jsx_runtime_1.jsxs)("div", { className: "step-content", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Build Your First Agent" }), (0, jsx_runtime_1.jsx)("p", { children: "Start with a simple agent to learn the basics" })] })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "welcome-footer", children: (0, jsx_runtime_1.jsx)("p", { className: "footer-text", children: "This wizard will guide you through each step. You can return to it anytime from the Help menu." }) })] }));
};
exports.WelcomeScreen = WelcomeScreen;
//# sourceMappingURL=WelcomeScreen.js.map