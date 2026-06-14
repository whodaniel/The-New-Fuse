"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudRuntimeConnection = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * CloudRuntime Connection Step
 *
 * Step for connecting to CloudRuntime and verifying authentication
 */
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const CloudRuntimeConnection = ({ context, onDataChange, validationErrors = [], }) => {
    const [status, setStatus] = (0, react_1.useState)(null);
    const [projects, setProjects] = (0, react_1.useState)([]);
    const [selectedProject, setSelectedProject] = (0, react_1.useState)(context.data.cloud_runtimeProject || '');
    const [isChecking, setIsChecking] = (0, react_1.useState)(false);
    const [apiToken, setApiToken] = (0, react_1.useState)(context.data.cloud_runtimeToken || '');
    const [showTokenInput, setShowTokenInput] = (0, react_1.useState)(false);
    const checkConnection = (0, react_1.useCallback)(async () => {
        setIsChecking(true);
        try {
            // Simulate CloudRuntime CLI check - in production this would run `cloud_runtime whoami`
            await new Promise((resolve) => setTimeout(resolve, 1500));
            // Simulate connection status
            const isConnected = true; // Would check actual CLI status
            setStatus({
                connected: isConnected,
                authenticated: isConnected,
                username: isConnected ? 'demo-user@example.com' : undefined,
            });
            if (isConnected) {
                // Simulate fetching projects
                await new Promise((resolve) => setTimeout(resolve, 500));
                setProjects([
                    {
                        id: 'proj-1',
                        name: 'the-new-fuse-production',
                        createdAt: '2024-01-15',
                        environments: ['production', 'staging'],
                    },
                    {
                        id: 'proj-2',
                        name: 'tnf-cloud-sandbox',
                        createdAt: '2024-01-10',
                        environments: ['production'],
                    },
                    {
                        id: 'proj-3',
                        name: 'tnf-development',
                        createdAt: '2024-01-01',
                        environments: ['development', 'testing'],
                    },
                ]);
                onDataChange({ cloud_runtimeConnected: true });
            }
        }
        catch (error) {
            setStatus({
                connected: false,
                authenticated: false,
                error: error instanceof Error ? error.message : 'Connection failed',
            });
            onDataChange({ cloud_runtimeConnected: false });
        }
        finally {
            setIsChecking(false);
        }
    }, [onDataChange]);
    (0, react_1.useEffect)(() => {
        checkConnection();
    }, []);
    const handleProjectSelect = (projectId) => {
        setSelectedProject(projectId);
        const project = projects.find((p) => p.id === projectId);
        onDataChange({
            cloud_runtimeProject: projectId,
            cloud_runtimeProjectName: project?.name,
            cloud_runtimeEnvironments: project?.environments,
        });
    };
    const handleTokenSubmit = async () => {
        if (!apiToken.trim())
            return;
        onDataChange({ cloud_runtimeToken: apiToken });
        setShowTokenInput(false);
        await checkConnection();
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-step-cloud_runtime", children: [(0, jsx_runtime_1.jsxs)("div", { className: "step-header", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Train, { className: "w-8 h-8 text-primary" }), (0, jsx_runtime_1.jsx)("h2", { className: "step-title", children: "Connect to CloudRuntime" }), (0, jsx_runtime_1.jsx)("p", { className: "step-description", children: "Connect your CloudRuntime account to deploy your cloud sandbox" })] }), validationErrors.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "validation-errors", children: validationErrors.map((error, index) => ((0, jsx_runtime_1.jsx)("div", { className: "error-message", children: error }, index))) })), (0, jsx_runtime_1.jsxs)("div", { className: "connection-section", children: [(0, jsx_runtime_1.jsxs)("div", { className: "status-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "status-header", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Connection Status" }), (0, jsx_runtime_1.jsxs)("button", { className: "refresh-btn", onClick: checkConnection, disabled: isChecking, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: `w-4 h-4 ${isChecking ? 'animate-spin' : ''}` }), "Refresh"] })] }), isChecking ? ((0, jsx_runtime_1.jsxs)("div", { className: "status-checking", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Loader, { className: "w-6 h-6 animate-spin" }), (0, jsx_runtime_1.jsx)("span", { children: "Checking CloudRuntime connection..." })] })) : status ? ((0, jsx_runtime_1.jsx)("div", { className: `status-result ${status.connected ? 'connected' : 'disconnected'}`, children: status.connected ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "w-6 h-6" }), (0, jsx_runtime_1.jsxs)("div", { className: "status-info", children: [(0, jsx_runtime_1.jsx)("span", { className: "status-label", children: "Connected" }), status.username && (0, jsx_runtime_1.jsx)("span", { className: "status-username", children: status.username })] })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "w-6 h-6" }), (0, jsx_runtime_1.jsxs)("div", { className: "status-info", children: [(0, jsx_runtime_1.jsx)("span", { className: "status-label", children: "Not Connected" }), status.error && (0, jsx_runtime_1.jsx)("span", { className: "status-error", children: status.error })] })] })) })) : null, !status?.connected && ((0, jsx_runtime_1.jsxs)("div", { className: "connection-options", children: [(0, jsx_runtime_1.jsxs)("button", { className: "option-btn primary", onClick: () => setShowTokenInput(true), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Key, { className: "w-4 h-4" }), "Use API Token"] }), (0, jsx_runtime_1.jsxs)("a", { href: "https://cloud_runtime.app/dashboard", target: "_blank", rel: "noopener noreferrer", className: "option-btn secondary", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ExternalLink, { className: "w-4 h-4" }), "Open CloudRuntime Dashboard"] }), (0, jsx_runtime_1.jsxs)("p", { className: "option-hint", children: ["Run ", (0, jsx_runtime_1.jsx)("code", { children: "cloud_runtime login" }), " in your terminal, or use an API token"] })] })), showTokenInput && ((0, jsx_runtime_1.jsxs)("div", { className: "token-input-section", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "api-token", children: "CloudRuntime API Token" }), (0, jsx_runtime_1.jsxs)("div", { className: "token-input-row", children: [(0, jsx_runtime_1.jsx)("input", { id: "api-token", type: "password", value: apiToken, onChange: (e) => setApiToken(e.target.value), placeholder: "Enter your CloudRuntime API token" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleTokenSubmit, children: "Connect" })] }), (0, jsx_runtime_1.jsx)("p", { className: "token-hint", children: "Get your token from CloudRuntime Dashboard \u2192 Account Settings \u2192 Tokens" })] }))] }), status?.connected && projects.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "projects-section", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Select Project" }), (0, jsx_runtime_1.jsx)("div", { className: "projects-grid", children: projects.map((project) => ((0, jsx_runtime_1.jsxs)("div", { className: `project-card ${selectedProject === project.id ? 'selected' : ''}`, onClick: () => handleProjectSelect(project.id), children: [(0, jsx_runtime_1.jsxs)("div", { className: "project-header", children: [(0, jsx_runtime_1.jsx)("h4", { children: project.name }), selectedProject === project.id && (0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "w-5 h-5 text-primary" })] }), (0, jsx_runtime_1.jsx)("div", { className: "project-meta", children: (0, jsx_runtime_1.jsxs)("span", { children: ["Created: ", project.createdAt] }) }), (0, jsx_runtime_1.jsx)("div", { className: "project-environments", children: project.environments.map((env) => ((0, jsx_runtime_1.jsx)("span", { className: "env-badge", children: env }, env))) })] }, project.id))) }), (0, jsx_runtime_1.jsx)("button", { className: "new-project-btn", children: "+ Create New Project" })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "step-tips", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Prerequisites" }), (0, jsx_runtime_1.jsxs)("ul", { children: [(0, jsx_runtime_1.jsxs)("li", { children: ["CloudRuntime CLI installed (", (0, jsx_runtime_1.jsx)("code", { children: "npm install -g @cloud_runtime/cli" }), ")"] }), (0, jsx_runtime_1.jsx)("li", { children: "CloudRuntime account with a project set up" }), (0, jsx_runtime_1.jsx)("li", { children: "Docker installed for local testing" })] })] })] }));
};
exports.CloudRuntimeConnection = CloudRuntimeConnection;
//# sourceMappingURL=CloudRuntimeConnection.js.map