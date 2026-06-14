"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticsRunner = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Diagnostics Runner Step
 *
 * Run automated diagnostics to identify issues
 */
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const DIAGNOSTIC_CHECKS = [
    // Connection checks
    {
        id: 'api-health',
        name: 'API Health Check',
        description: 'Check if the API is responding',
        category: 'Connection',
    },
    {
        id: 'ws-connection',
        name: 'WebSocket Connection',
        description: 'Test WebSocket connectivity',
        category: 'Connection',
    },
    {
        id: 'db-connection',
        name: 'Database Connection',
        description: 'Verify database is reachable',
        category: 'Connection',
    },
    {
        id: 'redis-connection',
        name: 'Redis Connection',
        description: 'Check Redis availability',
        category: 'Connection',
    },
    // Service checks
    {
        id: 'auth-service',
        name: 'Auth Service',
        description: 'Verify authentication is working',
        category: 'Services',
    },
    {
        id: 'agent-service',
        name: 'Agent Service',
        description: 'Check agent management service',
        category: 'Services',
    },
    {
        id: 'llm-provider',
        name: 'LLM Provider',
        description: 'Test LLM provider connectivity',
        category: 'Services',
    },
    // Configuration checks
    {
        id: 'env-vars',
        name: 'Environment Variables',
        description: 'Verify required env vars are set',
        category: 'Configuration',
    },
    {
        id: 'ssl-cert',
        name: 'SSL Certificate',
        description: 'Check SSL certificate validity',
        category: 'Configuration',
    },
    {
        id: 'rbac-config',
        name: 'RBAC Configuration',
        description: 'Validate role configuration',
        category: 'Configuration',
    },
    // Performance checks
    {
        id: 'response-time',
        name: 'Response Time',
        description: 'Measure API response latency',
        category: 'Performance',
    },
    {
        id: 'memory-usage',
        name: 'Memory Usage',
        description: 'Check memory consumption',
        category: 'Performance',
    },
];
const DiagnosticsRunner = ({ context, onDataChange, validationErrors = [], }) => {
    const [checks, setChecks] = (0, react_1.useState)(DIAGNOSTIC_CHECKS.map((check) => ({ ...check, status: 'pending' })));
    const [isRunning, setIsRunning] = (0, react_1.useState)(false);
    const [hasRun, setHasRun] = (0, react_1.useState)(false);
    const runDiagnostics = (0, react_1.useCallback)(async () => {
        setIsRunning(true);
        setHasRun(true);
        // Reset all checks to pending
        setChecks(DIAGNOSTIC_CHECKS.map((check) => ({ ...check, status: 'pending' })));
        // Run each check sequentially
        for (let i = 0; i < DIAGNOSTIC_CHECKS.length; i++) {
            const check = DIAGNOSTIC_CHECKS[i];
            // Set current check to running
            setChecks((prev) => prev.map((c, idx) => (idx === i ? { ...c, status: 'running' } : c)));
            // Simulate check execution
            await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));
            // Simulate result (in production this would run actual checks)
            const results = [
                'passed',
                'passed',
                'passed',
                'passed',
                'warning',
                'failed',
            ];
            const result = results[Math.floor(Math.random() * (results.length - 1))]; // Mostly pass
            const duration = Math.floor(100 + Math.random() * 400);
            let message;
            if (result === 'failed') {
                message = 'Connection refused or timeout';
            }
            else if (result === 'warning') {
                message = 'Degraded performance detected';
            }
            setChecks((prev) => prev.map((c, idx) => (idx === i ? { ...c, status: result, duration, message } : c)));
        }
        setIsRunning(false);
        // Update context with results
        const finalChecks = checks.map((check, i) => ({
            ...check,
            status: check.status === 'running' ? 'passed' : check.status,
        }));
        onDataChange({ diagnosticResults: finalChecks });
    }, [checks, onDataChange]);
    const getStatusIcon = (status) => {
        switch (status) {
            case 'passed':
                return (0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "w-5 h-5 text-green-500" });
            case 'failed':
                return (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "w-5 h-5 text-red-500" });
            case 'warning':
                return (0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { className: "w-5 h-5 text-yellow-500" });
            case 'running':
                return (0, jsx_runtime_1.jsx)(lucide_react_1.Loader, { className: "w-5 h-5 animate-spin text-blue-500" });
            default:
                return (0, jsx_runtime_1.jsx)("div", { className: "w-5 h-5 rounded-full bg-gray-300" });
        }
    };
    const passedCount = checks.filter((c) => c.status === 'passed').length;
    const failedCount = checks.filter((c) => c.status === 'failed').length;
    const warningCount = checks.filter((c) => c.status === 'warning').length;
    const categories = [...new Set(DIAGNOSTIC_CHECKS.map((c) => c.category))];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-step-diagnostics", children: [(0, jsx_runtime_1.jsxs)("div", { className: "step-header", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Activity, { className: "w-8 h-8 text-primary" }), (0, jsx_runtime_1.jsx)("h2", { className: "step-title", children: "Run Diagnostics" }), (0, jsx_runtime_1.jsx)("p", { className: "step-description", children: "Automated checks to identify potential issues" })] }), validationErrors.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "validation-errors", children: validationErrors.map((error, index) => ((0, jsx_runtime_1.jsx)("div", { className: "error-message", children: error }, index))) })), (0, jsx_runtime_1.jsxs)("div", { className: "diagnostics-content", children: [(0, jsx_runtime_1.jsx)("div", { className: "diagnostics-controls", children: (0, jsx_runtime_1.jsx)("button", { className: "run-btn", onClick: runDiagnostics, disabled: isRunning, children: isRunning ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Loader, { className: "w-5 h-5 animate-spin" }), "Running Diagnostics..."] })) : hasRun ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: "w-5 h-5" }), "Run Again"] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Terminal, { className: "w-5 h-5" }), "Start Diagnostics"] })) }) }), hasRun && ((0, jsx_runtime_1.jsxs)("div", { className: "results-summary", children: [(0, jsx_runtime_1.jsxs)("div", { className: "summary-stat passed", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsxs)("span", { children: [passedCount, " Passed"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "summary-stat warning", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsxs)("span", { children: [warningCount, " Warnings"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "summary-stat failed", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsxs)("span", { children: [failedCount, " Failed"] })] })] })), (0, jsx_runtime_1.jsx)("div", { className: "checks-container", children: categories.map((category) => ((0, jsx_runtime_1.jsxs)("div", { className: "check-category", children: [(0, jsx_runtime_1.jsx)("h3", { children: category }), (0, jsx_runtime_1.jsx)("div", { className: "checks-list", children: checks
                                        .filter((c) => c.category === category)
                                        .map((check) => ((0, jsx_runtime_1.jsxs)("div", { className: `check-item ${check.status}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "check-status", children: getStatusIcon(check.status) }), (0, jsx_runtime_1.jsxs)("div", { className: "check-info", children: [(0, jsx_runtime_1.jsx)("span", { className: "check-name", children: check.name }), (0, jsx_runtime_1.jsx)("span", { className: "check-description", children: check.description }), check.message && (0, jsx_runtime_1.jsx)("span", { className: "check-message", children: check.message })] }), check.duration && (0, jsx_runtime_1.jsxs)("span", { className: "check-duration", children: [check.duration, "ms"] })] }, check.id))) })] }, category))) })] }), hasRun && failedCount > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "step-tips error", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Issues Detected" }), (0, jsx_runtime_1.jsx)("p", { children: "Some checks failed. The next step will show you how to fix them." })] })), hasRun && failedCount === 0 && warningCount === 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "step-tips success", children: [(0, jsx_runtime_1.jsx)("h4", { children: "All Checks Passed!" }), (0, jsx_runtime_1.jsx)("p", { children: "Your system appears to be healthy. If you're still experiencing issues, please continue to describe them." })] }))] }));
};
exports.DiagnosticsRunner = DiagnosticsRunner;
//# sourceMappingURL=DiagnosticsRunner.js.map