import React, { useState, useEffect, useRef } from 'react';
import { useMultiAgentChat, EditIcon, DeleteIcon, SystemIcon, providerDetails } from './MultiAgentChatProvider';
// Agent Tag Component
const AgentTag = ({ agent, onEdit, onDelete }) => (<div className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-full pr-3 pl-1 py-1">
    <img src={agent.profilePictureUrl || 'https://placehold.co/32x32/667eea/ffffff?text=A'} alt={agent.name} className="w-8 h-8 rounded-full object-cover"/>
    <span className="font-medium text-sm">{agent.name}</span>
    <button onClick={onEdit} className="text-gray-500 hover:text-blue-500">
      <EditIcon />
    </button>
    <button onClick={onDelete} className="text-gray-500 hover:text-red-500">
      <DeleteIcon />
    </button>
  </div>);
// Message Bubble Component
const MessageBubble = ({ message, agents }) => {
    const agent = message.agentId ? agents.find(a => a.id === message.agentId) : null;
    const Icon = message.sender === 'system' ? SystemIcon :
        (agent && providerDetails[agent.llm]) ?
            providerDetails[agent.llm].icon : null;
    const isYou = message.sender === 'You';
    const isSystem = message.sender === 'system';
    const bubbleClass = isYou
        ? 'bg-blue-500 text-white self-end'
        : isSystem
            ? 'bg-gray-500 text-white self-center text-center text-xs italic'
            : 'bg-white dark:bg-gray-700 self-start';
    return (<div className={`flex items-start gap-3 max-w-xl w-full ${isYou ? 'self-end flex-row-reverse' : 'self-start'}}>
      {!isYou && !isSystem && (
        <img 
          src={agent?.profilePictureUrl || 'https://placehold.co/40x40/7c3aed/ffffff?text=A'} 
          alt={message.sender} 
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
      )}
      {isSystem && (
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
          <SystemIcon />
        </div>
      )}
      `
            < div} className={p - 4} rounded-xl shadow-md $ {...bubbleClass}/>) `>
        {!isYou && !isSystem && (
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold">{message.sender}</span>
            {Icon && <Icon />}
          </div>
        )}
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
      </div>
    </div>
  );
};

// Agent Modal Component
const AgentModal: React.FC<{
  isOpen: boolean;
  agent?: Agent;
  onClose: () => void;
  onSave: (agentData: any) => void;
}> = ({ isOpen, agent, onClose, onSave }) => {
  const [name, setName] = useState(agent?.name || '');
  const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt || '');
  const [llm, setLlm] = useState(agent?.llm || 'gemini');
  const [model, setModel] = useState(agent?.model || 'gemini-2.0-flash');
  const [profilePictureUrl, setProfilePictureUrl] = useState(agent?.profilePictureUrl || null);
  const [isGeneratingPic, setIsGeneratingPic] = useState(false);
  const [picError, setPicError] = useState('');

  const { generateImage } = useMultiAgentChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, systemPrompt, llm, model, profilePictureUrl });
    onClose();
  };

  const generatePicture = async () => {
    if (!systemPrompt.trim()) {
      setPicError("Please define a system prompt for the character first.");
      return;
    }
    
    setPicError('');
    setIsGeneratingPic(true);
    
    try {
      const picPrompt = `;
    Create;
    a;
    profile;
    picture;
    for (an; AI; character.It)
        should;
    be;
    a;
    simple, clean, cartoon - style;
    portrait.Character;
    persona: "${systemPrompt}";
    const response = await generateImage({ prompt: picPrompt });
    setProfilePictureUrl(response.url);
};
try { }
catch (error) {
    console.error("Profile picture generation failed:", error);
    setPicError("Couldn't generate a picture. Please try again.");
}
setIsGeneratingPic(false);
;
if (!isOpen)
    return null;
