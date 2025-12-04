var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Bot, Sparkles, Users, Settings, ArrowLeft, Save, Wand2, Plus, Copy, RefreshCw, Zap, Terminal, Monitor, Cpu } from 'lucide-react';
// Import existing forms and services
import { NewAgentForm, agentFormSchema } from '@/components/forms/NewAgentForm';
import { chatApiService } from '@/services/chatApi';
import { agentService } from '@/services/agent';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui/toast';
import { AgentType } from '@/types/api';
export var UnifiedAgentCreator = function () {
    var navigate = useNavigate();
    var location = useLocation();
    var addToast = useToast().addToast;
    // Determine initial path based on URL params or state
    var _a = useState('choose'), currentPath = _a[0], setCurrentPath = _a[1];
    var _b = useState(1), step = _b[0], setStep = _b[1];
    // Advanced form setup
    var advancedForm = useForm({
        resolver: zodResolver(agentFormSchema),
        defaultValues: {
            name: '',
            type: undefined,
            description: '',
            capabilities: {
                code_generation: false,
                code_review: false,
                code_optimization: false,
                architecture_review: false,
                dependency_analysis: false,
                security_audit: false,
                documentation: false,
                test_generation: false,
                bug_analysis: false,
                performance_analysis: false,
                data_analysis: false,
                natural_language_processing: false,
                virtual_browser: false,
                web_automation: false,
                project_analysis: false,
                knowledge_graph: false,
                taxonomy_system: false,
                learning_system: false,
                agent_collaboration: false,
                communication_bus: false,
                protocol_handler: false,
            },
            metadata: {
                personalityTraits: [],
                communicationStyle: undefined,
                expertiseAreas: [],
                reasoningStrategies: [],
                skillDevelopment: {
                    currentLevel: 1,
                    targetLevel: 5,
                    learningPath: [],
                },
            },
            config: {},
        },
    });
    // AI-assisted creation state
    var _c = useState({
        description: '',
        context: '',
        agentCount: 3,
        complexity: 'moderate'
    }), conversationGoal = _c[0], setConversationGoal = _c[1];
    var _d = useState([]), agentSuggestions = _d[0], setAgentSuggestions = _d[1];
    var _e = useState(false), isGenerating = _e[0], setIsGenerating = _e[1];
    var _f = useState(new Set()), selectedSuggestions = _f[0], setSelectedSuggestions = _f[1];
    // Quick creation state
    var _g = useState({
        name: '',
        description: '',
        type: 'assistant',
        role: 'general'
    }), quickFormData = _g[0], setQuickFormData = _g[1];
    // Chat context data (from URL params or state)
    var _h = useState({}), chatContext = _h[0], setChatContext = _h[1];
    // Terminal window management state
    var _j = useState([]), terminalWindows = _j[0], setTerminalWindows = _j[1];
    var _k = useState('claude-code'), selectedTerminalType = _k[0], setSelectedTerminalType = _k[1];
    // Initialize based on how user arrived at this page
    useEffect(function () {
        var params = new URLSearchParams(location.search);
        var fromChat = params.get('from') === 'chat';
        var hasGoal = params.get('goal');
        var quickMode = params.get('quick') === 'true';
        if (fromChat) {
            setCurrentPath('from-chat');
            setChatContext({
                conversationHistory: params.get('history') || '',
                missingAgentType: params.get('needed') || '',
                suggestedName: params.get('name') || ''
            });
        }
        else if (hasGoal) {
            setCurrentPath('ai-assisted');
            setConversationGoal(function (prev) { return (__assign(__assign({}, prev), { description: hasGoal })); });
        }
        else if (quickMode) {
            setCurrentPath('quick');
        }
        else {
            setCurrentPath('choose');
        }
    }, [location]);
    // Generate AI agent suggestions
    var generateAgentSuggestions = function () { return __awaiter(void 0, void 0, void 0, function () {
        var suggestions;
        return __generator(this, function (_a) {
            setIsGenerating(true);
            try {
                suggestions = generateContextualSuggestions(conversationGoal);
                setAgentSuggestions(suggestions);
                setStep(2);
            }
            catch (error) {
                console.error('Error generating suggestions:', error);
                // Fallback suggestions
                setAgentSuggestions([
                    {
                        name: "Strategic Planner",
                        type: "specialist",
                        description: "Helps plan and organize complex tasks",
                        systemPrompt: "You are a strategic planning expert who helps break down complex goals into actionable steps.",
                        capabilities: ["Planning", "Analysis", "Organization"],
                        personalityTraits: ["Methodical", "Detail-oriented"],
                        role: "Planning and coordination"
                    },
                    {
                        name: "Creative Thinker",
                        type: "assistant",
                        description: "Generates innovative ideas and solutions",
                        systemPrompt: "You are a creative problem-solver who thinks outside the box and generates innovative solutions.",
                        capabilities: ["Ideation", "Problem-solving", "Innovation"],
                        personalityTraits: ["Creative", "Optimistic"],
                        role: "Idea generation and creative solutions"
                    },
                    {
                        name: "Research Analyst",
                        type: "specialist",
                        description: "Conducts thorough research and analysis",
                        systemPrompt: "You are a research expert who gathers information, analyzes data, and provides insights.",
                        capabilities: ["Research", "Analysis", "Data interpretation"],
                        personalityTraits: ["Analytical", "Thorough"],
                        role: "Information gathering and analysis"
                    }
                ]);
                setStep(2);
            }
            finally {
                setIsGenerating(false);
            }
            return [2 /*return*/];
        });
    }); };
    // Generate contextual suggestions based on user input
    var generateContextualSuggestions = function (goal) {
        var description = goal.description, context = goal.context, agentCount = goal.agentCount;
        var isMarketingGoal = description.toLowerCase().includes('marketing') || description.toLowerCase().includes('campaign');
        var isProductGoal = description.toLowerCase().includes('product') || description.toLowerCase().includes('launch');
        var suggestions = [];
        if (isMarketingGoal && isProductGoal) {
            suggestions = [
                {
                    name: "Marketing Strategist",
                    type: "specialist",
                    description: "Develops comprehensive marketing strategies and campaign plans",
                    systemPrompt: "You are a marketing strategy expert specializing in product launches and campaign development. Focus on data-driven strategies and ROI optimization.",
                    capabilities: ["Strategy Development", "Market Analysis", "Campaign Planning", "ROI Optimization"],
                    personalityTraits: ["Strategic", "Data-driven", "Results-oriented"],
                    role: "Lead marketing strategy and campaign oversight"
                },
                {
                    name: "Content Creator",
                    type: "assistant",
                    description: "Creates engaging content across digital channels",
                    systemPrompt: "You are a creative content specialist who develops compelling marketing materials, copy, and digital content that resonates with target audiences.",
                    capabilities: ["Content Creation", "Copywriting", "Digital Marketing", "Brand Messaging"],
                    personalityTraits: ["Creative", "Persuasive", "Brand-focused"],
                    role: "Content development and creative execution"
                },
                {
                    name: "Market Research Analyst",
                    type: "specialist",
                    description: "Conducts market research and competitive analysis",
                    systemPrompt: "You are a market research expert who analyzes market trends, competitor strategies, and customer insights to inform marketing decisions.",
                    capabilities: ["Market Research", "Competitive Analysis", "Data Analysis", "Customer Insights"],
                    personalityTraits: ["Analytical", "Detail-oriented", "Insightful"],
                    role: "Market intelligence and research support"
                },
                {
                    name: "Digital Marketing Specialist",
                    type: "assistant",
                    description: "Manages digital channels and online campaigns",
                    systemPrompt: "You are a digital marketing expert specializing in online channels, social media, and digital advertising campaigns.",
                    capabilities: ["Digital Advertising", "Social Media", "SEO/SEM", "Analytics"],
                    personalityTraits: ["Tech-savvy", "Adaptive", "Performance-focused"],
                    role: "Digital channel management and optimization"
                },
                {
                    name: "Campaign Manager",
                    type: "specialist",
                    description: "Coordinates campaign execution and timeline management",
                    systemPrompt: "You are a project management expert who ensures marketing campaigns are executed on time, within budget, and meet quality standards.",
                    capabilities: ["Project Management", "Timeline Coordination", "Budget Management", "Quality Assurance"],
                    personalityTraits: ["Organized", "Reliable", "Communicative"],
                    role: "Campaign coordination and project management"
                }
            ];
        }
        else {
            // Default suggestions for other types of goals
            suggestions = [
                {
                    name: "Strategic Planner",
                    type: "specialist",
                    description: "Helps plan and organize complex tasks",
                    systemPrompt: "You are a strategic planning expert who helps break down complex goals into actionable steps.",
                    capabilities: ["Planning", "Analysis", "Organization"],
                    personalityTraits: ["Methodical", "Detail-oriented"],
                    role: "Planning and coordination"
                },
                {
                    name: "Creative Thinker",
                    type: "assistant",
                    description: "Generates innovative ideas and solutions",
                    systemPrompt: "You are a creative problem-solver who thinks outside the box and generates innovative solutions.",
                    capabilities: ["Ideation", "Problem-solving", "Innovation"],
                    personalityTraits: ["Creative", "Optimistic"],
                    role: "Idea generation and creative solutions"
                },
                {
                    name: "Research Analyst",
                    type: "specialist",
                    description: "Conducts thorough research and analysis",
                    systemPrompt: "You are a research expert who gathers information, analyzes data, and provides insights.",
                    capabilities: ["Research", "Analysis", "Data interpretation"],
                    personalityTraits: ["Analytical", "Thorough"],
                    role: "Information gathering and analysis"
                },
                {
                    name: "Implementation Specialist",
                    type: "assistant",
                    description: "Focuses on executing plans and managing tasks",
                    systemPrompt: "You are an implementation expert who excels at turning plans into action and managing execution details.",
                    capabilities: ["Task Management", "Execution", "Quality Control"],
                    personalityTraits: ["Practical", "Reliable", "Action-oriented"],
                    role: "Plan execution and task management"
                },
                {
                    name: "Communication Coordinator",
                    type: "assistant",
                    description: "Manages communication and stakeholder coordination",
                    systemPrompt: "You are a communication expert who ensures clear information flow and effective stakeholder coordination.",
                    capabilities: ["Communication", "Coordination", "Stakeholder Management"],
                    personalityTraits: ["Diplomatic", "Clear", "Collaborative"],
                    role: "Communication and coordination"
                }
            ];
        }
        // Return the requested number of agents
        return suggestions.slice(0, agentCount);
    };
    var handleCreateSelectedAgents = function () { return __awaiter(void 0, void 0, void 0, function () {
        var selectedAgents, _i, selectedAgents_1, agent, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    selectedAgents = agentSuggestions.filter(function (_, index) { return selectedSuggestions.has(index); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    _i = 0, selectedAgents_1 = selectedAgents;
                    _a.label = 2;
                case 2:
                    if (!(_i < selectedAgents_1.length)) return [3 /*break*/, 5];
                    agent = selectedAgents_1[_i];
                    return [4 /*yield*/, agentService.createAgent({
                            name: agent.name,
                            description: agent.description,
                            type: agent.type,
                            systemPrompt: agent.systemPrompt,
                            capabilities: agent.capabilities,
                            metadata: {
                                personalityTraits: agent.personalityTraits,
                                role: agent.role,
                                conversationGoal: conversationGoal.description
                            }
                        })];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    if (!(selectedAgents.length > 1)) return [3 /*break*/, 7];
                    return [4 /*yield*/, createConversationRules(selectedAgents)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7:
                    navigate('/chat?automated=true&goal=' + encodeURIComponent(conversationGoal.description));
                    return [3 /*break*/, 9];
                case 8:
                    error_1 = _a.sent();
                    console.error('Error creating agents:', error_1);
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    // Handle quick agent creation
    var handleQuickCreate = function () { return __awaiter(void 0, void 0, void 0, function () {
        var agentType, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    agentType = quickFormData.type === 'assistant' ? AgentType.BASE :
                        quickFormData.type === 'specialist' ? AgentType.ENHANCED :
                            AgentType.BASE;
                    return [4 /*yield*/, agentService.createAgent({
                            name: quickFormData.name,
                            description: quickFormData.description,
                            type: agentType,
                            capabilities: getDefaultCapabilitiesForRole(quickFormData.role),
                            metadata: {
                                personalityTraits: getDefaultPersonalityForRole(quickFormData.role),
                                communicationStyle: 'friendly',
                                expertiseAreas: [quickFormData.role]
                            }
                        })];
                case 1:
                    _a.sent();
                    addToast('Agent created successfully!', 'success');
                    navigate('/agents');
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error('Error creating quick agent:', error_2);
                    addToast('Failed to create agent. Please try again.', 'error');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Handle advanced agent creation
    var handleAdvancedSubmit = function (values) { return __awaiter(void 0, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, agentService.createAgent({
                            name: values.name,
                            type: values.type,
                            description: values.description,
                            capabilities: values.capabilities,
                            metadata: values.metadata,
                            config: values.config,
                        })];
                case 1:
                    _a.sent();
                    addToast('Agent created successfully!', 'success');
                    navigate('/agents');
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error('Error creating advanced agent:', error_3);
                    addToast('Failed to create agent. Please try again.', 'error');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Handle from-chat agent creation
    var handleFromChatCreate = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, agentService.createAgent({
                            name: chatContext.suggestedName || 'New Agent',
                            description: "Agent created based on chat conversation needs",
                            type: AgentType.ENHANCED,
                            capabilities: getCapabilitiesFromChatContext(chatContext),
                            metadata: {
                                personalityTraits: ['Helpful', 'Contextual'],
                                communicationStyle: 'friendly',
                                expertiseAreas: [chatContext.missingAgentType || 'general']
                            }
                        })];
                case 1:
                    _a.sent();
                    addToast('Agent created and added to chat!', 'success');
                    navigate('/chat');
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _a.sent();
                    console.error('Error creating chat agent:', error_4);
                    addToast('Failed to create agent. Please try again.', 'error');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Helper functions
    var getDefaultCapabilitiesForRole = function (role) {
        var baseCapabilities = {
            code_generation: false,
            code_review: false,
            code_optimization: false,
            architecture_review: false,
            dependency_analysis: false,
            security_audit: false,
            documentation: false,
            test_generation: false,
            bug_analysis: false,
            performance_analysis: false,
            data_analysis: false,
            natural_language_processing: false,
            virtual_browser: false,
            web_automation: false,
            project_analysis: false,
            knowledge_graph: false,
            taxonomy_system: false,
            learning_system: false,
            agent_collaboration: false,
            communication_bus: false,
            protocol_handler: false,
        };
        switch (role) {
            case 'coding':
                return __assign(__assign({}, baseCapabilities), { code_generation: true, code_review: true, bug_analysis: true });
            case 'writing':
                return __assign(__assign({}, baseCapabilities), { documentation: true, natural_language_processing: true });
            case 'analysis':
                return __assign(__assign({}, baseCapabilities), { data_analysis: true, performance_analysis: true });
            case 'research':
                return __assign(__assign({}, baseCapabilities), { web_automation: true, knowledge_graph: true });
            case 'support':
                return __assign(__assign({}, baseCapabilities), { bug_analysis: true, documentation: true });
            default:
                return __assign(__assign({}, baseCapabilities), { natural_language_processing: true });
        }
    };
    var getDefaultPersonalityForRole = function (role) {
        switch (role) {
            case 'coding': return ['Technical', 'Precise', 'Problem-solving'];
            case 'writing': return ['Creative', 'Articulate', 'Detail-oriented'];
            case 'analysis': return ['Analytical', 'Methodical', 'Data-driven'];
            case 'research': return ['Curious', 'Thorough', 'Investigative'];
            case 'support': return ['Helpful', 'Patient', 'Solution-focused'];
            default: return ['Friendly', 'Helpful', 'Adaptable'];
        }
    };
    var getCapabilitiesFromChatContext = function (context) {
        var _a, _b, _c;
        // Analyze chat context to determine needed capabilities
        var capabilities = getDefaultCapabilitiesForRole('general');
        if ((_a = context.missingAgentType) === null || _a === void 0 ? void 0 : _a.includes('code')) {
            capabilities.code_generation = true;
            capabilities.code_review = true;
        }
        if ((_b = context.missingAgentType) === null || _b === void 0 ? void 0 : _b.includes('data')) {
            capabilities.data_analysis = true;
        }
        if ((_c = context.missingAgentType) === null || _c === void 0 ? void 0 : _c.includes('research')) {
            capabilities.web_automation = true;
            capabilities.knowledge_graph = true;
        }
        return capabilities;
    };
    // Terminal window spawning functionality
    var spawnTerminalAgent = function (agentConfig) { return __awaiter(void 0, void 0, void 0, function () {
        var windowId, agentId, response, terminalData, terminalWindow_1, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    windowId = "terminal_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                    agentId = agentConfig.agentId || windowId;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch('/api/relay/spawn-terminal', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                windowId: windowId,
                                agentId: agentId,
                                agentConfig: agentConfig,
                                terminalType: selectedTerminalType,
                                relayEndpoint: 'ws://localhost:8080/relay',
                                capabilities: agentConfig.capabilities || {},
                                environment: {
                                    TNF_WORKSPACE: '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse',
                                    TNF_AGENT_ID: agentId,
                                    TNF_RELAY_ENDPOINT: 'ws://localhost:8080/relay',
                                    TNF_MASTER_REGISTRY: 'true'
                                }
                            })
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    terminalData = _a.sent();
                    terminalWindow_1 = {
                        windowId: windowId,
                        processId: terminalData.processId,
                        terminalPath: terminalData.terminalPath,
                        agentId: agentId,
                        status: 'spawning',
                        createdAt: new Date(),
                        lastActivity: new Date(),
                        relayConnection: {
                            connected: false,
                            endpoint: 'ws://localhost:8080/relay',
                            lastHeartbeat: new Date()
                        }
                    };
                    setTerminalWindows(function (prev) { return __spreadArray(__spreadArray([], prev, true), [terminalWindow_1], false); });
                    // Start monitoring terminal window status
                    monitorTerminalWindow(windowId);
                    // Register agent with Master Agent Registry
                    return [4 /*yield*/, registerTerminalAgentWithRegistry(agentId, terminalWindow_1, agentConfig)];
                case 4:
                    // Register agent with Master Agent Registry
                    _a.sent();
                    return [2 /*return*/, terminalWindow_1];
                case 5:
                    error_5 = _a.sent();
                    console.error('Failed to spawn terminal agent:', error_5);
                    throw error_5;
                case 6: return [2 /*return*/];
            }
        });
    }); };
    // Monitor terminal window and relay connection
    var monitorTerminalWindow = function (windowId) {
        var checkInterval = setInterval(function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, status_1, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("/api/relay/terminal-status/".concat(windowId))];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        status_1 = _a.sent();
                        setTerminalWindows(function (prev) { return prev.map(function (window) {
                            return window.windowId === windowId
                                ? __assign(__assign({}, window), { status: status_1.isActive ? 'active' : 'idle', lastActivity: new Date(status_1.lastActivity), relayConnection: {
                                        connected: status_1.relayConnected,
                                        endpoint: status_1.relayEndpoint,
                                        lastHeartbeat: new Date(status_1.lastHeartbeat)
                                    } }) : window;
                        }); });
                        // Stop monitoring if terminal is closed
                        if (status_1.status === 'closed') {
                            clearInterval(checkInterval);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_6 = _a.sent();
                        console.error("Error monitoring terminal ".concat(windowId, ":"), error_6);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); }, 5000); // Check every 5 seconds
    };
    // Register terminal agent with Master Agent Registry
    var registerTerminalAgentWithRegistry = function (agentId, terminalWindow, agentConfig) { return __awaiter(void 0, void 0, void 0, function () {
        var masterRegistryPayload, error_7;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    masterRegistryPayload = {
                        id: agentId,
                        name: agentConfig.name,
                        type: agentConfig.type || 'ASSISTANT',
                        platform: 'terminal',
                        location: terminalWindow.terminalPath,
                        capabilities: __assign(__assign({}, agentConfig.capabilities), { terminalAccess: true, relayIntegration: true, heartbeatCompliance: true, handoffTemplating: true }),
                        metadata: __assign(__assign({}, agentConfig.metadata), { terminalWindowId: terminalWindow.windowId, processId: terminalWindow.processId, relayEndpoint: (_a = terminalWindow.relayConnection) === null || _a === void 0 ? void 0 : _a.endpoint, spawnedAt: terminalWindow.createdAt.toISOString() })
                    };
                    return [4 /*yield*/, fetch('/api/relay/master-registry/register', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(masterRegistryPayload)
                        })];
                case 1:
                    _b.sent();
                    addToast("Terminal agent ".concat(agentId, " registered with Master Agent Registry"), 'success');
                    return [3 /*break*/, 3];
                case 2:
                    error_7 = _b.sent();
                    console.error('Failed to register with Master Agent Registry:', error_7);
                    addToast('Failed to register terminal agent with Master Registry', 'error');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Handle terminal agent creation with spawning
    var handleTerminalAgentCreation = function (agentData) { return __awaiter(void 0, void 0, void 0, function () {
        var dbAgent, terminalWindow, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, agentService.createAgent(agentData)];
                case 1:
                    dbAgent = _a.sent();
                    return [4 /*yield*/, spawnTerminalAgent({
                            agentId: dbAgent.id,
                            name: agentData.name,
                            type: agentData.type,
                            capabilities: agentData.capabilities,
                            metadata: agentData.metadata
                        })];
                case 2:
                    terminalWindow = _a.sent();
                    addToast("Terminal agent created and spawned successfully! Window ID: ".concat(terminalWindow.windowId), 'success');
                    // Navigate to agent management with terminal info
                    navigate("/agents/".concat(dbAgent.id, "?terminal=").concat(terminalWindow.windowId));
                    return [3 /*break*/, 4];
                case 3:
                    error_8 = _a.sent();
                    console.error('Error creating terminal agent:', error_8);
                    addToast('Failed to create terminal agent', 'error');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var createConversationRules = function (agents) { return __awaiter(void 0, void 0, void 0, function () {
        var i, sourceAgent, targetAgent;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < agents.length)) return [3 /*break*/, 4];
                    sourceAgent = agents[i];
                    targetAgent = agents[(i + 1) % agents.length];
                    return [4 /*yield*/, chatApiService.createConversationRule({
                            sourceId: sourceAgent.name, // In real implementation, use agent ID
                            targetId: targetAgent.name
                        })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var renderPathSelection = function () { return (_jsxs("div", { className: "max-w-4xl mx-auto space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-4xl font-bold mb-4", children: "Create AI Agents" }), _jsx("p", { className: "text-lg text-muted-foreground mb-8", children: "Choose how you'd like to create your agents" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx(Card, { className: "p-6 hover:shadow-lg transition-shadow cursor-pointer", onClick: function () { return setCurrentPath('quick'); }, children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto", children: _jsx(Bot, { className: "h-6 w-6 text-blue-600" }) }), _jsx("h3", { className: "text-lg font-semibold", children: "Quick Create" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Create a basic agent quickly with essential settings" }), _jsx(Badge, { variant: "secondary", children: "Beginner" })] }) }), _jsx(Card, { className: "p-6 hover:shadow-lg transition-shadow cursor-pointer", onClick: function () { return setCurrentPath('advanced'); }, children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto", children: _jsx(Settings, { className: "h-6 w-6 text-purple-600" }) }), _jsx("h3", { className: "text-lg font-semibold", children: "Advanced Create" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Full control with personality, capabilities, and advanced settings" }), _jsx(Badge, { variant: "secondary", children: "Expert" })] }) }), _jsx(Card, { className: "p-6 hover:shadow-lg transition-shadow cursor-pointer", onClick: function () { return setCurrentPath('ai-assisted'); }, children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto", children: _jsx(Sparkles, { className: "h-6 w-6 text-green-600" }) }), _jsx("h3", { className: "text-lg font-semibold", children: "AI Assistant" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Let AI suggest and create agents based on your goals" }), _jsx(Badge, { variant: "secondary", children: "Smart" })] }) }), _jsx(Card, { className: "p-6 hover:shadow-lg transition-shadow cursor-pointer", onClick: function () {
                            setCurrentPath('ai-assisted');
                            setConversationGoal(function (prev) { return (__assign(__assign({}, prev), { agentCount: 5, complexity: 'complex' })); });
                        }, children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto", children: _jsx(Users, { className: "h-6 w-6 text-orange-600" }) }), _jsx("h3", { className: "text-lg font-semibold", children: "Agent Teams" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Create multiple agents that work together automatically" }), _jsx(Badge, { variant: "secondary", children: "Advanced" })] }) })] }), _jsxs("div", { className: "mt-8", children: [_jsx("h2", { className: "text-2xl font-bold mb-4 text-center", children: "Terminal-Based Agents" }), _jsx("p", { className: "text-center text-muted-foreground mb-6", children: "Create agents that run in dedicated terminal windows with relay integration" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsx(Card, { className: "p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200", onClick: function () { return setCurrentPath('terminal-claude'); }, children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto", children: _jsx(Bot, { className: "h-6 w-6 text-blue-600" }) }), _jsx("h3", { className: "text-lg font-semibold", children: "Claude Code CLI" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Spawn agent in Claude Code CLI terminal with relay integration" }), _jsx(Badge, { variant: "outline", className: "bg-blue-50", children: "Claude Integration" })] }) }), _jsx(Card, { className: "p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-200", onClick: function () { return setCurrentPath('terminal-native'); }, children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto", children: _jsx(Copy, { className: "h-6 w-6 text-green-600" }) }), _jsx("h3", { className: "text-lg font-semibold", children: "Native Terminal" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Create agent in native terminal with The New Fuse bridge" }), _jsx(Badge, { variant: "outline", className: "bg-green-50", children: "Terminal Bridge" })] }) }), _jsx(Card, { className: "p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-purple-200", onClick: function () { return setCurrentPath('terminal-integrated'); }, children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto", children: _jsx(Zap, { className: "h-6 w-6 text-purple-600" }) }), _jsx("h3", { className: "text-lg font-semibold", children: "Integrated Agent" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Embed agent within The New Fuse ecosystem" }), _jsx(Badge, { variant: "outline", className: "bg-purple-50", children: "Full Integration" })] }) })] })] }), _jsx("div", { className: "text-center", children: _jsxs(Button, { variant: "outline", onClick: function () { return navigate('/agents'); }, children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back to Agents"] }) })] })); };
    var renderQuickCreate = function () { return (_jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsxs("div", { className: "mb-6", children: [_jsxs(Button, { variant: "ghost", onClick: function () { return setCurrentPath('choose'); }, children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back"] }), _jsx("h1", { className: "text-3xl font-bold mt-4", children: "Quick Agent Creation" }), _jsx("p", { className: "text-muted-foreground", children: "Get started with a basic agent in minutes" })] }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Agent Name" }), _jsx(Input, { value: quickFormData.name, onChange: function (e) { return setQuickFormData(function (prev) { return (__assign(__assign({}, prev), { name: e.target.value })); }); }, placeholder: "e.g., Code Helper" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Description" }), _jsx(Textarea, { value: quickFormData.description, onChange: function (e) { return setQuickFormData(function (prev) { return (__assign(__assign({}, prev), { description: e.target.value })); }); }, placeholder: "What does this agent do?", rows: 3 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Agent Type" }), _jsxs(Select, { value: quickFormData.type, onChange: function (value) { return setQuickFormData(function (prev) { return (__assign(__assign({}, prev), { type: value })); }); }, children: [_jsx("option", { value: "assistant", children: "General Assistant" }), _jsx("option", { value: "specialist", children: "Specialist" }), _jsx("option", { value: "admin", children: "Administrator" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Primary Role" }), _jsxs(Select, { value: quickFormData.role, onChange: function (value) { return setQuickFormData(function (prev) { return (__assign(__assign({}, prev), { role: value })); }); }, children: [_jsx("option", { value: "general", children: "General Help" }), _jsx("option", { value: "coding", children: "Code Assistance" }), _jsx("option", { value: "writing", children: "Content Writing" }), _jsx("option", { value: "analysis", children: "Data Analysis" }), _jsx("option", { value: "research", children: "Research" }), _jsx("option", { value: "support", children: "Customer Support" })] })] }), _jsx("hr", { className: "my-4 border-gray-200" }), _jsxs("div", { className: "flex justify-between", children: [_jsxs(Button, { variant: "outline", onClick: function () { return setCurrentPath('advanced'); }, children: [_jsx(Settings, { className: "h-4 w-4 mr-2" }), "Need More Options?"] }), _jsxs(Button, { onClick: handleQuickCreate, disabled: !quickFormData.name.trim() || !quickFormData.description.trim(), children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), "Create Agent"] })] })] }) })] })); };
    var renderAIAssisted = function () { return (_jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "mb-6", children: [_jsxs(Button, { variant: "ghost", onClick: function () { return setCurrentPath('choose'); }, children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back"] }), _jsx("h1", { className: "text-3xl font-bold mt-4", children: "AI-Assisted Agent Creation" }), _jsx("p", { className: "text-muted-foreground", children: "Describe your goal and let AI create the perfect team" })] }), step === 1 && (_jsx(Card, { className: "p-6", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "What's your goal?" }), _jsx(Textarea, { value: conversationGoal.description, onChange: function (e) { return setConversationGoal(function (prev) { return (__assign(__assign({}, prev), { description: e.target.value })); }); }, placeholder: "e.g., Plan a product launch, Analyze market data, Create content strategy...", rows: 3 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Additional Context (Optional)" }), _jsx(Textarea, { value: conversationGoal.context, onChange: function (e) { return setConversationGoal(function (prev) { return (__assign(__assign({}, prev), { context: e.target.value })); }); }, placeholder: "Any specific requirements, constraints, or details...", rows: 2 })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Number of Agents" }), _jsxs(Select, { value: conversationGoal.agentCount.toString(), onChange: function (value) { return setConversationGoal(function (prev) { return (__assign(__assign({}, prev), { agentCount: parseInt(value) })); }); }, children: [_jsx("option", { value: "2", children: "2 Agents" }), _jsx("option", { value: "3", children: "3 Agents" }), _jsx("option", { value: "4", children: "4 Agents" }), _jsx("option", { value: "5", children: "5 Agents" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Complexity Level" }), _jsxs(Select, { value: conversationGoal.complexity, onChange: function (value) { return setConversationGoal(function (prev) { return (__assign(__assign({}, prev), { complexity: value })); }); }, children: [_jsx("option", { value: "simple", children: "Simple" }), _jsx("option", { value: "moderate", children: "Moderate" }), _jsx("option", { value: "complex", children: "Complex" })] })] })] }), _jsx(Button, { onClick: generateAgentSuggestions, disabled: !conversationGoal.description.trim() || isGenerating, className: "w-full", children: isGenerating ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2 animate-spin" }), "Generating AI Suggestions..."] })) : (_jsxs(_Fragment, { children: [_jsx(Wand2, { className: "h-4 w-4 mr-2" }), "Generate Agent Team"] })) })] }) })), step === 2 && agentSuggestions.length > 0 && (_jsx("div", { className: "space-y-6", children: _jsxs(Card, { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "AI-Generated Agent Team" }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Select the agents you'd like to create. They'll be configured to work together automatically." }), _jsx("div", { className: "space-y-4", children: agentSuggestions.map(function (suggestion, index) { return (_jsx("div", { className: "p-4 border rounded-lg cursor-pointer transition-colors ".concat(selectedSuggestions.has(index)
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'), onClick: function () {
                                    var newSelected = new Set(selectedSuggestions);
                                    if (newSelected.has(index)) {
                                        newSelected.delete(index);
                                    }
                                    else {
                                        newSelected.add(index);
                                    }
                                    setSelectedSuggestions(newSelected);
                                }, children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-semibold", children: suggestion.name }), _jsx("p", { className: "text-sm text-muted-foreground mb-2", children: suggestion.description }), _jsx("div", { className: "flex flex-wrap gap-1 mb-2", children: suggestion.capabilities.map(function (cap, i) { return (_jsx(Badge, { variant: "secondary", className: "text-xs", children: cap }, i)); }) }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Role: ", suggestion.role] })] }), _jsx("div", { className: "ml-4", children: _jsx("input", { type: "checkbox", checked: selectedSuggestions.has(index), onChange: function () { }, className: "w-4 h-4" }) })] }) }, index)); }) }), _jsxs("div", { className: "flex justify-between mt-6", children: [_jsxs(Button, { variant: "outline", onClick: function () { return setStep(1); }, children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Modify Goal"] }), _jsxs("div", { className: "space-x-2", children: [_jsxs(Button, { variant: "outline", onClick: generateAgentSuggestions, disabled: isGenerating, children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Regenerate"] }), _jsxs(Button, { onClick: handleCreateSelectedAgents, disabled: selectedSuggestions.size === 0, children: [_jsx(Users, { className: "h-4 w-4 mr-2" }), "Create ", selectedSuggestions.size, " Agents"] })] })] })] }) }))] })); };
    var renderFromChat = function () {
        var _a;
        return (_jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsxs("div", { className: "mb-6", children: [_jsxs(Button, { variant: "ghost", onClick: function () { return navigate('/chat'); }, children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back to Chat"] }), _jsx("h1", { className: "text-3xl font-bold mt-4", children: "Create Agent from Chat" }), _jsx("p", { className: "text-muted-foreground", children: "Create an agent based on your conversation needs" })] }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "space-y-6", children: [chatContext.missingAgentType && (_jsxs("div", { className: "p-4 bg-blue-50 rounded-lg", children: [_jsx("h3", { className: "font-medium text-blue-900", children: "Suggested Agent Type" }), _jsxs("p", { className: "text-sm text-blue-700", children: ["Based on your conversation, you might need: ", _jsx("strong", { children: chatContext.missingAgentType })] })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Agent Name" }), _jsx(Input, { value: chatContext.suggestedName || '', onChange: function (e) { return setChatContext(function (prev) { return (__assign(__assign({}, prev), { suggestedName: e.target.value })); }); }, placeholder: "Name for your new agent" })] }), chatContext.conversationHistory && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Conversation Context" }), _jsx(Textarea, { value: chatContext.conversationHistory, readOnly: true, rows: 4, className: "bg-gray-50" }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "This conversation will help inform the agent's capabilities" })] })), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsxs(Button, { variant: "outline", children: [_jsx(Settings, { className: "h-4 w-4 mr-2" }), "Advanced Options"] }), _jsxs(Button, { onClick: handleFromChatCreate, disabled: !((_a = chatContext.suggestedName) === null || _a === void 0 ? void 0 : _a.trim()), children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Create & Add to Chat"] })] })] }) })] }));
    };
    var renderAdvanced = function () {
        return (_jsxs("div", { className: "max-w-3xl mx-auto", children: [_jsxs("div", { className: "mb-6", children: [_jsxs(Button, { variant: "ghost", onClick: function () { return setCurrentPath('choose'); }, children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back"] }), _jsx("h1", { className: "text-3xl font-bold mt-4", children: "Advanced Agent Creation" }), _jsx("p", { className: "text-muted-foreground", children: "Full control over agent capabilities and personality" })] }), _jsxs(Card, { className: "p-6", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Advanced Configuration" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Configure all aspects of your agent including capabilities, personality, and reasoning strategies." })] }), _jsx("div", { className: "max-w-2xl", children: _jsx(NewAgentForm, { form: advancedForm, onSubmit: handleAdvancedSubmit }) })] })] }));
    };
    // Terminal Agent Creation Render Functions
    var renderTerminalClaude = function () { return (_jsxs("div", { className: "max-w-3xl mx-auto", children: [_jsxs("div", { className: "mb-6", children: [_jsxs(Button, { variant: "ghost", onClick: function () { return setCurrentPath('choose'); }, children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back"] }), _jsx("h1", { className: "text-3xl font-bold mt-4", children: "Claude Code CLI Agent" }), _jsx("p", { className: "text-muted-foreground", children: "Create an agent that operates through Claude Code CLI with full relay integration" })] }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(Bot, { className: "h-5 w-5 text-blue-600" }), _jsx("h3", { className: "font-semibold text-blue-900", children: "Claude Code CLI Integration" })] }), _jsx("p", { className: "text-blue-700 text-sm", children: "This agent will be spawned in a new Claude Code CLI terminal window with direct relay connection to The New Fuse framework." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Agent Name" }), _jsx(Input, { value: quickFormData.name, onChange: function (e) { return setQuickFormData(function (prev) { return (__assign(__assign({}, prev), { name: e.target.value })); }); }, placeholder: "e.g., Claude CLI Assistant" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Description" }), _jsx(Textarea, { value: quickFormData.description, onChange: function (e) { return setQuickFormData(function (prev) { return (__assign(__assign({}, prev), { description: e.target.value })); }); }, placeholder: "Describe what this Claude Code CLI agent will do...", rows: 3 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Claude Capabilities" }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: Object.entries({
                                        code_generation: 'Code Generation',
                                        code_review: 'Code Review',
                                        file_operations: 'File Operations',
                                        git_operations: 'Git Operations',
                                        terminal_access: 'Terminal Access',
                                        project_analysis: 'Project Analysis'
                                    }).map(function (_a) {
                                        var _b;
                                        var key = _a[0], label = _a[1];
                                        return (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { checked: ((_b = quickFormData.capabilities) === null || _b === void 0 ? void 0 : _b[key]) || false, onCheckedChange: function (checked) {
                                                        return setQuickFormData(function (prev) {
                                                            var _a;
                                                            return (__assign(__assign({}, prev), { capabilities: __assign(__assign({}, prev.capabilities), (_a = {}, _a[key] = checked, _a)) }));
                                                        });
                                                    } }), _jsx("span", { className: "text-sm", children: label })] }, key));
                                    }) })] }), _jsxs("div", { className: "bg-amber-50 border border-amber-200 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(Terminal, { className: "h-5 w-5 text-amber-600" }), _jsx("h3", { className: "font-semibold text-amber-900", children: "Terminal Configuration" })] }), _jsx("p", { className: "text-amber-700 text-sm mb-3", children: "The agent will be launched with environment variables for relay integration:" }), _jsxs("div", { className: "space-y-1 text-xs font-mono bg-amber-100 p-2 rounded", children: [_jsxs("div", { children: ["TNF_AGENT_ID: ", quickFormData.name.toLowerCase().replace(/\s+/g, '-') || 'claude-cli-agent'] }), _jsx("div", { children: "TNF_RELAY_ENDPOINT: ws://localhost:8080/relay" }), _jsx("div", { children: "TNF_MASTER_REGISTRY: true" })] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx(Button, { variant: "outline", onClick: function () { return setCurrentPath('choose'); }, children: "Cancel" }), _jsxs(Button, { onClick: function () { return handleTerminalAgentCreation(__assign(__assign({}, quickFormData), { type: 'ASSISTANT', platform: 'claude-cli', metadata: { terminalType: 'claude-cli', relayIntegration: true } })); }, disabled: !quickFormData.name.trim() || !quickFormData.description.trim(), children: [_jsx(Terminal, { className: "h-4 w-4 mr-2" }), "Spawn Claude CLI Agent"] })] })] }) })] })); };
    var renderTerminalNative = function () { return (_jsxs("div", { className: "max-w-3xl mx-auto", children: [_jsxs("div", { className: "mb-6", children: [_jsxs(Button, { variant: "ghost", onClick: function () { return setCurrentPath('choose'); }, children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back"] }), _jsx("h1", { className: "text-3xl font-bold mt-4", children: "Native Terminal Agent" }), _jsx("p", { className: "text-muted-foreground", children: "Create an agent that operates through native terminal with The New Fuse bridge" })] }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(Monitor, { className: "h-5 w-5 text-green-600" }), _jsx("h3", { className: "font-semibold text-green-900", children: "Terminal Bridge Integration" })] }), _jsx("p", { className: "text-green-700 text-sm", children: "This agent will operate through the native terminal with The New Fuse terminal bridge for autonomous communication." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Agent Name" }), _jsx(Input, { value: quickFormData.name, onChange: function (e) { return setQuickFormData(function (prev) { return (__assign(__assign({}, prev), { name: e.target.value })); }); }, placeholder: "e.g., Terminal Bridge Agent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Description" }), _jsx(Textarea, { value: quickFormData.description, onChange: function (e) { return setQuickFormData(function (prev) { return (__assign(__assign({}, prev), { description: e.target.value })); }); }, placeholder: "Describe what this terminal agent will do...", rows: 3 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Terminal Capabilities" }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: Object.entries({
                                        terminal_access: 'Terminal Commands',
                                        file_operations: 'File Operations',
                                        process_management: 'Process Management',
                                        system_monitoring: 'System Monitoring',
                                        script_execution: 'Script Execution',
                                        log_analysis: 'Log Analysis'
                                    }).map(function (_a) {
                                        var _b;
                                        var key = _a[0], label = _a[1];
                                        return (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { checked: ((_b = quickFormData.capabilities) === null || _b === void 0 ? void 0 : _b[key]) || false, onCheckedChange: function (checked) {
                                                        return setQuickFormData(function (prev) {
                                                            var _a;
                                                            return (__assign(__assign({}, prev), { capabilities: __assign(__assign({}, prev.capabilities), (_a = {}, _a[key] = checked, _a)) }));
                                                        });
                                                    } }), _jsx("span", { className: "text-sm", children: label })] }, key));
                                    }) })] }), _jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(Cpu, { className: "h-5 w-5 text-blue-600" }), _jsx("h3", { className: "font-semibold text-blue-900", children: "Bridge Configuration" })] }), _jsx("p", { className: "text-blue-700 text-sm mb-3", children: "Communication through terminal_bridge.js with file-based protocol:" }), _jsxs("div", { className: "space-y-1 text-xs font-mono bg-blue-100 p-2 rounded", children: [_jsx("div", { children: "Bridge Path: ./terminal_bridge.js" }), _jsx("div", { children: "Command Queue: ./command_queue.json" }), _jsx("div", { children: "Shared Memory: ./shared_memory.json" })] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx(Button, { variant: "outline", onClick: function () { return setCurrentPath('choose'); }, children: "Cancel" }), _jsxs(Button, { onClick: function () { return handleTerminalAgentCreation(__assign(__assign({}, quickFormData), { type: 'ASSISTANT', platform: 'terminal', metadata: { terminalType: 'native', bridgeIntegration: true } })); }, disabled: !quickFormData.name.trim() || !quickFormData.description.trim(), children: [_jsx(Monitor, { className: "h-4 w-4 mr-2" }), "Create Terminal Agent"] })] })] }) })] })); };
    var renderTerminalIntegrated = function () { return (_jsxs("div", { className: "max-w-3xl mx-auto", children: [_jsxs("div", { className: "mb-6", children: [_jsxs(Button, { variant: "ghost", onClick: function () { return setCurrentPath('choose'); }, children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back"] }), _jsx("h1", { className: "text-3xl font-bold mt-4", children: "Integrated Terminal Agent" }), _jsx("p", { className: "text-muted-foreground", children: "Create a fully integrated agent within The New Fuse ecosystem" })] }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-purple-50 border border-purple-200 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(Zap, { className: "h-5 w-5 text-purple-600" }), _jsx("h3", { className: "font-semibold text-purple-900", children: "Full TNF Integration" })] }), _jsx("p", { className: "text-purple-700 text-sm", children: "This agent will be fully embedded within The New Fuse ecosystem with complete relay, registry, and orchestrator integration." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Agent Name" }), _jsx(Input, { value: quickFormData.name, onChange: function (e) { return setQuickFormData(function (prev) { return (__assign(__assign({}, prev), { name: e.target.value })); }); }, placeholder: "e.g., TNF Integrated Agent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Description" }), _jsx(Textarea, { value: quickFormData.description, onChange: function (e) { return setQuickFormData(function (prev) { return (__assign(__assign({}, prev), { description: e.target.value })); }); }, placeholder: "Describe what this integrated agent will do...", rows: 3 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Integration Capabilities" }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: Object.entries({
                                        relay_integration: 'Relay Integration',
                                        protocol_translation: 'Protocol Translation',
                                        heartbeat_compliance: 'Heartbeat Compliance',
                                        handoff_templating: 'Handoff Templating',
                                        stagnation_recovery: 'Stagnation Recovery',
                                        workflow_execution: 'Workflow Execution',
                                        agent_coordination: 'Agent Coordination',
                                        real_time_chat: 'Real-time Chat'
                                    }).map(function (_a) {
                                        var _b;
                                        var key = _a[0], label = _a[1];
                                        return (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { checked: ((_b = quickFormData.capabilities) === null || _b === void 0 ? void 0 : _b[key]) || false, onCheckedChange: function (checked) {
                                                        return setQuickFormData(function (prev) {
                                                            var _a;
                                                            return (__assign(__assign({}, prev), { capabilities: __assign(__assign({}, prev.capabilities), (_a = {}, _a[key] = checked, _a)) }));
                                                        });
                                                    } }), _jsx("span", { className: "text-sm", children: label })] }, key));
                                    }) })] }), _jsxs("div", { className: "bg-emerald-50 border border-emerald-200 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(Sparkles, { className: "h-5 w-5 text-emerald-600" }), _jsx("h3", { className: "font-semibold text-emerald-900", children: "Master Registry Integration" })] }), _jsx("p", { className: "text-emerald-700 text-sm mb-3", children: "Full registration with Master Agent Registry including:" }), _jsxs("ul", { className: "text-xs text-emerald-700 space-y-1", children: [_jsx("li", { children: "\u2022 Universal onboarding protocol compliance" }), _jsx("li", { children: "\u2022 Performance metrics tracking" }), _jsx("li", { children: "\u2022 Todo list management" }), _jsx("li", { children: "\u2022 Merkle tree verification" }), _jsx("li", { children: "\u2022 Real-time status monitoring" })] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx(Button, { variant: "outline", onClick: function () { return setCurrentPath('choose'); }, children: "Cancel" }), _jsxs(Button, { onClick: function () { return handleTerminalAgentCreation(__assign(__assign({}, quickFormData), { type: 'ASSISTANT', platform: 'integrated', metadata: {
                                            terminalType: 'integrated',
                                            fullIntegration: true,
                                            masterRegistryCompliant: true,
                                            protocolCompliant: true
                                        } })); }, disabled: !quickFormData.name.trim() || !quickFormData.description.trim(), children: [_jsx(Zap, { className: "h-4 w-4 mr-2" }), "Create Integrated Agent"] })] })] }) })] })); };
    var renderCurrentPath = function () {
        switch (currentPath) {
            case 'quick':
                return renderQuickCreate();
            case 'advanced':
                return renderAdvanced();
            case 'ai-assisted':
                return renderAIAssisted();
            case 'from-chat':
                return renderFromChat();
            default:
                return renderPathSelection();
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-background p-6", children: renderCurrentPath() }));
};
export default UnifiedAgentCreator;
