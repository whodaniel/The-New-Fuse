import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@the-new-fuse/ui-consolidated';
import { Home, Settings, Users, Code, Book, MessageSquare, CheckCircle } from 'lucide-react';
import { useWizard } from '../WizardProvider';
export var CompletionStep = function () {
    var _a, _b, _c;
    var state = useWizard().state;
    var isAIAgent = ((_a = state.session) === null || _a === void 0 ? void 0 : _a.userType) === 'ai_agent';
    var userName = ((_c = (_b = state.session) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.name) || 'User';
    var humanNextSteps = [
        {
            title: 'Explore Dashboard',
            icon: Home,
            description: 'Get familiar with your dashboard and navigation',
            link: '/dashboard'
        },
        {
            title: 'Configure Workspace',
            icon: Settings,
            description: 'Customize your workspace settings',
            link: '/workspace/settings'
        },
        {
            title: 'Invite Team Members',
            icon: Users,
            description: 'Collaborate with your team',
            link: '/workspace/members'
        },
        {
            title: 'Create Your First Workflow',
            icon: Code,
            description: 'Build an AI workflow with multiple agents',
            link: '/workflows/new'
        },
        {
            title: 'Read Documentation',
            icon: Book,
            description: 'Learn more about The New Fuse',
            link: '/docs'
        },
        {
            title: 'Get Help',
            icon: MessageSquare,
            description: 'Contact support or join the community',
            link: '/support'
        }
    ];
    var agentNextSteps = [
        {
            title: 'API Documentation',
            icon: Book,
            description: 'Explore the API documentation',
            link: '/api/docs'
        },
        {
            title: 'Test Integration',
            icon: Code,
            description: 'Test your integration with The New Fuse',
            link: '/api/test'
        },
        {
            title: 'Monitor Usage',
            icon: Home,
            description: 'Monitor your API usage and performance',
            link: '/api/dashboard'
        },
        {
            title: 'Join Agent Network',
            icon: Users,
            description: 'Connect with other agents in the network',
            link: '/api/network'
        }
    ];
    var nextSteps = isAIAgent ? agentNextSteps : humanNextSteps;
    return (_jsx("div", { children: _jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx(CheckCircle, { className: "w-16 h-16 text-green-500 mx-auto mb-4" }), _jsx("h2", { className: "text-3xl font-bold mb-2", children: isAIAgent ? 'Integration Complete!' : 'Setup Complete!' }), _jsx("p", { className: "text-lg text-gray-600", children: isAIAgent
                                ? "Your agent \"".concat(userName, "\" has been successfully integrated with The New Fuse platform.")
                                : "Congratulations, ".concat(userName, "! You're all set to start using The New Fuse.") })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Next Steps" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: nextSteps.map(function (step, index) { return (_jsxs("div", { className: "border border-gray-200 rounded-lg", children: [_jsx("div", { className: "p-4 pb-0", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(step.icon, { className: "text-blue-500" }), _jsx("h4", { className: "text-sm font-semibold", children: step.title })] }) }), _jsxs("div", { className: "p-4", children: [_jsx("p", { className: "text-sm mb-3", children: step.description }), _jsx("a", { href: step.link, children: _jsx(Button, { size: "sm", variant: "outline", children: isAIAgent ? 'View' : 'Get Started' }) })] })] }, index)); }) })] }), _jsx("div", { className: "bg-blue-50 p-4 rounded-md", children: _jsx("p", { className: "text-sm text-blue-800", children: isAIAgent
                            ? 'Your agent is now ready to communicate with The New Fuse platform. You can use the API documentation to learn more about the available endpoints and how to use them.'
                            : 'Need help getting started? Check out our documentation or contact our support team for assistance.' }) })] }) }));
};
