"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentProgress = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Deployment Progress Step
 *
 * Show real-time deployment progress
 */
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const DeploymentProgress = ({ context, onDataChange, validationErrors = [], }) => {
    const [isDeploying, setIsDeploying] = (0, react_1.useState)(false);
    const [deploymentComplete, setDeploymentComplete] = (0, react_1.useState)(false);
    const [deploymentUrl, setDeploymentUrl] = (0, react_1.useState)(null);
    const [steps, setSteps] = (0, react_1.useState)([
        { id: '1', label: 'Preparing deployment', status: 'pending' },
        { id: '2', label: 'Building Docker image', status: 'pending' },
        { id: '3', label: 'Pushing to CloudRuntime', status: 'pending' },
        { id: '4', label: 'Starting container', status: 'pending' },
        { id: '5', label: 'Running health checks', status: 'pending' },
        { id: '6', label: 'Configuring networking', status: 'pending' },
    ]);
    const startDeployment = async () => {
        setIsDeploying(true);
        // Simulate deployment steps
        for (let i = 0; i < steps.length; i++) {
            // Update current step to running
            setSteps((prev) => prev.map((step, idx) => (idx === i ? { ...step, status: 'running' } : step)));
            // Simulate step duration
            await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));
            // Update step to completed
            setSteps((prev) => prev.map((step, idx) => idx === i
                ? {
                    ...step,
                    status: 'completed',
                    duration: 1500 + Math.floor(Math.random() * 1000),
                }
                : step));
        }
        setIsDeploying(false);
        setDeploymentComplete(true);
        setDeploymentUrl(`https://${context.data.cloud_runtimeProjectName || 'tnf-cloud-sandbox'}.thenewfuse.com`);
        onDataChange({ deploymentComplete: true, deploymentUrl });
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return (0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "w-5 h-5 text-green-500" });
            case 'running':
                return (0, jsx_runtime_1.jsx)(lucide_react_1.Loader, { className: "w-5 h-5 animate-spin text-blue-500" });
            case 'failed':
                return (0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "w-5 h-5 text-red-500" });
            default:
                return (0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "w-5 h-5 text-gray-400" });
        }
    };
    const completedSteps = steps.filter((s) => s.status === 'completed').length;
    const progress = (completedSteps / steps.length) * 100;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-step-deployment-progress", children: [(0, jsx_runtime_1.jsxs)("div", { className: "step-header", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Rocket, { className: "w-8 h-8 text-primary" }), (0, jsx_runtime_1.jsx)("h2", { className: "step-title", children: "Deploy to CloudRuntime" }), (0, jsx_runtime_1.jsxs)("p", { className: "step-description", children: ["Deploying to ", String(context.data.deploymentEnvironment || 'production'), " environment"] })] }), validationErrors.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "validation-errors", children: validationErrors.map((error, index) => ((0, jsx_runtime_1.jsx)("div", { className: "error-message", children: error }, index))) })), (0, jsx_runtime_1.jsxs)("div", { className: "deployment-container", children: [!isDeploying && !deploymentComplete && ((0, jsx_runtime_1.jsxs)("div", { className: "pre-deploy", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Ready to Deploy" }), (0, jsx_runtime_1.jsxs)("div", { className: "deploy-summary", children: [(0, jsx_runtime_1.jsxs)("div", { className: "summary-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "label", children: "Project:" }), (0, jsx_runtime_1.jsx)("span", { className: "value", children: String(context.data.cloud_runtimeProjectName || 'Unknown') })] }), (0, jsx_runtime_1.jsxs)("div", { className: "summary-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "label", children: "Environment:" }), (0, jsx_runtime_1.jsx)("span", { className: "value", children: String(context.data.deploymentEnvironment || 'staging') })] }), (0, jsx_runtime_1.jsxs)("div", { className: "summary-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "label", children: "Instance:" }), (0, jsx_runtime_1.jsx)("span", { className: "value", children: String(context.data.instanceType || 'basic') })] }), (0, jsx_runtime_1.jsxs)("div", { className: "summary-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "label", children: "Database:" }), (0, jsx_runtime_1.jsx)("span", { className: "value", children: context.data.enableDatabase ? 'PostgreSQL with pgvector' : 'None' })] })] }), (0, jsx_runtime_1.jsxs)("button", { className: "deploy-btn", onClick: startDeployment, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Rocket, { className: "w-5 h-5" }), "Start Deployment"] })] })), (isDeploying || deploymentComplete) && ((0, jsx_runtime_1.jsxs)("div", { className: "deploy-progress", children: [(0, jsx_runtime_1.jsx)("div", { className: "progress-bar", children: (0, jsx_runtime_1.jsx)("div", { className: "progress-fill", style: { width: `${progress}%` } }) }), (0, jsx_runtime_1.jsxs)("div", { className: "progress-text", children: [Math.round(progress), "% Complete"] }), (0, jsx_runtime_1.jsx)("div", { className: "deployment-steps", children: steps.map((step) => ((0, jsx_runtime_1.jsxs)("div", { className: `deployment-step ${step.status}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "step-icon", children: getStatusIcon(step.status) }), (0, jsx_runtime_1.jsxs)("div", { className: "step-content", children: [(0, jsx_runtime_1.jsx)("span", { className: "step-label", children: step.label }), step.duration && ((0, jsx_runtime_1.jsxs)("span", { className: "step-duration", children: [(step.duration / 1000).toFixed(1), "s"] }))] })] }, step.id))) })] })), deploymentComplete && ((0, jsx_runtime_1.jsxs)("div", { className: "deploy-success", children: [(0, jsx_runtime_1.jsx)("div", { className: "success-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "w-12 h-12" }) }), (0, jsx_runtime_1.jsx)("h3", { children: "Deployment Successful!" }), (0, jsx_runtime_1.jsx)("p", { children: "Your cloud sandbox is now live and running." }), deploymentUrl && ((0, jsx_runtime_1.jsxs)("a", { href: deploymentUrl, target: "_blank", rel: "noopener noreferrer", className: "deployment-url", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ExternalLink, { className: "w-4 h-4" }), deploymentUrl] })), (0, jsx_runtime_1.jsxs)("div", { className: "next-steps", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Next Steps" }), (0, jsx_runtime_1.jsxs)("ul", { children: [(0, jsx_runtime_1.jsx)("li", { children: "Configure environment variables in CloudRuntime dashboard" }), (0, jsx_runtime_1.jsx)("li", { children: "Set up monitoring and alerts" }), (0, jsx_runtime_1.jsx)("li", { children: "Test the deployment with a sample request" })] })] })] }))] })] }));
};
exports.DeploymentProgress = DeploymentProgress;
//# sourceMappingURL=DeploymentProgress.js.map