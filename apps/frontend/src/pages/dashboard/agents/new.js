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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui/toast';
import { NewAgentForm, agentFormSchema } from '@/components/forms/NewAgentForm';
import { agentService } from '@/services/agent';
export var NewAgentPage = function () {
    var navigate = useNavigate();
    var toast = useToast().toast;
    var form = useForm({
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
    var onSubmit = function (values) { return __awaiter(void 0, void 0, void 0, function () {
        var createAgentDto, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    createAgentDto = {
                        name: values.name,
                        type: values.type,
                        description: values.description,
                        capabilities: values.capabilities,
                        metadata: values.metadata,
                        config: values.config,
                    };
                    return [4 /*yield*/, agentService.createAgent(createAgentDto)];
                case 1:
                    _a.sent();
                    toast.success('Agent created successfully');
                    navigate('/dashboard/agents');
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Failed to create agent:', error_1);
                    toast.error('Failed to create agent. Please try again.');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs("div", { className: "flex h-screen bg-background", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 p-6 overflow-auto", children: _jsxs("div", { className: "max-w-3xl mx-auto", children: [_jsxs(Button, { variant: "ghost", className: "mb-6", onClick: function () { return navigate('/dashboard/agents'); }, children: [_jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }), "Back to Agents"] }), _jsxs(Card, { className: "p-6", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "text-3xl font-bold", children: "Create New Agent" }), _jsx("p", { className: "text-muted-foreground", children: "Configure your new AI agent" })] }), _jsx("div", { className: "max-w-2xl", children: _jsx(NewAgentForm, { form: form, onSubmit: onSubmit }) })] })] }) })] }));
};
