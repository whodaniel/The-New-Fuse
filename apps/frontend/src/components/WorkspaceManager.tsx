Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceManager = WorkspaceManager;
import react_1 from 'react';
import EnhancedChatBubble_1 from '../chat/EnhancedChatBubble.js';
import ui_1 from '../ui.js';
import agent_llm_1 from '../../services/llm/agent-llm.js';
function WorkspaceManager({ workspace, user }) {
    const [activeThread, setActiveThread] = (0, react_1.useState)(null);
    const [message, setMessage] = (0, react_1.useState)('');
    const handleSendMessage = (0, react_1.useCallback)(async () => {
        if (!message.trim() || !activeThread)
            return;
        const newMessage = {
            id: crypto.randomUUID(),
            content: message.trim(),
            timestamp: new Date(),
            sender: {
                id: user.id,
                type: 'user',
                name: user.name,
            },
            metadata: {
                workspaceId: workspace.id,
                threadId: activeThread.id,
                llmProvider: workspace.llmConfig.defaultProvider,
            },
        };
        const updatedMessages = [...activeThread.messages, newMessage];
        setActiveThread((prev: any) => (Object.assign(Object.assign({}, prev), { messages: updatedMessages })));
        setMessage('');
        try {
            const activeAgent = workspace.agents[0];
            const agentLLM = agent_llm_1.AgentLLMService.getInstance();
            const response = await agentLLM.processAgentMessage(activeAgent, newMessage, updatedMessages);
            const agentMessage = {
                id: crypto.randomUUID(),
                content: response.content,
                timestamp: new Date(),
                sender: {
                    id: activeAgent.id,
                    type: 'agent',
                    name: activeAgent.name,
                },
                metadata: Object.assign({ workspaceId: workspace.id, threadId: activeThread.id, llmProvider: activeAgent.llmConfig.provider }, response.metadata),
            };
            setActiveThread((prev: any) => (Object.assign(Object.assign({}, prev), { messages: [...prev.messages, agentMessage] })));
        }
        catch (error) {
            console.error('Error processing message:', error);
            const errorMessage = {
                id: crypto.randomUUID(),
                content: 'Sorry, I encountered an error processing your message.',
                timestamp: new Date(),
                sender: {
                    id: 'system',
                    type: 'system',
                    name: 'System',
                },
                metadata: {
                    workspaceId: workspace.id,
                    threadId: activeThread.id,
                    llmProvider: workspace.llmConfig.defaultProvider,
                    error: true,
                },
            };
            setActiveThread((prev: any) => (Object.assign(Object.assign({}, prev), { messages: [...prev.messages, errorMessage] })));
        }
    }, [message, activeThread, user, workspace]);
    return (<div className="flex h-full">
      
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold mb-4">Threads</h2>
        {workspace.threads.map(thread => (<ui_1.Button key={thread.id} variant={(activeThread === null || activeThread === void 0 ? void 0 : activeThread.id) === thread.id ? 'primary' : 'secondary'} onClick={() => setActiveThread(thread)} className="w-full mb-2">
            {thread.name}
          </ui_1.Button>))}
      </div>

      <div className="flex-1 flex flex-col">
        {activeThread ? (<>
            <div className="flex-1 overflow-y-auto p-4">
              {activeThread.messages.map(messag(e: any) => (<EnhancedChatBubble_1.EnhancedChatBubble key={message.id} message={message} agents={workspace.agents} workspace={workspace}/>))}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input type="text" value={message} onChange={(e: any) => setMessage(e.target.value)} className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 p-2" placeholder="Type your message..."/>
                <ui_1.Button onClick={handleSendMessage}>Send</ui_1.Button>
              </div>
            </div>
          </>) : (<div className="flex-1 flex items-center justify-center">
            <ui_1.Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Select a Thread</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a thread from the sidebar to start chatting
              </p>
            </ui_1.Card>
          </div>)}
      </div>
    </div>);
}
export {};
//# sourceMappingURL=WorkspaceManager.js.map