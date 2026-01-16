import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import app from '../lib/firebase';

// --- App Context ---
const AppContext = createContext();

// --- Icons ---
const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);
const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);
const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);
const SystemIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
      fill="currentColor"
    />
  </svg>
);

// --- Helper Functions ---
const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- Main Component ---
export default function MultiAgentChat() {
  return (
    <AppProvider>
      <AppUI />
    </AppProvider>
  );
}

// --- UI Components ---
const Splash = () => (
  <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-900 text-white">
    <div className="w-20 h-20 border-8 border-dashed rounded-full animate-spin border-blue-500 mb-6"></div>
    <h1 className="text-3xl font-bold mb-2">Multi-Agent Chat</h1>
    <p className="text-gray-400">Initializing session...</p>
  </div>
);

const AppUI = () => {
  const {
    agents,
    messages,
    isDataLoading,
    isAutomating,
    inputValue,
    setInputValue,
    handleSendMessage,
    handleAutomateAll,
    mode,
    setMode,
    conversationGoal,
    setConversationGoal,
    isAgentModalOpen,
    setIsAgentModalOpen,
    agentToEdit,
    setAgentToEdit,
    handleAddAgent,
    handleUpdateAgent,
    handleRemoveAgent,
  } = useContext(AppContext);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const MessageBubble = ({ msg }) => {
    const isYou = msg.sender === 'You';
    const isSystem = msg.sender === 'system';
    const bubbleClass = cn(
      'p-4 rounded-xl shadow-md',
      isYou && 'bg-blue-500 text-white',
      isSystem && 'bg-gray-500 text-white text-center text-xs italic',
      !isYou && !isSystem && 'bg-white dark:bg-gray-700'
    );

    return (
      <div
        className={cn('flex items-start gap-3 max-w-xl w-full', isYou ? 'self-end' : 'self-start')}
      >
        <div className={bubbleClass}>
          {!isYou && !isSystem && <div className="font-bold mb-1">{msg.sender}</div>}
          <p className="whitespace-pre-wrap wrap-break-word">{msg.text}</p>
        </div>
      </div>
    );
  };

  const AgentModal = ({ isOpen, onClose, onSave, onUpdate }) => {
    if (!isOpen) return null;
    const [name, setName] = useState(agentToEdit?.name || '');
    const [systemPrompt, setSystemPrompt] = useState(agentToEdit?.systemPrompt || '');

    const handleSubmit = (e) => {
      e.preventDefault();
      const agentData = { name, systemPrompt, llm: 'gemini', model: 'gemini-1.5-flash-latest' };
      if (agentToEdit) {
        onUpdate(agentData);
      } else {
        onSave(agentData);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md"
        >
          <h2 className="text-xl font-bold mb-4">{agentToEdit ? 'Edit Agent' : 'Create Agent'}</h2>
          <div className="mb-4">
            <label className="block mb-1 font-semibold">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              required
              rows="4"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (isDataLoading) return <Splash />;

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      {isAutomating && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col justify-center items-center z-100">
          <div className="w-16 h-16 border-8 border-dashed rounded-full animate-spin border-blue-500"></div>
          <p className="text-white text-xl mt-4">Automating Setup...</p>
        </div>
      )}

      <AgentModal
        isOpen={isAgentModalOpen}
        onClose={() => {
          setIsAgentModalOpen(false);
          setAgentToEdit(null);
        }}
        onSave={handleAddAgent}
        onUpdate={handleUpdateAgent}
      />

      <header className="bg-white dark:bg-gray-800 shadow-sm p-3 z-10">
        <div className="flex items-center gap-4 pb-2">
          <button
            onClick={() => {
              setAgentToEdit(null);
              setIsAgentModalOpen(true);
            }}
            className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
          >
            + Add Agent
          </button>
          <button
            onClick={handleAutomateAll}
            disabled={isAutomating}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:bg-purple-400"
          >
            🚀 Automate
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
              onClick={() => setMode(mode === 'manual' ? 'auto' : 'manual')}
              className={`px-3 py-1 rounded-full text-sm ${mode === 'auto' ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              {mode === 'auto' ? 'Auto' : 'Manual'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-lg px-2 py-1"
              >
                <span className="text-sm">{agent.name}</span>
                <button
                  onClick={() => {
                    setAgentToEdit(agent);
                    setIsAgentModalOpen(true);
                  }}
                  className="text-gray-500 hover:text-blue-500"
                >
                  <EditIcon />
                </button>
                <button
                  onClick={() => handleRemoveAgent(agent.id)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <DeleteIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="p-4 overflow-y-auto flex flex-col space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-white dark:bg-gray-800 shadow-inner p-2">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="w-full p-2 border bg-transparent border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="p-3 bg-blue-500 text-white rounded-full disabled:bg-gray-400 hover:bg-blue-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
};

const AppProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [agents, setAgents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isAutomating, setIsAutomating] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentToEdit, setAgentToEdit] = useState(null);
  const [mode, setMode] = useState('manual');
  const [conversationGoal, setConversationGoal] = useState('');
  const appId = 'default-app-id';
  const collectionsRef = useRef({});

  // --- Firebase Initialization ---
  useEffect(() => {
    // Use the db instance imported from ../lib/firebase
    if (db) {
      setDb(db);
    }

    const firebaseAuth = getAuth(app);

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        try {
          await signInAnonymously(firebaseAuth);
        } catch (error) {
          console.error('Authentication failed:', error);
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // --- Data Fetching ---
  useEffect(() => {
    if (!isAuthReady || !db || !userId) return;

    collectionsRef.current = {
      agents: collection(db, 'artifacts', appId, 'users', userId, 'agents'),
      messages: collection(db, 'artifacts', appId, 'users', userId, 'messages'),
    };

    const unsubAgents = onSnapshot(query(collectionsRef.current.agents), (snapshot) => {
      setAgents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setIsDataLoading(false);
    });

    const unsubMessages = onSnapshot(query(collectionsRef.current.messages), (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      fetchedMessages.sort((a, b) => a.timestamp?.toDate() - b.timestamp?.toDate());
      if (fetchedMessages.length === 0) {
        setMessages([
          {
            id: 'welcome-msg',
            text: "Welcome! Create an AI agent or use 'Automate' to begin.",
            sender: 'system',
          },
        ]);
      } else {
        setMessages(fetchedMessages);
      }
    });

    return () => {
      unsubAgents();
      unsubMessages();
    };
  }, [isAuthReady, db, userId, appId]);

  const addMessageToDb = useCallback(async (message) => {
    if (!collectionsRef.current.messages) return;
    await addDoc(collectionsRef.current.messages, { ...message, timestamp: new Date() });
  }, []);

  const handleAddAgent = useCallback(async (agentData) => {
    if (collectionsRef.current.agents) {
      await addDoc(collectionsRef.current.agents, agentData);
      setIsAgentModalOpen(false);
    }
  }, []);

  const handleUpdateAgent = useCallback(
    async (agentData) => {
      if (agentToEdit && db && userId) {
        await updateDoc(
          doc(db, 'artifacts', appId, 'users', userId, 'agents', agentToEdit.id),
          agentData
        );
        setIsAgentModalOpen(false);
        setAgentToEdit(null);
      }
    },
    [agentToEdit, db, userId, appId]
  );

  const handleRemoveAgent = useCallback(
    async (agentId) => {
      if (!userId || !db) return;
      await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'agents', agentId));
    },
    [userId, db, appId]
  );

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;
    const userMessage = { text: inputValue, sender: 'You' };
    setInputValue('');
    await addMessageToDb(userMessage);

    // Simple echo response for demo
    if (agents.length > 0) {
      const agent = agents[0];
      setTimeout(async () => {
        await addMessageToDb({
          text: `Hello! I'm ${agent.name}. You said: "${userMessage.text}"`,
          sender: agent.name,
          agentId: agent.id,
        });
      }, 1000);
    }
  }, [inputValue, addMessageToDb, agents]);

  const handleAutomateAll = useCallback(async () => {
    setIsAutomating(true);
    try {
      // Clear existing data
      if (collectionsRef.current.agents && collectionsRef.current.messages) {
        const agentsSnapshot = await getDocs(collectionsRef.current.agents);
        const messagesSnapshot = await getDocs(collectionsRef.current.messages);

        const batch = writeBatch(db);
        agentsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
        messagesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }

      await addMessageToDb({ text: '🚀 Creating automated scenario...', sender: 'system' });

      // Create sample agents
      const agent1Data = {
        name: 'Alice',
        systemPrompt: 'You are Alice, a helpful assistant.',
        llm: 'gemini',
        model: 'gemini-1.5-flash-latest',
      };
      const agent2Data = {
        name: 'Bob',
        systemPrompt: 'You are Bob, a creative thinker.',
        llm: 'gemini',
        model: 'gemini-1.5-flash-latest',
      };

      await addDoc(collectionsRef.current.agents, agent1Data);
      await addDoc(collectionsRef.current.agents, agent2Data);

      setConversationGoal('Discuss interesting topics');
      setMode('auto');

      await addMessageToDb({
        text: 'Scenario created! Two agents are ready to chat.',
        sender: 'system',
      });
    } catch (error) {
      console.error('Automation failed:', error);
      await addMessageToDb({ text: `Automation failed: ${error.message}`, sender: 'system' });
    } finally {
      setIsAutomating(false);
    }
  }, [addMessageToDb, db]);

  const contextValue = {
    agents,
    messages,
    isDataLoading,
    isAutomating,
    inputValue,
    setInputValue,
    isAgentModalOpen,
    setIsAgentModalOpen,
    agentToEdit,
    setAgentToEdit,
    mode,
    setMode,
    conversationGoal,
    setConversationGoal,
    handleAddAgent,
    handleUpdateAgent,
    handleRemoveAgent,
    handleSendMessage,
    handleAutomateAll,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};
