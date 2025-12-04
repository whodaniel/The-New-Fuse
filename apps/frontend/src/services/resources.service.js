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
import axios from 'axios';
var API_BASE = process.env.VITE_API_URL || 'http://localhost:4000/api';
// Mock data for development
var mockSkills = [
    {
        id: 'skill-1',
        name: 'Web Search Pro',
        description: 'Advanced web search capabilities with real-time data fetching and content extraction',
        type: 'skill',
        skillType: 'mcp-tool',
        category: 'ai',
        tags: ['search', 'web', 'data', 'real-time'],
        author: 'Claude Team',
        version: '2.1.0',
        downloads: 15420,
        rating: 4.8,
        reviews: 234,
        featured: true,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-11-18T00:00:00Z',
        capabilities: ['Web search', 'Content extraction', 'Link following', 'Screenshot capture'],
        modelCompatibility: ['Claude 3 Opus', 'Claude 3 Sonnet', 'Claude 3.5 Sonnet'],
        examples: [
            {
                title: 'Search for recent news',
                description: 'Search for the latest news about AI developments',
                input: 'What are the latest developments in AI from the past week?',
                output: 'Based on web search results from the past week, here are the key AI developments...',
            },
        ],
        documentation: 'https://docs.anthropic.com/skills/web-search',
        installCommand: 'npm install @anthropic/skill-web-search',
    },
    {
        id: 'skill-2',
        name: 'Code Analyzer',
        description: 'Analyze code quality, security vulnerabilities, and suggest improvements',
        type: 'skill',
        skillType: 'mcp-tool',
        category: 'development',
        tags: ['code', 'analysis', 'security', 'quality'],
        author: 'DevTools Inc',
        version: '1.5.2',
        downloads: 8930,
        rating: 4.6,
        reviews: 156,
        featured: true,
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-11-10T00:00:00Z',
        capabilities: ['Static analysis', 'Security scanning', 'Code metrics', 'Best practices'],
        modelCompatibility: ['Claude 3 Opus', 'Claude 3 Sonnet'],
        examples: [
            {
                title: 'Analyze Python code',
                description: 'Review a Python function for potential issues',
                input: 'def calculate(x, y): return x / y',
                output: 'Potential division by zero error when y is 0. Recommendation: Add validation...',
            },
        ],
        documentation: 'https://github.com/devtools/code-analyzer',
    },
    {
        id: 'skill-3',
        name: 'Data Visualization',
        description: 'Create beautiful charts and graphs from data using various visualization libraries',
        type: 'skill',
        skillType: 'workflow',
        category: 'data',
        tags: ['visualization', 'charts', 'graphs', 'data'],
        author: 'DataViz Team',
        version: '3.0.1',
        downloads: 12340,
        rating: 4.9,
        reviews: 289,
        featured: true,
        createdAt: '2023-11-20T00:00:00Z',
        updatedAt: '2024-11-05T00:00:00Z',
        capabilities: ['Bar charts', 'Line graphs', 'Pie charts', 'Scatter plots', 'Heatmaps'],
        modelCompatibility: ['Claude 3 Opus', 'Claude 3 Sonnet', 'Claude 3 Haiku'],
        examples: [],
        documentation: 'https://dataviz.io/docs',
    },
    {
        id: 'skill-4',
        name: 'Email Assistant',
        description: 'Automate email tasks including drafting, sending, and organizing',
        type: 'skill',
        skillType: 'integration',
        category: 'communication',
        tags: ['email', 'automation', 'communication'],
        author: 'Productivity Hub',
        version: '2.3.0',
        downloads: 6720,
        rating: 4.5,
        reviews: 98,
        featured: false,
        createdAt: '2024-03-10T00:00:00Z',
        updatedAt: '2024-10-28T00:00:00Z',
        capabilities: ['Draft emails', 'Send emails', 'Email classification', 'Smart replies'],
        modelCompatibility: ['Claude 3 Sonnet', 'Claude 3.5 Sonnet'],
        examples: [],
        documentation: 'https://productivity-hub.com/email-assistant',
    },
];
var mockWorkflows = [
    {
        id: 'workflow-1',
        name: 'Slack to Notion Integration',
        description: 'Automatically save important Slack messages to Notion database',
        type: 'workflow',
        category: 'productivity',
        tags: ['slack', 'notion', 'automation', 'integration'],
        author: 'Workflow Masters',
        version: '1.2.0',
        downloads: 9870,
        rating: 4.7,
        reviews: 187,
        featured: true,
        createdAt: '2024-01-05T00:00:00Z',
        updatedAt: '2024-11-12T00:00:00Z',
        nodes: 8,
        triggers: ['Slack: New Message'],
        actions: ['Notion: Create Page', 'Filter', 'Transform Data'],
        integrations: ['Slack', 'Notion'],
        complexity: 'simple',
        importUrl: 'https://n8n.io/workflows/slack-notion',
    },
    {
        id: 'workflow-2',
        name: 'AI Content Pipeline',
        description: 'Generate, review, and publish content using AI and multiple platforms',
        type: 'workflow',
        category: 'ai',
        tags: ['ai', 'content', 'automation', 'publishing'],
        author: 'Content Automation',
        version: '2.0.1',
        downloads: 5430,
        rating: 4.8,
        reviews: 92,
        featured: true,
        createdAt: '2024-02-20T00:00:00Z',
        updatedAt: '2024-11-08T00:00:00Z',
        nodes: 15,
        triggers: ['Webhook', 'Schedule'],
        actions: ['Claude AI', 'Review', 'WordPress Publish', 'Social Media Post'],
        integrations: ['Claude', 'WordPress', 'Twitter', 'LinkedIn'],
        complexity: 'complex',
        importUrl: 'https://n8n.io/workflows/ai-content-pipeline',
    },
    {
        id: 'workflow-3',
        name: 'Database Sync & Backup',
        description: 'Sync data between multiple databases and create automatic backups',
        type: 'workflow',
        category: 'data',
        tags: ['database', 'sync', 'backup', 'automation'],
        author: 'DataOps Pro',
        version: '1.8.0',
        downloads: 7230,
        rating: 4.6,
        reviews: 134,
        featured: false,
        createdAt: '2023-12-15T00:00:00Z',
        updatedAt: '2024-11-01T00:00:00Z',
        nodes: 12,
        triggers: ['Schedule: Daily'],
        actions: ['PostgreSQL Query', 'MySQL Insert', 'S3 Upload', 'Notification'],
        integrations: ['PostgreSQL', 'MySQL', 'AWS S3', 'Email'],
        complexity: 'medium',
        importUrl: 'https://n8n.io/workflows/database-sync',
    },
];
var mockTemplates = [
    {
        id: 'template-1',
        name: 'Customer Support Agent',
        description: 'Professional customer support agent with empathy and problem-solving skills',
        type: 'template',
        templateType: 'chat',
        category: 'communication',
        tags: ['customer-support', 'chat', 'help-desk'],
        author: 'Support Solutions',
        version: '1.0.0',
        downloads: 4560,
        rating: 4.7,
        reviews: 78,
        featured: true,
        createdAt: '2024-03-01T00:00:00Z',
        updatedAt: '2024-11-15T00:00:00Z',
        model: 'Claude 3.5 Sonnet',
        systemPrompt: 'You are a professional customer support agent...',
        capabilities: ['Empathetic responses', 'Problem resolution', 'Ticket creation', 'Escalation'],
        configuration: {
            temperature: 0.7,
            maxTokens: 2000,
            tone: 'professional-friendly',
        },
        requiredSkills: [],
        optionalSkills: ['ticket-system-integration', 'knowledge-base-search'],
    },
    {
        id: 'template-2',
        name: 'Code Review Assistant',
        description: 'Technical agent specialized in code review and suggestions',
        type: 'template',
        templateType: 'task',
        category: 'development',
        tags: ['code-review', 'development', 'programming'],
        author: 'DevAI Team',
        version: '2.1.0',
        downloads: 6780,
        rating: 4.9,
        reviews: 145,
        featured: true,
        createdAt: '2024-01-20T00:00:00Z',
        updatedAt: '2024-11-10T00:00:00Z',
        model: 'Claude 3 Opus',
        systemPrompt: 'You are an expert code reviewer...',
        capabilities: ['Code analysis', 'Security review', 'Best practices', 'Performance optimization'],
        configuration: {
            temperature: 0.3,
            maxTokens: 4000,
            tone: 'technical-detailed',
        },
        requiredSkills: ['code-analyzer'],
        optionalSkills: ['security-scanner', 'performance-profiler'],
    },
    {
        id: 'template-3',
        name: 'Data Analysis Expert',
        description: 'Analytical agent for data processing, visualization, and insights',
        type: 'template',
        templateType: 'analysis',
        category: 'data',
        tags: ['data-analysis', 'analytics', 'insights'],
        author: 'Analytics Pro',
        version: '1.5.0',
        downloads: 3240,
        rating: 4.8,
        reviews: 67,
        featured: false,
        createdAt: '2024-02-15T00:00:00Z',
        updatedAt: '2024-10-30T00:00:00Z',
        model: 'Claude 3 Sonnet',
        systemPrompt: 'You are a data analysis expert...',
        capabilities: ['Statistical analysis', 'Data visualization', 'Trend detection', 'Reporting'],
        configuration: {
            temperature: 0.5,
            maxTokens: 3000,
            tone: 'analytical-clear',
        },
        requiredSkills: ['data-visualization'],
        optionalSkills: ['statistical-tools', 'ml-integration'],
    },
];
var ResourcesService = /** @class */ (function () {
    function ResourcesService() {
    }
    // Fetch all resources
    ResourcesService.prototype.getAllResources = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.get("".concat(API_BASE, "/resources"))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_1 = _a.sent();
                        console.log('Using mock data for resources');
                        return [2 /*return*/, __spreadArray(__spreadArray(__spreadArray([], mockSkills, true), mockWorkflows, true), mockTemplates, true)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Fetch skills
    ResourcesService.prototype.getSkills = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.get("".concat(API_BASE, "/resources/skills"))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_2 = _a.sent();
                        console.log('Using mock data for skills');
                        return [2 /*return*/, mockSkills];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Fetch workflows
    ResourcesService.prototype.getWorkflows = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.get("".concat(API_BASE, "/resources/workflows"))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_3 = _a.sent();
                        console.log('Using mock data for workflows');
                        return [2 /*return*/, mockWorkflows];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Fetch templates
    ResourcesService.prototype.getTemplates = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.get("".concat(API_BASE, "/resources/templates"))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_4 = _a.sent();
                        console.log('Using mock data for templates');
                        return [2 /*return*/, mockTemplates];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Search resources
    ResourcesService.prototype.searchResources = function (filter) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_5, allResources;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.post("".concat(API_BASE, "/resources/search"), filter)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_5 = _a.sent();
                        console.log('Using mock data for search');
                        allResources = __spreadArray(__spreadArray(__spreadArray([], mockSkills, true), mockWorkflows, true), mockTemplates, true);
                        return [2 /*return*/, allResources.filter(function (resource) {
                                if (filter.search && !resource.name.toLowerCase().includes(filter.search.toLowerCase()) &&
                                    !resource.description.toLowerCase().includes(filter.search.toLowerCase())) {
                                    return false;
                                }
                                if (filter.type && filter.type !== 'all' && resource.type !== filter.type) {
                                    return false;
                                }
                                if (filter.category && filter.category !== 'all' && resource.category !== filter.category) {
                                    return false;
                                }
                                if (filter.featured && !resource.featured) {
                                    return false;
                                }
                                return true;
                            })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get resource stats
    ResourcesService.prototype.getStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.get("".concat(API_BASE, "/resources/stats"))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_6 = _a.sent();
                        console.log('Using mock data for stats');
                        return [2 /*return*/, {
                                totalResources: mockSkills.length + mockWorkflows.length + mockTemplates.length,
                                totalSkills: mockSkills.length,
                                totalWorkflows: mockWorkflows.length,
                                totalTemplates: mockTemplates.length,
                                totalDownloads: __spreadArray(__spreadArray(__spreadArray([], mockSkills, true), mockWorkflows, true), mockTemplates, true).reduce(function (sum, r) { return sum + r.downloads; }, 0),
                                averageRating: __spreadArray(__spreadArray(__spreadArray([], mockSkills, true), mockWorkflows, true), mockTemplates, true).reduce(function (sum, r) { return sum + r.rating; }, 0) /
                                    (mockSkills.length + mockWorkflows.length + mockTemplates.length),
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Toggle favorite
    ResourcesService.prototype.toggleFavorite = function (resourceId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.post("".concat(API_BASE, "/resources/").concat(resourceId, "/favorite"), { userId: userId })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _a.sent();
                        console.log('Favorite toggled (mock)');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Share resource with agent
    ResourcesService.prototype.shareResource = function (share) {
        return __awaiter(this, void 0, void 0, function () {
            var error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.post("".concat(API_BASE, "/resources/share"), share)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_8 = _a.sent();
                        console.log('Resource shared (mock)');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Execute/Install skill
    ResourcesService.prototype.executeSkill = function (skillId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.post("".concat(API_BASE, "/skills/").concat(skillId, "/execute"))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_9 = _a.sent();
                        console.log('Skill executed (mock)');
                        return [2 /*return*/, { success: true, message: 'Skill installed successfully' }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Import workflow
    ResourcesService.prototype.importWorkflow = function (workflowId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.post("".concat(API_BASE, "/workflows/").concat(workflowId, "/import"))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_10 = _a.sent();
                        console.log('Workflow imported (mock)');
                        return [2 /*return*/, { success: true, message: 'Workflow imported to n8n successfully' }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Create agent from template
    ResourcesService.prototype.createAgentFromTemplate = function (templateId, customConfig) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.post("".concat(API_BASE, "/templates/").concat(templateId, "/create-agent"), customConfig)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        error_11 = _a.sent();
                        console.log('Agent created from template (mock)');
                        return [2 /*return*/, { success: true, agentId: 'agent-' + Date.now(), message: 'Agent created successfully' }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return ResourcesService;
}());
export var resourcesService = new ResourcesService();
export default resourcesService;
