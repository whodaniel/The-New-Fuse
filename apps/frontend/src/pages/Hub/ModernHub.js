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
/**
 * Modern Hub - Beautiful AI Agent & Workflow Interface
 * Integrated React component for The New Fuse Browser Hub
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ModernHub.css';
export var ModernHub = function () {
    var navigate = useNavigate();
    var _a = useState({
        'ai-services': [
            { name: 'Claude AI', status: 'active' },
            { name: 'Gemini', status: 'active' },
            { name: 'ChatGPT', status: 'active' },
            { name: 'Perplexity', status: 'active' },
        ],
        'workflow-services': [
            { name: 'Builder', status: 'active' },
            { name: 'My Workflows', status: 'active' },
            { name: 'Execute', status: 'inactive' },
            { name: 'Analytics', status: 'inactive' },
        ],
        'dev-services': [
            { name: 'Theia IDE', status: 'active', port: 3000 },
            { name: 'VS Code', status: 'inactive' },
            { name: 'Terminal', status: 'active' },
            { name: 'GitHub', status: 'inactive' },
        ],
        'automation-services': [
            { name: 'MCP Server', status: 'active' },
            { name: 'Puppeteer', status: 'active' },
            { name: 'Screenshot', status: 'active' },
            { name: 'Run Tests', status: 'active' },
        ],
    }), services = _a[0], setServices = _a[1];
    var _b = useState({
        activeWorkflows: 12,
        completedTasks: 1247,
        systemUptime: '99.9%',
        responseTime: '0.3s',
    }), metrics = _b[0], setMetrics = _b[1];
    var _c = useState('active'), coreStatus = _c[0], setCoreStatus = _c[1];
    var _d = useState('active'), aiStatus = _d[0], setAiStatus = _d[1];
    var _e = useState('active'), workflowStatus = _e[0], setWorkflowStatus = _e[1];
    useEffect(function () {
        // Check service status
        checkServiceStatus();
        // Update metrics periodically
        var metricsInterval = setInterval(updateMetrics, 5000);
        return function () { return clearInterval(metricsInterval); };
    }, []);
    var checkServiceStatus = function () { return __awaiter(void 0, void 0, void 0, function () {
        var coreResponse, _a, frontendResponse, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch('http://localhost:3000/api/health')];
                case 1:
                    coreResponse = _c.sent();
                    setCoreStatus(coreResponse.ok ? 'active' : 'error');
                    return [3 /*break*/, 3];
                case 2:
                    _a = _c.sent();
                    setCoreStatus('error');
                    return [3 /*break*/, 3];
                case 3:
                    _c.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, fetch('http://localhost:5173')];
                case 4:
                    frontendResponse = _c.sent();
                    setWorkflowStatus(frontendResponse.ok ? 'active' : 'error');
                    return [3 /*break*/, 6];
                case 5:
                    _b = _c.sent();
                    setWorkflowStatus('error');
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var updateMetrics = function () {
        setMetrics(function (prev) { return (__assign(__assign({}, prev), { activeWorkflows: prev.activeWorkflows + Math.floor(Math.random() * 3) - 1, completedTasks: prev.completedTasks + Math.floor(Math.random() * 5) })); });
    };
    var toggleService = function (category, serviceName) {
        setServices(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[category] = prev[category].map(function (service) {
                return service.name === serviceName
                    ? __assign(__assign({}, service), { status: service.status === 'active' ? 'inactive' : 'active' }) : service;
            }), _a)));
        });
    };
    var createNewWorkflow = function () {
        navigate('/workflows/builder');
    };
    var openWorkflowBuilder = function () {
        navigate('/workflows/builder');
    };
    var viewTemplates = function () {
        navigate('/workflows/templates');
    };
    var useTemplate = function (templateName) {
        navigate("/workflows/builder?template=".concat(templateName));
    };
    var openService = function (serviceName, port) {
        var serviceUrls = {
            'Theia IDE': "http://localhost:".concat(port || 3000),
            'Terminal': "http://localhost:".concat(port || 3000, "/terminal"),
            'My Workflows': '/workflows',
            'Builder': '/workflows/builder',
            'Analytics': '/analytics',
        };
        var url = serviceUrls[serviceName];
        if (url) {
            if (url.startsWith('http')) {
                window.open(url, '_blank');
            }
            else {
                navigate(url);
            }
        }
    };
    var getServiceCategoryStatus = function (category) {
        var categoryServices = services[category];
        var activeCount = categoryServices.filter(function (s) { return s.status === 'active'; }).length;
        var totalCount = categoryServices.length;
        if (activeCount === totalCount)
            return 'active';
        if (activeCount > 0)
            return 'warning';
        return 'error';
    };
    var getServiceCategoryIcon = function (category) {
        var icons = {
            'ai-services': '🤖',
            'workflow-services': '🔧',
            'dev-services': '💻',
            'automation-services': '⚙️',
        };
        return icons[category] || '🔧';
    };
    var getServiceCategoryTitle = function (category) {
        var titles = {
            'ai-services': 'AI Services',
            'workflow-services': 'Workflow Engine',
            'dev-services': 'Development',
            'automation-services': 'Automation',
        };
        return titles[category] || category;
    };
    return (_jsxs("div", { className: "modern-hub", children: [_jsxs("header", { className: "hub-header", children: [_jsxs("div", { className: "logo", children: [_jsx("span", { className: "logo-icon", children: "\uD83D\uDE80" }), _jsx("span", { className: "logo-text", children: "The New Fuse" })] }), _jsxs("div", { className: "status-bar", children: [_jsxs("div", { className: "status-indicator", children: [_jsx("div", { className: "status-dot ".concat(coreStatus) }), _jsx("span", { children: "Core Services" })] }), _jsxs("div", { className: "status-indicator", children: [_jsx("div", { className: "status-dot ".concat(aiStatus) }), _jsx("span", { children: "AI Agents" })] }), _jsxs("div", { className: "status-indicator", children: [_jsx("div", { className: "status-dot ".concat(workflowStatus) }), _jsx("span", { children: "Workflows" })] })] })] }), _jsxs("main", { className: "hub-content", children: [_jsxs("section", { className: "welcome-section", children: [_jsx("h1", { className: "welcome-title", children: "AI Agent & Workflow Hub" }), _jsx("p", { className: "welcome-subtitle", children: "Build, deploy, and manage intelligent workflows with drag-and-drop simplicity" }), _jsxs("div", { className: "quick-actions", children: [_jsxs("button", { className: "quick-action primary", onClick: createNewWorkflow, children: [_jsx("span", { className: "action-icon", children: "\u2795" }), "Create Workflow"] }), _jsxs("button", { className: "quick-action secondary", onClick: openWorkflowBuilder, children: [_jsx("span", { className: "action-icon", children: "\uD83D\uDD27" }), "Open Builder"] }), _jsxs("button", { className: "quick-action secondary", onClick: viewTemplates, children: [_jsx("span", { className: "action-icon", children: "\uD83D\uDCCB" }), "Templates"] })] })] }), _jsx("section", { className: "services-grid", children: Object.entries(services).map(function (_a) {
                            var category = _a[0], categoryServices = _a[1];
                            return (_jsxs("div", { className: "service-category ".concat(category), children: [_jsxs("div", { className: "category-header", children: [_jsxs("div", { className: "category-title", children: [_jsx("div", { className: "category-icon", children: getServiceCategoryIcon(category) }), _jsx("span", { children: getServiceCategoryTitle(category) })] }), _jsxs("div", { className: "category-status", children: [_jsx("div", { className: "status-dot ".concat(getServiceCategoryStatus(category)) }), _jsxs("span", { children: [categoryServices.filter(function (s) { return s.status === 'active'; }).length, "/", categoryServices.length, " Active"] })] })] }), _jsx("div", { className: "service-buttons", children: categoryServices.map(function (service) { return (_jsxs("button", { className: "service-btn ".concat(service.status), onClick: function () {
                                                if (service.status === 'active') {
                                                    openService(service.name, service.port);
                                                }
                                                else {
                                                    toggleService(category, service.name);
                                                }
                                            }, children: [_jsx("span", { className: "service-icon", children: service.status === 'active' ? '✅' : '⚪' }), service.name] }, service.name)); }) })] }, category));
                        }) }), _jsxs("section", { className: "workflow-section", children: [_jsxs("div", { className: "workflow-header", children: [_jsx("h2", { className: "workflow-title", children: "Workflow Templates" }), _jsxs("div", { className: "workflow-actions", children: [_jsxs("button", { className: "workflow-btn secondary", children: [_jsx("span", { className: "btn-icon", children: "\uD83D\uDCE4" }), "Import"] }), _jsxs("button", { className: "workflow-btn primary", onClick: createNewWorkflow, children: [_jsx("span", { className: "btn-icon", children: "\u2795" }), "New Workflow"] })] })] }), _jsxs("div", { className: "workflow-templates", children: [_jsxs("div", { className: "template-card", onClick: function () { return useTemplate('ai-research'); }, children: [_jsx("div", { className: "template-icon research", children: "\uD83D\uDD0D" }), _jsx("h3", { className: "template-title", children: "AI Research Assistant" }), _jsx("p", { className: "template-description", children: "Automated research workflow that gathers information, analyzes data, and generates comprehensive reports." })] }), _jsxs("div", { className: "template-card", onClick: function () { return useTemplate('content-creation'); }, children: [_jsx("div", { className: "template-icon content", children: "\u270D\uFE0F" }), _jsx("h3", { className: "template-title", children: "Content Creation Pipeline" }), _jsx("p", { className: "template-description", children: "End-to-end content creation from ideation to publication with AI-powered writing and editing." })] }), _jsxs("div", { className: "template-card", onClick: function () { return useTemplate('data-processing'); }, children: [_jsx("div", { className: "template-icon data", children: "\uD83D\uDCCA" }), _jsx("h3", { className: "template-title", children: "Data Processing Workflow" }), _jsx("p", { className: "template-description", children: "Automated data ingestion, cleaning, analysis, and visualization with intelligent insights." })] })] })] }), _jsxs("section", { className: "system-monitor", children: [_jsx("div", { className: "monitor-header", children: _jsx("h2", { className: "monitor-title", children: "System Performance" }) }), _jsxs("div", { className: "metrics-grid", children: [_jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-value", children: metrics.activeWorkflows }), _jsx("div", { className: "metric-label", children: "Active Workflows" })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-value", children: metrics.completedTasks.toLocaleString() }), _jsx("div", { className: "metric-label", children: "Tasks Completed" })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-value", children: metrics.systemUptime }), _jsx("div", { className: "metric-label", children: "System Uptime" })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-value", children: metrics.responseTime }), _jsx("div", { className: "metric-label", children: "Avg Response Time" })] })] })] })] })] }));
};
export default ModernHub;
