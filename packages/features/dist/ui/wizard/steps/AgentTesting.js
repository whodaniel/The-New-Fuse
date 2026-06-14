"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentTesting = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Agent Testing Step
 *
 * Interactive step to test the newly configured agent
 */
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const SAMPLE_PROMPTS = [
    'Hello! Can you tell me about yourself?',
    'What capabilities do you have?',
    'Can you help me with a simple coding task?',
    'Summarize the key features of The New Fuse',
    'What kind of tasks are you best suited for?',
];
const AgentTesting = ({ context, onDataChange, validationErrors = [], }) => {
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [inputValue, setInputValue] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [testResult, setTestResult] = (0, react_1.useState)(null);
    const [testsPassed, setTestsPassed] = (0, react_1.useState)(0);
    const agentName = context.data.agentName || 'Your Agent';
    const sendMessage = (0, react_1.useCallback)(async (content) => {
        if (!content.trim())
            return;
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        const startTime = Date.now();
        // Simulate API call - in production this would call the actual agent
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));
            const responseTime = Date.now() - startTime;
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `This is a simulated response from ${agentName}. In production, this would be the actual AI response based on your configuration:\n\n• Agent Type: ${context.data.agentType || 'Not set'}\n• Provider: ${context.data.provider || 'Not set'}\n• Model: ${context.data.model || 'Not set'}\n\nYour message was: "${content}"`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setTestResult({
                success: true,
                responseTime,
                tokensUsed: Math.floor(Math.random() * 100) + 50,
            });
            setTestsPassed((prev) => prev + 1);
            onDataChange({ testsPassed: testsPassed + 1, lastTestResult: 'success' });
        }
        catch (error) {
            setTestResult({
                success: false,
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            onDataChange({ lastTestResult: 'failure' });
        }
        finally {
            setIsLoading(false);
        }
    }, [agentName, context.data, testsPassed, onDataChange]);
    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(inputValue);
    };
    const clearConversation = () => {
        setMessages([]);
        setTestResult(null);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-step-testing", children: [(0, jsx_runtime_1.jsxs)("div", { className: "step-header", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Play, { className: "w-8 h-8 text-primary" }), (0, jsx_runtime_1.jsx)("h2", { className: "step-title", children: "Test Your Agent" }), (0, jsx_runtime_1.jsx)("p", { className: "step-description", children: "Try out your agent before finalizing the configuration" })] }), validationErrors.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "validation-errors", children: validationErrors.map((error, index) => ((0, jsx_runtime_1.jsx)("div", { className: "error-message", children: error }, index))) })), (0, jsx_runtime_1.jsxs)("div", { className: "testing-container", children: [(0, jsx_runtime_1.jsxs)("div", { className: "chat-section", children: [(0, jsx_runtime_1.jsxs)("div", { className: "chat-header", children: [(0, jsx_runtime_1.jsxs)("div", { className: "agent-info", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MessageSquare, { className: "w-5 h-5" }), (0, jsx_runtime_1.jsx)("span", { children: agentName })] }), (0, jsx_runtime_1.jsxs)("button", { className: "clear-btn", onClick: clearConversation, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: "w-4 h-4" }), "Clear"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "chat-messages", children: [messages.length === 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "empty-state", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MessageSquare, { className: "w-12 h-12 text-muted" }), (0, jsx_runtime_1.jsx)("p", { children: "Start a conversation to test your agent" })] })) : (messages.map((message) => ((0, jsx_runtime_1.jsxs)("div", { className: `message ${message.role}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "message-content", children: message.content }), (0, jsx_runtime_1.jsx)("div", { className: "message-time", children: message.timestamp.toLocaleTimeString() })] }, message.id)))), isLoading && ((0, jsx_runtime_1.jsxs)("div", { className: "message assistant loading", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Loader, { className: "w-4 h-4 animate-spin" }), (0, jsx_runtime_1.jsx)("span", { children: "Thinking..." })] }))] }), (0, jsx_runtime_1.jsxs)("form", { className: "chat-input", onSubmit: handleSubmit, children: [(0, jsx_runtime_1.jsx)("input", { type: "text", value: inputValue, onChange: (e) => setInputValue(e.target.value), placeholder: "Type a message to test your agent...", disabled: isLoading }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: isLoading || !inputValue.trim(), children: (0, jsx_runtime_1.jsx)(lucide_react_1.Send, { className: "w-4 h-4" }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "test-sidebar", children: [(0, jsx_runtime_1.jsxs)("div", { className: "sample-prompts", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Try These Prompts" }), (0, jsx_runtime_1.jsx)("div", { className: "prompt-list", children: SAMPLE_PROMPTS.map((prompt, index) => ((0, jsx_runtime_1.jsx)("button", { className: "prompt-btn", onClick: () => sendMessage(prompt), disabled: isLoading, children: prompt }, index))) })] }), testResult && ((0, jsx_runtime_1.jsxs)("div", { className: `test-result ${testResult.success ? 'success' : 'failure'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "result-header", children: [testResult.success ? (0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "w-5 h-5" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "w-5 h-5" }), (0, jsx_runtime_1.jsx)("span", { children: testResult.success ? 'Test Passed' : 'Test Failed' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "result-stats", children: [(0, jsx_runtime_1.jsxs)("div", { className: "stat", children: [(0, jsx_runtime_1.jsx)("span", { className: "label", children: "Response Time" }), (0, jsx_runtime_1.jsxs)("span", { className: "value", children: [testResult.responseTime, "ms"] })] }), testResult.tokensUsed && ((0, jsx_runtime_1.jsxs)("div", { className: "stat", children: [(0, jsx_runtime_1.jsx)("span", { className: "label", children: "Tokens Used" }), (0, jsx_runtime_1.jsx)("span", { className: "value", children: testResult.tokensUsed })] }))] }), testResult.error && (0, jsx_runtime_1.jsx)("div", { className: "result-error", children: testResult.error })] })), (0, jsx_runtime_1.jsxs)("div", { className: "test-summary", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Test Summary" }), (0, jsx_runtime_1.jsxs)("div", { className: "summary-stat", children: [(0, jsx_runtime_1.jsx)("span", { className: "label", children: "Tests Passed" }), (0, jsx_runtime_1.jsx)("span", { className: "value", children: testsPassed })] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "step-tips", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Tips" }), (0, jsx_runtime_1.jsxs)("ul", { children: [(0, jsx_runtime_1.jsx)("li", { children: "Test with different types of prompts to verify capabilities" }), (0, jsx_runtime_1.jsx)("li", { children: "Check response times to ensure acceptable performance" }), (0, jsx_runtime_1.jsx)("li", { children: "You can skip this step and test later if needed" })] })] })] }));
};
exports.AgentTesting = AgentTesting;
//# sourceMappingURL=AgentTesting.js.map