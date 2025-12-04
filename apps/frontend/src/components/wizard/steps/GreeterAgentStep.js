import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GreeterAgent } from '../GreeterAgent';
import { useWizard } from '../WizardProvider';
export var GreeterAgentStep = function () {
    var _a, _b;
    var state = useWizard().state;
    var userName = ((_b = (_a = state.session) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.name) || 'there';
    return (_jsx("div", { children: _jsxs("div", { className: "flex flex-col space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-2", children: "Meet Your AI Assistant" }), _jsx("p", { className: "mb-4", children: "This is your AI assistant for The New Fuse platform. You can ask questions, get help, and learn more about the platform." })] }), _jsx(GreeterAgent, { initialMessage: "Hello ".concat(userName, "! I'm your AI assistant for The New Fuse platform. I can help you get started and answer any questions you might have. What would you like to know about The New Fuse?"), agentName: "Fuse Assistant" }), _jsx("div", { children: _jsx("p", { className: "text-sm text-gray-600", children: "This assistant uses Retrieval Augmented Generation (RAG) to provide accurate and helpful information about The New Fuse platform. It has access to the latest documentation and can help you with any questions you might have." }) })] }) }));
};
