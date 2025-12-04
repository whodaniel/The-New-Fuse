import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Card } from '@the-new-fuse/ui-consolidated';
import { CheckCircle } from 'lucide-react';
import { useWizard } from '../WizardProvider';
export var WelcomeStep = function () {
    var _a;
    var state = useWizard().state;
    var isAIAgent = ((_a = state.session) === null || _a === void 0 ? void 0 : _a.userType) === 'ai_agent';
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("img", { src: "/assets/images/logo.png", alt: "The New Fuse Logo", className: "max-h-24 mx-auto mb-4" }), _jsx("h1", { className: "text-3xl font-bold mb-2", children: isAIAgent
                            ? 'Welcome to The New Fuse Agent Network'
                            : 'Welcome to The New Fuse' }), _jsx("p", { className: "text-lg text-gray-600", children: isAIAgent
                            ? 'This wizard will guide you through the process of integrating with our AI agent network.'
                            : 'This wizard will guide you through the setup process to get you started quickly.' })] }), _jsx(Card, { className: "bg-blue-50 border-blue-200", children: _jsxs(Card.Content, { children: [_jsx("h2", { className: "text-lg font-semibold mb-4 text-blue-700", children: isAIAgent ? 'Agent Integration Benefits' : 'Key Features' }), _jsx("div", { className: "space-y-3", children: isAIAgent ? (
                            // AI Agent benefits
                            _jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(CheckCircle, { className: "text-green-500 flex-shrink-0" }), _jsx("span", { children: "Seamless communication with other AI agents" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(CheckCircle, { className: "text-green-500 flex-shrink-0" }), _jsx("span", { children: "Access to powerful tools and capabilities" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(CheckCircle, { className: "text-green-500 flex-shrink-0" }), _jsx("span", { children: "Standardized protocols for agent interaction" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(CheckCircle, { className: "text-green-500 flex-shrink-0" }), _jsx("span", { children: "Secure and reliable message exchange" })] })] })) : (
                            // Human user features
                            _jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(CheckCircle, { className: "text-green-500 flex-shrink-0" }), _jsx("span", { children: "Create and manage AI agent workflows" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(CheckCircle, { className: "text-green-500 flex-shrink-0" }), _jsx("span", { children: "Seamless integration with development environments" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(CheckCircle, { className: "text-green-500 flex-shrink-0" }), _jsx("span", { children: "Powerful tools for AI agent collaboration" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(CheckCircle, { className: "text-green-500 flex-shrink-0" }), _jsx("span", { children: "Intuitive interface for managing complex AI systems" })] })] })) })] }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-3", children: isAIAgent ? 'Integration Process' : 'Getting Started' }), _jsx("p", { className: "mb-3", children: isAIAgent
                            ? 'This wizard will guide you through the following steps to integrate with The New Fuse platform:'
                            : 'This wizard will guide you through the following steps to set up your account:' }), _jsx("div", { className: "space-y-2 pl-4", children: isAIAgent ? (
                        // AI Agent steps
                        _jsxs(_Fragment, { children: [_jsx("p", { children: "1. Configure your agent profile" }), _jsx("p", { children: "2. Define your agent capabilities" }), _jsx("p", { children: "3. Set up communication channels" }), _jsx("p", { children: "4. Complete integration" })] })) : (
                        // Human user steps
                        _jsxs(_Fragment, { children: [_jsx("p", { children: "1. Set up your user profile" }), _jsx("p", { children: "2. Configure your AI preferences" }), _jsx("p", { children: "3. Create your first workspace" }), _jsx("p", { children: "4. Select tools and integrations" }), _jsx("p", { children: "5. Meet your AI assistant" })] })) })] })] }));
};
