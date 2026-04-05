import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
// Create context
const ChatContext = createContext(null);
// Custom hook to use chat context
export const useMultiAgentChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useMultiAgentChat must be used within a MultiAgentChatProvider');
    }
    return context;
};
// Icons as React components
const EditIcon = () => (_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" }) }));
const DeleteIcon = () => (_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("polyline", { points: "3 6 5 6 21 6" }), _jsx("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }), _jsx("line", { x1: "10", y1: "11", x2: "10", y2: "17" }), _jsx("line", { x1: "14", y1: "11", x2: "14", y2: "17" })] }));
const SettingsIcon = () => (_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "12", cy: "12", r: "3" }), _jsx("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" })] }));
const SystemIcon = () => (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z", fill: "currentColor" }) }));
// Provider details with icons
const providerDetails = {
    gemini: { icon: () => _jsx("span", { children: "\u2728" }), name: "Google Gemini" },
    openai: { icon: () => _jsx("span", { children: "\uD83E\uDD16" }), name: "OpenAI GPT" },
    anthropic: { icon: () => _jsx("span", { children: "\uD83E\uDDE0" }), name: "Anthropic Claude" },
    cohere: { icon: () => _jsx("span", { children: "\uD83D\uDD2E" }), name: "Cohere" },
    sambanova: { icon: () => _jsx("span", { children: "\u26A1" }), name: "SambaNova" },
    deepseek: { icon: () => _jsx("span", { children: "\uD83D\uDD0D" }), name: "DeepSeek" },
    mistral: { icon: () => _jsx("span", { children: "\uD83C\uDF2A\uFE0F" }), name: "Mistral" },
    openrouter: { icon: () => _jsx("span", { children: "\uD83D\uDEE3\uFE0F" }), name: "OpenRouter" },
    'claude-code-cli': { icon: () => _jsx("span", { children: "\uD83D\uDCBB" }), name: "Claude Code CLI (Local)" }
};
// Multi-Agent Chat Provider Component
export const MultiAgentChatProvider = ({ children, firebaseService, llmService, userId }) => {
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [agents, setAgents] = useState([]);
    const [messages, setMessages] = useState([]);
    const [rules, setRules] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(userId || null);
    // Initialize authentication and data subscriptions
    useEffect(() => {
        const initializeChat = async () => {
            try {
                setIsLoading(true);
                // Authenticate user if not provided
                if (!currentUserId) {
                    const user = await firebaseService.authenticateUser();
                    setCurrentUserId(user.uid);
                }
                if (currentUserId) {
                    // Set up real-time subscriptions
                    const unsubscribeAgents = firebaseService.subscribeToAgents(currentUserId, setAgents);
                    const unsubscribeMessages = firebaseService.subscribeToMessages(currentUserId, (msgs) => {
                        if (msgs.length === 0) {
                            setMessages([{
                                    id: 'welcome-msg',
                                    text: "Welcome! Create an AI agent or use 'Automate All' to begin.",
                                    sender: 'system',
                                    timestamp: new Date()
                                }]);
                        }
                        else {
                            setMessages(msgs);
                        }
                    });
                    const unsubscribeRules = firebaseService.subscribeToRules(currentUserId, setRules);
                    // Cleanup subscriptions
                    return () => {
                        unsubscribeAgents();
                        unsubscribeMessages();
                        unsubscribeRules();
                    };
                }
            }
            catch (err) {
                console.error('Failed to initialize chat:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            }
            finally {
                setIsLoading(false);
            }
        };
        initializeChat();
    }, [currentUserId, firebaseService]);
    // Chat context value
    const contextValue = {
        session,
        isLoading,
        error,
        agents,
        messages,
        rules,
        // Agent management
        createAgent: useCallback(async (agentData) => {
            if (!currentUserId)
                throw new Error('User not authenticated');
            await firebaseService.createAgent(currentUserId, agentData);
        }, [currentUserId, firebaseService]),
        updateAgent: useCallback(async (id, updates) => {
            if (!currentUserId)
                throw new Error('User not authenticated');
            await firebaseService.updateAgent(currentUserId, id, updates);
        }, [currentUserId, firebaseService]),
        deleteAgent: useCallback(async (id) => {
            if (!currentUserId)
                throw new Error('User not authenticated');
            await firebaseService.deleteAgent(currentUserId, id);
        }, [currentUserId, firebaseService]),
        // Message management
        sendMessage: useCallback(async (text, senderId, recipientId) => {
            if (!currentUserId)
                throw new Error('User not authenticated');
            const senderAgent = senderId && senderId !== 'You' ? agents.find(a => a.id === senderId) : null;
            const senderName = senderAgent ? senderAgent.name : "You";
            // Add user message
            await firebaseService.addMessage(currentUserId, {
                text,
                sender: senderName,
                agentId: senderId !== 'You' ? senderId : undefined
            });
            // Generate bot response if recipient is specified
            if (recipientId) {
                const respondingAgent = agents.find(a => a.id === recipientId);
                if (respondingAgent) {
                    try {
                        const history = messages.slice(-5).map(m => `${m.sender}: ${m.text}`).join('\n');
                        const prompt = `Previous conversation:\n${history}\n\nNew message from ${senderName}:\n"${text}"\n\nYour turn, ${respondingAgent.name}. What is your response?`;
                        const botText = await llmService.callTextAPI(prompt, respondingAgent.systemPrompt, respondingAgent.llm, respondingAgent.model);
                        await firebaseService.addMessage(currentUserId, {
                            text: botText || `(${respondingAgent.name} had no response)`,
                            sender: respondingAgent.name,
                            llm: respondingAgent.llm,
                            agentId: respondingAgent.id
                        });
                    }
                    catch (error) {
                        console.error(`Error with ${respondingAgent.name}:`, error);
                        await firebaseService.addMessage(currentUserId, {
                            text: `Error generating response for ${respondingAgent.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            sender: 'system'
                        });
                    }
                }
            }
        }, [currentUserId, firebaseService, llmService, agents, messages]),
        clearMessages: useCallback(async () => {
            if (!currentUserId)
                throw new Error('User not authenticated');
            await firebaseService.clearMessages(currentUserId);
        }, [currentUserId, firebaseService]),
        // Rule management
        createRule: useCallback(async (rule) => {
            if (!currentUserId)
                throw new Error('User not authenticated');
            await firebaseService.createRule(currentUserId, rule);
        }, [currentUserId, firebaseService]),
        updateRule: useCallback(async (id, updates) => {
            if (!currentUserId)
                throw new Error('User not authenticated');
            await firebaseService.updateRule(currentUserId, id, updates);
        }, [currentUserId, firebaseService]),
        deleteRule: useCallback(async (id) => {
            if (!currentUserId)
                throw new Error('User not authenticated');
            await firebaseService.deleteRule(currentUserId, id);
        }, [currentUserId, firebaseService]),
        // Session management
        startSession: useCallback(async (goal) => {
            if (!currentUserId)
                throw new Error('User not authenticated');
            const newSession = {
                id: `session-${Date.now()}`,
                userId: currentUserId,
                agents,
                messages,
                rules,
                state: {
                    goal: goal || '',
                    mode: 'manual',
                    isActive: true,
                    turnCount: 0,
                    startedAt: new Date(),
                    lastActivity: new Date()
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };
            setSession(newSession);
        }, [currentUserId, agents, messages, rules]),
        stopSession: useCallback(async () => {
            setSession(null);
        }, []),
        setMode: useCallback((mode) => {
            if (session) {
                setSession({
                    ...session,
                    state: { ...session.state, mode }
                });
            }
        }, [session]),
        setGoal: useCallback((goal) => {
            if (session) {
                setSession({
                    ...session,
                    state: { ...session.state, goal }
                });
            }
        }, [session]),
        // Automation
        automateAll: useCallback(async () => {
            if (!currentUserId)
                throw new Error('User not authenticated');
            try {
                await firebaseService.addMessage(currentUserId, {
                    text: '🚀 Clearing previous session and starting full automation...',
                    sender: 'system'
                });
                // Clear all data
                await firebaseService.clearAllData(currentUserId);
                await firebaseService.addMessage(currentUserId, {
                    text: 'Generating new scenario, characters, and rules...',
                    sender: 'system'
                });
                // Generate scenario using LLM
                const setupPrompt = `Create a complete setup for a multi-agent chat application. The theme should be interesting and creative (e.g., historical figures debating, sci-fi characters on a mission, fantasy creatures in a tavern). Provide your response as a single JSON object with the following keys: "conversationGoal" (string), "initialScenario" (string), "agents" (an array of exactly two agent objects, each with "name" and "systemPrompt"), and "rules" (an array of rule objects, each with "sourceIndex" and "targetIndex" corresponding to the agents array, creating a simple loop like 0->1 and 1->0).`;
                const setupJson = await llmService.callTextAPI(setupPrompt, "You are a creative scenario designer...", "gemini", "gemini-2.0-flash", undefined, { responseMimeType: "application/json" });
                const setup = JSON.parse(setupJson);
                // Create agents
                const createdAgentIds = [];
                for (const agentData of setup.agents) {
                    if (agentData?.systemPrompt && agentData?.name) {
                        // Generate profile picture
                        const picPrompt = `Create a profile picture for an AI character. It should be a simple, clean, cartoon-style portrait. Character persona: "${agentData.systemPrompt}"`;
                        try {
                            const imageResponse = await llmService.generateImage({ prompt: picPrompt });
                            const agentId = await firebaseService.createAgent(currentUserId, {
                                ...agentData,
                                llm: 'gemini',
                                model: 'gemini-2.0-flash',
                                profilePictureUrl: imageResponse.url,
                                isActive: true
                            });
                            createdAgentIds.push(agentId);
                        }
                        catch (imageError) {
                            console.warn('Failed to generate profile picture:', imageError);
                            const agentId = await firebaseService.createAgent(currentUserId, {
                                ...agentData,
                                llm: 'gemini',
                                model: 'gemini-2.0-flash',
                                isActive: true
                            });
                            createdAgentIds.push(agentId);
                        }
                    }
                }
                // Create rules
                if (Array.isArray(setup.rules)) {
                    for (const rule of setup.rules) {
                        if (typeof rule.sourceIndex === 'number' && typeof rule.targetIndex === 'number') {
                            const sourceId = createdAgentIds[rule.sourceIndex];
                            const targetId = createdAgentIds[rule.targetIndex];
                            if (sourceId && targetId) {
                                await firebaseService.createRule(currentUserId, {
                                    sourceId,
                                    targetId,
                                    priority: 1,
                                    isActive: true
                                });
                            }
                        }
                    }
                }
                await firebaseService.addMessage(currentUserId, {
                    text: `Scenario Injected: "${setup.initialScenario}"`,
                    sender: 'system'
                });
                await firebaseService.addMessage(currentUserId, {
                    text: 'Starting conversation...',
                    sender: 'system'
                });
            }
            catch (error) {
                console.error("Automation failed:", error);
                if (currentUserId) {
                    await firebaseService.addMessage(currentUserId, {
                        text: `Full automation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        sender: 'system'
                    });
                }
            }
        }, [currentUserId, firebaseService, llmService]),
        injectScenario: useCallback(async (scenario) => {
            if (!currentUserId)
                throw new Error('User not authenticated');
            await firebaseService.addMessage(currentUserId, {
                text: `Scenario Injected: "${scenario}"`,
                sender: 'system'
            });
            if (agents.length > 0) {
                const firstAgent = agents[0];
                await firebaseService.addMessage(currentUserId, {
                    text: 'Starting conversation based on new scenario...',
                    sender: 'system'
                });
                try {
                    const initialPrompt = `As ${firstAgent.name}, start a new conversation based on this scenario: "${scenario}"`;
                    const response = await llmService.callTextAPI(initialPrompt, firstAgent.systemPrompt, firstAgent.llm, firstAgent.model);
                    await firebaseService.addMessage(currentUserId, {
                        text: response,
                        sender: firstAgent.name,
                        agentId: firstAgent.id,
                        llm: firstAgent.llm
                    });
                }
                catch (error) {
                    console.error('Failed to generate initial response:', error);
                }
            }
        }, [currentUserId, firebaseService, llmService, agents]),
        // Image generation
        generateImage: useCallback(async (request) => {
            return await llmService.generateImage(request);
        }, [llmService])
    };
    return (_jsx(ChatContext.Provider, { value: contextValue, children: children }));
};
export { EditIcon, DeleteIcon, SettingsIcon, SystemIcon, providerDetails };
