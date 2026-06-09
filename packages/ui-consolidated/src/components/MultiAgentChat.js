import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { DeleteIcon, EditIcon, SettingsIcon, SystemIcon, providerDetails, useMultiAgentChat, } from './MultiAgentChatProvider';
// Agent Tag Component
const AgentTag = ({ agent, onEdit, onDelete, }) => (_jsxs("div", { className: "flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-full pr-3 pl-1 py-1", children: [_jsx("img", { src: agent.profilePictureUrl || 'https://placehold.co/32x32/667eea/ffffff?text=A', alt: agent.name, className: "w-8 h-8 rounded-full object-cover" }), _jsx("span", { className: "font-medium text-sm", children: agent.name }), _jsx("button", { onClick: onEdit, className: "text-gray-500 hover:text-blue-500", children: _jsx(EditIcon, {}) }), _jsx("button", { onClick: onDelete, className: "text-gray-500 hover:text-red-500", children: _jsx(DeleteIcon, {}) })] }));
// Message Bubble Component
const MessageBubble = ({ message, agents }) => {
    const agent = message.agentId ? agents.find((a) => a.id === message.agentId) : null;
    const Icon = message.sender === 'system'
        ? SystemIcon
        : agent && providerDetails[agent.llm]
            ? providerDetails[agent.llm].icon
            : null;
    const isYou = message.sender === 'You';
    const isSystem = message.sender === 'system';
    const bubbleClass = isYou
        ? 'bg-blue-500 text-white self-end'
        : isSystem
            ? 'bg-gray-500 text-white self-center text-center text-xs italic'
            : 'bg-white dark:bg-gray-700 self-start';
    return (_jsxs("div", { className: `flex items-start gap-3 max-w-xl w-full ${isYou ? 'self-end flex-row-reverse' : 'self-start'}`, children: [!isYou && !isSystem && (_jsx("img", { src: agent?.profilePictureUrl || 'https://placehold.co/40x40/7c3aed/ffffff?text=A', alt: message.sender, className: "w-10 h-10 rounded-full object-cover flex-shrink-0" })), isSystem && (_jsx("div", { className: "w-10 h-10 flex items-center justify-center flex-shrink-0", children: _jsx(SystemIcon, {}) })), _jsxs("div", { className: `p-4 rounded-xl shadow-md ${bubbleClass}`, children: [!isYou && !isSystem && (_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "font-bold", children: message.sender }), Icon && _jsx(Icon, {})] })), _jsx("p", { className: "whitespace-pre-wrap break-words", children: message.text })] })] }));
};
// Agent Modal Component
const AgentModal = ({ isOpen, agent, onClose, onSave }) => {
    const [name, setName] = useState(agent?.name || '');
    const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt || '');
    const [llm, setLlm] = useState(agent?.llm || 'gemini');
    const [model, setModel] = useState(agent?.model || 'gemini-2.0-flash');
    const [profilePictureUrl, setProfilePictureUrl] = useState(agent?.profilePictureUrl || null);
    const [isGeneratingPic, setIsGeneratingPic] = useState(false);
    const [picError, setPicError] = useState('');
    const { generateImage } = useMultiAgentChat();
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ name, systemPrompt, llm, model, profilePictureUrl });
        onClose();
    };
    const generatePicture = async () => {
        if (!systemPrompt.trim()) {
            setPicError('Please define a system prompt for the character first.');
            return;
        }
        setPicError('');
        setIsGeneratingPic(true);
        try {
            const picPrompt = `Create a profile picture for an AI character. It should be a simple, clean, cartoon-style portrait. Character persona: "${systemPrompt}"`;
            const response = await generateImage({ prompt: picPrompt });
            setProfilePictureUrl(response.url);
        }
        catch (error) {
            console.error('Profile picture generation failed:', error);
            setPicError("Couldn't generate a picture. Please try again.");
        }
        setIsGeneratingPic(false);
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4", children: _jsxs("form", { onSubmit: handleSubmit, className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: agent ? 'Edit Agent' : 'Create Agent' }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block mb-1 font-semibold", children: "Name" }), _jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), required: true, className: "w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block mb-1 font-semibold", children: "System Prompt (Persona)" }), _jsx("textarea", { value: systemPrompt, onChange: (e) => setSystemPrompt(e.target.value), required: true, rows: 4, className: "w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block mb-1 font-semibold", children: "Profile Picture" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("img", { src: profilePictureUrl || 'https://placehold.co/80x80/1f2937/ffffff?text=...', alt: "Profile", className: "w-20 h-20 rounded-full object-cover bg-gray-200 dark:bg-gray-700" }), _jsx("button", { type: "button", onClick: generatePicture, disabled: isGeneratingPic, className: "px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400", children: isGeneratingPic ? 'Generating...' : 'Generate New' })] }), picError && _jsx("p", { className: "text-red-500 text-sm mt-2", children: picError })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block mb-1 font-semibold", children: "LLM Provider" }), _jsx("select", { value: llm, onChange: (e) => setLlm(e.target.value), className: "w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600", children: Object.entries(providerDetails).map(([key, { name }]) => (_jsx("option", { value: key, children: name }, key))) })] }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block mb-1 font-semibold", children: "Model Name" }), _jsx("input", { type: "text", value: model, onChange: (e) => setModel(e.target.value), required: true, className: "w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600", placeholder: "e.g., gemini-2.0-flash" })] }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg", children: "Cancel" }), _jsx("button", { type: "submit", className: "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600", children: "Save" })] })] }) }));
};
// Scenario Modal Component
const ScenarioModal = ({ isOpen, onClose, onSend }) => {
    const [text, setText] = useState('');
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Inject Scenario" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-4", children: "Describe a situation or topic to make the agents discuss it. This will clear the current context and start a new conversation." }), _jsx("textarea", { value: text, onChange: (e) => setText(e.target.value), rows: 5, className: "w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600", placeholder: "e.g., You are all trying to decide where to go for dinner..." }), _jsxs("div", { className: "flex justify-end gap-3 mt-4", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg", children: "Cancel" }), _jsx("button", { onClick: () => onSend(text), disabled: !text.trim(), className: "px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-red-400", children: "Send Scenario" })] })] }) }));
};
// Rules Modal Component
const RulesModal = ({ isOpen, onClose }) => {
    const { agents, rules, createRule, deleteRule } = useMultiAgentChat();
    const handleAddRule = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const sourceId = formData.get('source');
        const targetId = formData.get('target');
        if (sourceId && targetId) {
            createRule({ sourceId, targetId, priority: 1, isActive: true });
            e.target.reset();
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Conversation Rules" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-4", children: "Define who talks after whom. This is used for 'auto' mode." }), _jsxs("form", { onSubmit: handleAddRule, className: "flex items-center gap-2 mb-4", children: [_jsx("select", { name: "source", required: true, className: "w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600", children: agents.map((a) => (_jsx("option", { value: a.id, children: a.name }, a.id))) }), _jsx("span", { children: "\u27A1\uFE0F" }), _jsx("select", { name: "target", required: true, className: "w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600", children: agents.map((a) => (_jsx("option", { value: a.id, children: a.name }, a.id))) }), _jsx("button", { type: "submit", className: "px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600", children: "+" })] }), _jsxs("div", { className: "space-y-2", children: [rules.map((rule) => {
                            const sourceAgent = agents.find((a) => a.id === rule.sourceId);
                            const targetAgent = agents.find((a) => a.id === rule.targetId);
                            if (!sourceAgent || !targetAgent)
                                return null;
                            return (_jsxs("div", { className: "flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded", children: [_jsxs("span", { children: [sourceAgent.name, " \u27A1\uFE0F ", targetAgent.name] }), _jsx("button", { onClick: () => deleteRule(rule.id), className: "text-red-500 hover:text-red-700", children: _jsx(DeleteIcon, {}) })] }, rule.id));
                        }), rules.length === 0 && _jsx("p", { className: "text-center text-gray-500", children: "No rules defined." })] }), _jsx("div", { className: "flex justify-end mt-6", children: _jsx("button", { onClick: onClose, className: "px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg", children: "Close" }) })] }) }));
};
// Main MultiAgentChat Component
export const MultiAgentChat = ({ className = '', theme = 'auto', onSessionStart, onSessionEnd, onMessageSent, onAgentCreated, }) => {
    const { agents, messages, isLoading, createAgent, updateAgent, deleteAgent, sendMessage, automateAll, injectScenario, session, setMode, } = useMultiAgentChat();
    const [inputValue, setInputValue] = useState('');
    const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
    const [agentToEdit, setAgentToEdit] = useState();
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
    const [isFooterExpanded, setIsFooterExpanded] = useState(false);
    const [senderId, setSenderId] = useState('You');
    const [recipientAgentId, setRecipientAgentId] = useState('');
    const [conversationGoal, setConversationGoal] = useState('');
    const [mode, setLocalMode] = useState('manual');
    const [isAutomating, setIsAutomating] = useState(false);
    const messagesEndRef = useRef(null);
    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    // Set initial recipient when agents change
    useEffect(() => {
        if (agents.length > 0 && !recipientAgentId) {
            setRecipientAgentId(agents[0].id);
        }
    }, [agents, recipientAgentId]);
    const handleSendMessage = async () => {
        if (!inputValue.trim())
            return;
        const messageText = inputValue;
        setInputValue('');
        await sendMessage(messageText, senderId, recipientAgentId);
        onMessageSent?.({
            id: `temp-${Date.now()}`,
            text: messageText,
            sender: senderId,
            timestamp: new Date(),
        });
    };
    const handleCreateAgent = async (agentData) => {
        await createAgent(agentData);
        onAgentCreated?.(agentData);
        setIsAgentModalOpen(false);
        setAgentToEdit(undefined);
    };
    const handleUpdateAgent = async (agentData) => {
        if (agentToEdit) {
            await updateAgent(agentToEdit.id, agentData);
            setIsAgentModalOpen(false);
            setAgentToEdit(undefined);
        }
    };
    const handleAutomateAll = async () => {
        setIsAutomating(true);
        try {
            await automateAll();
            setLocalMode('auto');
            setMode('auto');
        }
        finally {
            setIsAutomating(false);
        }
    };
    const handleScenarioSend = async (scenario) => {
        setIsScenarioModalOpen(false);
        await injectScenario(scenario);
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 text-white", children: "Loading Multi-Agent Chat..." }));
    }
    return (_jsxs("div", { className: `grid grid-rows-[auto_1fr_auto] h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans ${className}`, children: [isAutomating && (_jsxs("div", { className: "fixed inset-0 bg-black bg-opacity-75 flex flex-col justify-center items-center z-50", children: [_jsx("div", { className: "w-16 h-16 border-8 border-dashed rounded-full animate-spin border-blue-500" }), _jsx("p", { className: "text-white text-xl mt-4", children: "Automating Setup..." })] })), _jsx(AgentModal, { isOpen: isAgentModalOpen, agent: agentToEdit, onClose: () => {
                    setIsAgentModalOpen(false);
                    setAgentToEdit(undefined);
                }, onSave: agentToEdit ? handleUpdateAgent : handleCreateAgent }), _jsx(ScenarioModal, { isOpen: isScenarioModalOpen, onClose: () => setIsScenarioModalOpen(false), onSend: handleScenarioSend }), _jsx(RulesModal, { isOpen: isRuleModalOpen, onClose: () => setIsRuleModalOpen(false) }), _jsx("header", { className: "bg-white dark:bg-gray-800 shadow-sm p-3 z-10", children: _jsxs("div", { className: "flex items-center gap-3 overflow-x-auto pb-2", children: [agents.map((agent) => (_jsx(AgentTag, { agent: agent, onEdit: () => {
                                setAgentToEdit(agent);
                                setIsAgentModalOpen(true);
                            }, onDelete: () => deleteAgent(agent.id) }, agent.id))), _jsx("button", { onClick: () => {
                                setAgentToEdit(undefined);
                                setIsAgentModalOpen(true);
                            }, className: "flex-shrink-0 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600", children: "+" }), _jsx("button", { onClick: handleAutomateAll, disabled: isAutomating, className: "flex-shrink-0 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:bg-purple-400", children: "\uD83D\uDE80 Automate" }), _jsx("button", { onClick: () => setIsRuleModalOpen(true), className: "flex-shrink-0 px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600", children: "Rules" }), _jsx("button", { onClick: () => setIsScenarioModalOpen(true), className: "flex-shrink-0 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600", children: "\u2728 Inject" }), _jsx("input", { type: "text", placeholder: "Set Goal...", value: conversationGoal, onChange: (e) => setConversationGoal(e.target.value), className: "p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-medium", children: "Mode:" }), _jsx("button", { onClick: () => {
                                        const newMode = mode === 'manual' ? 'auto' : 'manual';
                                        setLocalMode(newMode);
                                        setMode(newMode);
                                    }, className: `px-3 py-1 rounded-full text-sm ${mode === 'auto' ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-600'}`, children: mode === 'auto' ? 'Auto' : 'Manual' })] })] }) }), _jsxs("main", { className: "p-4 overflow-y-auto flex flex-col space-y-4", children: [messages.map((msg) => (_jsx(MessageBubble, { message: msg, agents: agents }, msg.id))), _jsx("div", { ref: messagesEndRef })] }), _jsxs("footer", { className: "bg-white dark:bg-gray-800 shadow-inner", children: [_jsx("div", { className: `transition-all duration-300 ease-in-out overflow-hidden ${isFooterExpanded ? 'max-h-40' : 'max-h-0'}`, children: _jsxs("div", { className: "p-2 border-b border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "sender-select", className: "text-xs text-gray-500", children: "From:" }), _jsxs("select", { id: "sender-select", value: senderId, onChange: (e) => setSenderId(e.target.value), disabled: agents.length === 0, className: "w-full p-2 border bg-transparent border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 text-sm", children: [_jsx("option", { value: "You", children: "You" }), agents.map((agent) => (_jsx("option", { value: agent.id, children: agent.name }, agent.id)))] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "recipient-select", className: "text-xs text-gray-500", children: "To:" }), _jsx("select", { id: "recipient-select", value: recipientAgentId, onChange: (e) => setRecipientAgentId(e.target.value), disabled: agents.length === 0, className: "w-full p-2 border bg-transparent border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 text-sm", children: agents.map((agent) => (_jsx("option", { value: agent.id, children: agent.name }, agent.id))) })] })] }) }), _jsxs("div", { className: "flex items-center space-x-2 p-2", children: [_jsx("button", { onClick: () => setIsFooterExpanded(!isFooterExpanded), className: "p-2 text-gray-500 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full", children: _jsx(SettingsIcon, {}) }), _jsx("div", { className: "flex-1 relative", children: _jsx("input", { id: "message-input", type: "text", value: inputValue, onChange: (e) => setInputValue(e.target.value), onKeyPress: (e) => e.key === 'Enter' && handleSendMessage(), placeholder: "Type a message...", className: "w-full p-2 pr-10 border bg-transparent border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:border-blue-500" }) }), _jsx("button", { onClick: handleSendMessage, className: "p-3 bg-blue-500 text-white rounded-full self-end disabled:bg-gray-400 hover:bg-blue-600", disabled: !inputValue.trim(), children: _jsx("svg", { className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 12h14M12 5l7 7-7 7" }) }) })] })] })] }));
};
