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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Flex, HStack, Heading, Button, Tabs, TabList, TabPanels, Tab, TabPanel, useToast, useDisclosure, Select } from '@chakra-ui/react';
import { PromptEditor } from './PromptEditor';
import { VariableManager } from './VariableManager';
import { TestCaseManager } from './TestCaseManager';
import { ResultsViewer } from './ResultsViewer';
import { VersionHistory } from './VersionHistory';
import { PromptSaveModal } from './PromptSaveModal';
import { usePromptTemplates } from '../../hooks/usePromptTemplates';
import { useModels } from '../../hooks/useModels';
export var PromptWorkbench = function () {
    var toast = useToast();
    var _a = useDisclosure(), isOpen = _a.isOpen, onOpen = _a.onOpen, onClose = _a.onClose;
    var _b = usePromptTemplates(), templates = _b.templates, saveTemplate = _b.saveTemplate, loadTemplate = _b.loadTemplate;
    var _c = useModels(), models = _c.models, selectedModel = _c.selectedModel, setSelectedModel = _c.setSelectedModel, generateCompletion = _c.generateCompletion;
    var _d = useState(''), prompt = _d[0], setPrompt = _d[1];
    var _e = useState({}), variables = _e[0], setVariables = _e[1];
    var _f = useState([]), testCases = _f[0], setTestCases = _f[1];
    var _g = useState([]), results = _g[0], setResults = _g[1];
    var _h = useState(false), isGenerating = _h[0], setIsGenerating = _h[1];
    var _j = useState(null), activeTemplate = _j[0], setActiveTemplate = _j[1];
    var handlePromptChange = function (newPrompt) {
        setPrompt(newPrompt);
    };
    var handleVariablesChange = function (newVariables) {
        setVariables(newVariables);
    };
    var handleTestCasesChange = function (newTestCases) {
        setTestCases(newTestCases);
    };
    var compilePrompt = function (templateText, vars) {
        var compiled = templateText;
        Object.entries(vars).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            compiled = compiled.replace(new RegExp("{{\\s*".concat(key, "\\s*}}"), 'g'), value);
        });
        return compiled;
    };
    var handleGenerate = function () { return __awaiter(void 0, void 0, void 0, function () {
        var newResults, _i, testCases_1, testCase, testVars, compiledPrompt, result, compiledPrompt, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!prompt.trim()) {
                        toast({
                            title: 'Empty prompt',
                            description: 'Please enter a prompt template',
                            status: 'warning',
                        });
                        return [2 /*return*/];
                    }
                    setIsGenerating(true);
                    setResults([]);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, 10, 11]);
                    if (!(testCases.length > 0)) return [3 /*break*/, 6];
                    newResults = [];
                    _i = 0, testCases_1 = testCases;
                    _a.label = 2;
                case 2:
                    if (!(_i < testCases_1.length)) return [3 /*break*/, 5];
                    testCase = testCases_1[_i];
                    testVars = __assign(__assign({}, variables), testCase.variables);
                    compiledPrompt = compilePrompt(prompt, testVars);
                    return [4 /*yield*/, generateCompletion(compiledPrompt)];
                case 3:
                    result = _a.sent();
                    newResults.push({
                        testCase: testCase.name,
                        prompt: compiledPrompt,
                        result: result,
                        timestamp: new Date().toISOString()
                    });
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    setResults(newResults);
                    return [3 /*break*/, 8];
                case 6:
                    compiledPrompt = compilePrompt(prompt, variables);
                    return [4 /*yield*/, generateCompletion(compiledPrompt)];
                case 7:
                    result = _a.sent();
                    setResults([{
                            prompt: compiledPrompt,
                            result: result,
                            timestamp: new Date().toISOString()
                        }]);
                    _a.label = 8;
                case 8:
                    toast({
                        title: 'Generation complete',
                        status: 'success',
                    });
                    return [3 /*break*/, 11];
                case 9:
                    error_1 = _a.sent();
                    toast({
                        title: 'Generation failed',
                        description: error_1.message,
                        status: 'error',
                    });
                    return [3 /*break*/, 11];
                case 10:
                    setIsGenerating(false);
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    }); };
    var handleSave = function () {
        onOpen();
    };
    var handleTemplateSelect = function (templateId) {
        if (templateId) {
            var template = templates.find(function (t) { return t.id === templateId; });
            if (template) {
                setPrompt(template.content);
                setVariables(template.variables || {});
                setTestCases(template.testCases || []);
                setActiveTemplate(templateId);
                toast({
                    title: 'Template loaded',
                    description: "Loaded \"".concat(template.name, "\""),
                    status: 'info',
                });
            }
        }
        else {
            setActiveTemplate(null);
        }
    };
    return (_jsxs(Box, { p: 4, children: [_jsxs(Flex, { justifyContent: "space-between", alignItems: "center", mb: 4, children: [_jsx(Heading, { size: "lg", children: "Prompt Engineering Workbench" }), _jsxs(HStack, { children: [_jsx(Select, { placeholder: "Select model", value: selectedModel, onChange: function (e) { return setSelectedModel(e.target.value); }, w: "200px", children: models.map(function (model) { return (_jsx("option", { value: model.id, children: model.name }, model.id)); }) }), _jsx(Select, { placeholder: "Load template", value: activeTemplate || "", onChange: function (e) { return handleTemplateSelect(e.target.value); }, w: "250px", children: templates.map(function (template) { return (_jsx("option", { value: template.id, children: template.name }, template.id)); }) }), _jsx(Button, { colorScheme: "blue", onClick: handleSave, children: "Save Template" }), _jsx(Button, { colorScheme: "green", onClick: handleGenerate, isLoading: isGenerating, children: "Generate" })] })] }), _jsxs(Tabs, { variant: "enclosed", children: [_jsxs(TabList, { children: [_jsx(Tab, { children: "Edit Prompt" }), _jsx(Tab, { children: "Variables" }), _jsx(Tab, { children: "Test Cases" }), _jsx(Tab, { children: "Results" }), _jsx(Tab, { children: "Version History" })] }), _jsxs(TabPanels, { children: [_jsx(TabPanel, { children: _jsx(PromptEditor, { prompt: prompt, onChange: handlePromptChange }) }), _jsx(TabPanel, { children: _jsx(VariableManager, { variables: variables, onChange: handleVariablesChange }) }), _jsx(TabPanel, { children: _jsx(TestCaseManager, { testCases: testCases, onChange: handleTestCasesChange }) }), _jsx(TabPanel, { children: _jsx(ResultsViewer, { results: results }) }), _jsx(TabPanel, { children: _jsx(VersionHistory, { templateId: activeTemplate }) })] })] }), _jsx(PromptSaveModal, { isOpen: isOpen, onClose: onClose, onSave: function (name, description) {
                    saveTemplate({
                        id: activeTemplate || undefined,
                        name: name,
                        description: description,
                        content: prompt,
                        variables: variables,
                        testCases: testCases
                    });
                    toast({
                        title: 'Template saved',
                        status: 'success',
                    });
                }, initialData: activeTemplate ? templates.find(function (t) { return t.id === activeTemplate; }) : undefined })] }));
};