return (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{agent ? "Edit Agent" : "Create Agent"}</h2>
        
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
        </div>
        
        <div className="mb-4">
          <label className="block mb-1 font-semibold">System Prompt (Persona)</label>
          <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} required rows={4} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
        </div>
        
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Profile Picture</label>
          <div className="flex items-center gap-4">
            <img src={profilePictureUrl || 'https://placehold.co/80x80/1f2937/ffffff?text=...'} alt="Profile" className="w-20 h-20 rounded-full object-cover bg-gray-200 dark:bg-gray-700"/>
            <button type="button" onClick={generatePicture} disabled={isGeneratingPic} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400">
              {isGeneratingPic ? 'Generating...' : 'Generate New'}
            </button>
          </div>
          {picError && <p className="text-red-500 text-sm mt-2">{picError}</p>}
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-semibold">LLM Provider</label>
          <select value={llm} onChange={e => setLlm(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
            {Object.entries(providerDetails).map(([key, { name }]) => (<option key={key} value={key}>{name}</option>))}
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block mb-1 font-semibold">Model Name</label>
          <input type="text" value={model} onChange={e => setModel(e.target.value)} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="e.g., gemini-2.0-flash"/>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Save
          </button>
        </div>
      </form>
    </div>);
;
// Scenario Modal Component
const ScenarioModal = ({ isOpen, onClose, onSend }) => {
    const [text, setText] = useState('');
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Inject Scenario</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Describe a situation or topic to make the agents discuss it. This will clear the current context and start a new conversation.
        </p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="e.g., You are all trying to decide where to go for dinner..."/>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg">
            Cancel
          </button>
          <button onClick={() => onSend(text)} disabled={!text.trim()} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-red-400">
            Send Scenario
          </button>
        </div>
      </div>
    </div>);
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
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Conversation Rules</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Define who talks after whom. This is used for 'auto' mode.
        </p>
        
        <form onSubmit={handleAddRule} className="flex items-center gap-2 mb-4">
          <select name="source" required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
            {agents.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
          </select>
          <span>➡️</span>
          <select name="target" required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
            {agents.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
          </select>
          <button type="submit" className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            +
          </button>
        </form>

        <div className="space-y-2">
          {rules.map(rule => {
            const sourceAgent = agents.find(a => a.id === rule.sourceId);
            const targetAgent = agents.find(a => a.id === rule.targetId);
            if (!sourceAgent || !targetAgent)
                return null;
            return (<div key={rule.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
                <span>{sourceAgent.name} ➡️ {targetAgent.name}</span>
                <button onClick={() => deleteRule(rule.id)} className="text-red-500 hover:text-red-700">
                  <DeleteIcon />
                </button>
              </div>);
        })}
          {rules.length === 0 && (<p className="text-center text-gray-500">No rules defined.</p>)}
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg">
            Close
          </button>
        </div>
      </div>
    </div>);
};
// Main MultiAgentChat Component
export const MultiAgentChat = ({ className = "", theme = "auto", onSessionStart, onSessionEnd, onMessageSent, onAgentCreated }) => {
    const { agents, messages, isLoading, createAgent, updateAgent, deleteAgent, sendMessage, automateAll, injectScenario, session, setMode } = useMultiAgentChat();
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
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        onMessageSent?.({} `
      id: temp-${Date.now()}`, content, messageText, text, messageText, senderId, senderId, timestamp, new Date(), type, 'user');
    };
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
    return (<div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 text-white">
        Loading Multi-Agent Chat...
      </div>);
}
return (<div className={`grid grid-rows-[auto_1fr_auto] h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans ${className}}>
      {isAutomating && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col justify-center items-center z-50">
          <div className="w-16 h-16 border-8 border-dashed rounded-full animate-spin border-blue-500"></div>
          <p className="text-white text-xl mt-4">Automating Setup...</p>
        </div>
      )}

      <AgentModal 
        isOpen={isAgentModalOpen} 
        agent={agentToEdit}
        onClose={() => { 
          setIsAgentModalOpen(false); 
          setAgentToEdit(undefined); 
        }} 
        onSave={agentToEdit ? handleUpdateAgent : handleCreateAgent}
      />
      
      <ScenarioModal 
        isOpen={isScenarioModalOpen} 
        onClose={() => setIsScenarioModalOpen(false)} 
        onSend={handleScenarioSend} 
      />
      
      <RulesModal 
        isOpen={isRuleModalOpen} 
        onClose={() => setIsRuleModalOpen(false)} 
      />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm p-3 z-10">
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {agents.map(agent => (
            <AgentTag 
              key={agent.id} 
              agent={agent} 
              onEdit={() => { 
                setAgentToEdit(agent); 
                setIsAgentModalOpen(true); 
              }}
              onDelete={() => deleteAgent(agent.id)}
            />
          ))}
          <button 
            onClick={() => { 
              setAgentToEdit(undefined); 
              setIsAgentModalOpen(true); 
            }} 
            className="flex-shrink-0 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
          >
            +
          </button>
          <button 
            onClick={handleAutomateAll} 
            disabled={isAutomating} 
            className="flex-shrink-0 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:bg-purple-400"
          >
            🚀 Automate
          </button>
          <button 
            onClick={() => setIsRuleModalOpen(true)} 
            className="flex-shrink-0 px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600"
          >
            Rules
          </button>
          <button 
            onClick={() => setIsScenarioModalOpen(true)} 
            className="flex-shrink-0 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
          >
            ✨ Inject
          </button>
          <input 
            type="text" 
            placeholder="Set Goal..." 
            value={conversationGoal} 
            onChange={(e) => setConversationGoal(e.target.value)} 
            className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Mode:</span>
            <button 
              onClick={() => {
                const newMode = mode === 'manual' ? 'auto' : 'manual';
                setLocalMode(newMode);
                setMode(newMode);
              }} 
              className={px-3 py-1 rounded-full text-sm ${mode === 'auto' ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-600'}}
            >
              {mode === 'auto' ? 'Auto' : 'Manual'}
            </button>
          </div>
        </div>
      </header>
      
      {/* Messages */}
      <main className="p-4 overflow-y-auto flex flex-col space-y-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} agents={agents} />
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Footer */}`
        < footer} className="bg-white dark:bg-gray-800 shadow-inner">`
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFooterExpanded ? 'max-h-40' : 'max-h-0'}}` >
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sender-select" className="text-xs text-gray-500">From:</label>
              <select id="sender-select" value={senderId} onChange={e => setSenderId(e.target.value)} disabled={agents.length === 0} className="w-full p-2 border bg-transparent border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 text-sm">
                <option value="You">You</option>
                {agents.map(agent => (<option key={agent.id} value={agent.id}>{agent.name}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="recipient-select" className="text-xs text-gray-500">To:</label>
              <select id="recipient-select" value={recipientAgentId} onChange={e => setRecipientAgentId(e.target.value)} disabled={agents.length === 0} className="w-full p-2 border bg-transparent border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 text-sm">
                {agents.map(agent => (<option key={agent.id} value={agent.id}>{agent.name}</option>))}
              </select>
            </div>
          </div>}/>
        </div>
    ,
        <div className="flex items-center space-x-2 p-2">
          <button onClick={() => setIsFooterExpanded(!isFooterExpanded)} className="p-2 text-gray-500 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <SettingsIcon />
          </button>
          <div className="flex-1 relative">
            <input id="message-input" type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." className="w-full p-2 pr-10 border bg-transparent border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:border-blue-500"/>
          </div>
          <button onClick={handleSendMessage} className="p-3 bg-blue-500 text-white rounded-full self-end disabled:bg-gray-400 hover:bg-blue-600" disabled={!inputValue.trim()}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>);
footer >
;
div >
;
;
;
//# sourceMappingURL=MultiAgentChat.js.map