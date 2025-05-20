"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-check"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
crypto.randomUUID(),
    content;
message.trim(),
    timestamp;
new Date(),
    sender;
{
    id: user.id,
        type;
    'user',
        name;
    user.name,
    ;
}
metadata: {
    workspaceId: workspace.id,
        threadId;
    activeThread.id,
        llmProvider;
    workspace.llmConfig.defaultProvider,
    ;
}
;
const updatedMessages, user;
unknown;
{
    const [activeThread, setActiveThread] = require("react");
    import EnhancedChatBubble_1 from '../chat/EnhancedChatBubble.js';
    import ui_1 from '../ui.js';
    import agent_llm_1 from '../../services/llm/agent-llm';
    function WorkspaceManager({ workspace }) { }
    (0, react_1.useState);
    updatedMessages;
}
;
setMessage('');
try {
    const activeAgent;
    () => ,
        timestamp;
    new Date(),
        sender;
    {
        id: activeAgent.id,
            type;
        'agent',
            name;
        activeAgent.name,
        ;
    }
    metadata: Object.assign({ workspaceId: workspace.id, threadId: activeThread.id, llmProvider: activeAgent.llmConfig.provider }, response.metadata),
    ;
}
finally { }
;
setActiveThread(prev = (0, react_1.useCallback)(async () => , () => , () => {
    if (!message.trim() || !activeThread)
        return;
    const newMessage = {
        id, []: , ...activeThread.messages, newMessage
    };
    setActiveThread(prev => (Object.assign(Object.assign({}, prev), { messages, workspace, : .agents[0],
        const: agentLLM, []: , ...prev.messages, agentMessage })));
}));
try {
}
catch (error) {
    console.error('Error processing message:', error);
    crypto.randomUUID(),
        content;
    'Sorry, I encountered an error processing your message.',
        timestamp;
    new Date(),
        sender;
    {
        id: 'system',
            type;
        'system',
            name;
        'System',
        ;
    }
    metadata: {
        workspaceId: workspace.id,
            threadId;
        activeThread.id,
            llmProvider;
        workspace.llmConfig.defaultProvider,
            error;
        true,
        ;
    }
}
;
setActiveThread(prev = agent_llm_1.AgentLLMService.getInstance());
const response = await agentLLM.processAgentMessage(activeAgent, newMessage, updatedMessages);
const agentMessage = {
    id
} > (Object.assign(Object.assign({}, prev), { messages }, {
    id
} > (Object.assign(Object.assign({}, prev), { messages: [...prev.messages, errorMessage] }))));
[message, activeThread, user, workspace];
;
return className = "flex h-full" >
    className;
"w-64 border-r border-gray-200 dark:border-gray-700 p-4" >
    className;
"text-lg font-semibold mb-4" > Threads < /h2>;
{
    workspace.threads.map(thread => key = { thread, : .id }, variant = {}(activeThread === null || activeThread === void 0 ? void 0 : activeThread.id), 'secondary');
}
onClick = {}();
setActiveThread(thread);
className = "w-full mb-2" >
    { thread, : .name }
    < /ui_1.Button>;
/div>
    < div;
className = "flex-1 flex flex-col" >
    {} >
    className;
"flex-1 overflow-y-auto p-4" >
    { activeThread, : .messages.map(message => key = { message, : .id }, message = { message }, agents = { workspace, : .agents }, workspace = { workspace } /  > ), border } - gray - 700;
">
    < div;
className = "flex gap-2" >
    type;
"text";
value = { message };
onChange = { e, setMessage(e) { }, : .target.value, border } - gray - 600;
p - 2;
" placeholder=";
Type;
your;
message;
"/>
    < ui_1.Button;
onClick = { handleSendMessage } > Send < /ui_1.Button>
    < /div>
    < /div>
    < />;
className = "flex-1 flex items-center justify-center" >
    className;
"p-6" >
    className;
"text-lg font-semibold mb-2" > Select;
a;
Thread < /h3>
    < p;
className = "text-gray-600 dark:text-gray-400" >
    Choose;
a;
thread;
from;
the;
sidebar;
to;
start;
chatting
    < /p>
    < /ui_1.Card>
    < /div>;
/div>
    < /div>;
;
//# sourceMappingURL=WorkspaceManager.js.map
//# sourceMappingURL=WorkspaceManager.js.map