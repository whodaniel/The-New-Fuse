"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentConfiguration = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Deployment Configuration Step
 *
 * Configure deployment settings for CloudRuntime
 */
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const ENVIRONMENTS = [
    { id: 'production', label: 'Production', description: 'Live environment for end users' },
    { id: 'staging', label: 'Staging', description: 'Pre-production testing environment' },
    { id: 'development', label: 'Development', description: 'Development and testing' },
];
const INSTANCE_TYPES = [
    { id: 'hobby', label: 'Hobby', cpu: '0.5 vCPU', memory: '512 MB', price: '$5/month' },
    { id: 'basic', label: 'Basic', cpu: '1 vCPU', memory: '1 GB', price: '$10/month' },
    { id: 'standard', label: 'Standard', cpu: '2 vCPU', memory: '2 GB', price: '$25/month' },
    { id: 'performance', label: 'Performance', cpu: '4 vCPU', memory: '4 GB', price: '$50/month' },
];
const DeploymentConfiguration = ({ context, onDataChange, validationErrors = [], }) => {
    const [environment, setEnvironment] = (0, react_1.useState)(context.data.deploymentEnvironment || 'staging');
    const [instanceType, setInstanceType] = (0, react_1.useState)(context.data.instanceType || 'basic');
    const [enableDatabase, setEnableDatabase] = (0, react_1.useState)(context.data.enableDatabase ?? true);
    const [enableSSL, setEnableSSL] = (0, react_1.useState)(context.data.enableSSL ?? true);
    const [customDomain, setCustomDomain] = (0, react_1.useState)(context.data.customDomain || '');
    const [autoScaling, setAutoScaling] = (0, react_1.useState)(context.data.autoScaling ?? false);
    const handleChange = (key, value) => {
        onDataChange({ [key]: value });
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-step-deployment-config", children: [(0, jsx_runtime_1.jsxs)("div", { className: "step-header", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Settings, { className: "w-8 h-8 text-primary" }), (0, jsx_runtime_1.jsx)("h2", { className: "step-title", children: "Configure Deployment" }), (0, jsx_runtime_1.jsxs)("p", { className: "step-description", children: ["Set up your deployment configuration for", ' ', String(context.data.cloud_runtimeProjectName || 'your project')] })] }), validationErrors.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "validation-errors", children: validationErrors.map((error, index) => ((0, jsx_runtime_1.jsx)("div", { className: "error-message", children: error }, index))) })), (0, jsx_runtime_1.jsxs)("div", { className: "config-sections", children: [(0, jsx_runtime_1.jsxs)("div", { className: "config-section", children: [(0, jsx_runtime_1.jsxs)("h3", { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Server, { className: "w-5 h-5" }), " Environment"] }), (0, jsx_runtime_1.jsx)("div", { className: "environment-options", children: ENVIRONMENTS.map((env) => ((0, jsx_runtime_1.jsxs)("div", { className: `environment-card ${environment === env.id ? 'selected' : ''}`, onClick: () => {
                                        setEnvironment(env.id);
                                        handleChange('deploymentEnvironment', env.id);
                                    }, children: [(0, jsx_runtime_1.jsx)("h4", { children: env.label }), (0, jsx_runtime_1.jsx)("p", { children: env.description })] }, env.id))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "config-section", children: [(0, jsx_runtime_1.jsxs)("h3", { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "w-5 h-5" }), " Instance Type"] }), (0, jsx_runtime_1.jsx)("div", { className: "instance-grid", children: INSTANCE_TYPES.map((type) => ((0, jsx_runtime_1.jsxs)("div", { className: `instance-card ${instanceType === type.id ? 'selected' : ''}`, onClick: () => {
                                        setInstanceType(type.id);
                                        handleChange('instanceType', type.id);
                                    }, children: [(0, jsx_runtime_1.jsx)("h4", { children: type.label }), (0, jsx_runtime_1.jsxs)("div", { className: "instance-specs", children: [(0, jsx_runtime_1.jsx)("span", { children: type.cpu }), (0, jsx_runtime_1.jsx)("span", { children: type.memory })] }), (0, jsx_runtime_1.jsx)("div", { className: "instance-price", children: type.price })] }, type.id))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "config-section", children: [(0, jsx_runtime_1.jsxs)("h3", { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Database, { className: "w-5 h-5" }), " Database"] }), (0, jsx_runtime_1.jsxs)("label", { className: "toggle-option", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: enableDatabase, onChange: (e) => {
                                            setEnableDatabase(e.target.checked);
                                            handleChange('enableDatabase', e.target.checked);
                                        } }), (0, jsx_runtime_1.jsx)("span", { className: "toggle-label", children: "Enable PostgreSQL Database" }), (0, jsx_runtime_1.jsx)("span", { className: "toggle-description", children: "Includes pgvector extension for vector embeddings" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "config-section", children: [(0, jsx_runtime_1.jsxs)("h3", { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Shield, { className: "w-5 h-5" }), " Security"] }), (0, jsx_runtime_1.jsxs)("label", { className: "toggle-option", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: enableSSL, onChange: (e) => {
                                            setEnableSSL(e.target.checked);
                                            handleChange('enableSSL', e.target.checked);
                                        } }), (0, jsx_runtime_1.jsx)("span", { className: "toggle-label", children: "Enable SSL/TLS" }), (0, jsx_runtime_1.jsx)("span", { className: "toggle-description", children: "Secure all traffic with HTTPS" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "config-section", children: [(0, jsx_runtime_1.jsxs)("h3", { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Globe, { className: "w-5 h-5" }), " Custom Domain (Optional)"] }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "form-input", placeholder: "api.yourdomain.com", value: customDomain, onChange: (e) => {
                                    setCustomDomain(e.target.value);
                                    handleChange('customDomain', e.target.value);
                                } }), (0, jsx_runtime_1.jsx)("p", { className: "form-hint", children: "You can configure this later in CloudRuntime dashboard" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "config-section", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Advanced Options" }), (0, jsx_runtime_1.jsxs)("label", { className: "toggle-option", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: autoScaling, onChange: (e) => {
                                            setAutoScaling(e.target.checked);
                                            handleChange('autoScaling', e.target.checked);
                                        } }), (0, jsx_runtime_1.jsx)("span", { className: "toggle-label", children: "Enable Auto-scaling" }), (0, jsx_runtime_1.jsx)("span", { className: "toggle-description", children: "Automatically scale based on traffic (Premium feature)" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "cost-summary", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Estimated Monthly Cost" }), (0, jsx_runtime_1.jsxs)("div", { className: "cost-breakdown", children: [(0, jsx_runtime_1.jsxs)("div", { className: "cost-item", children: [(0, jsx_runtime_1.jsxs)("span", { children: ["Instance (", INSTANCE_TYPES.find((t) => t.id === instanceType)?.label, ")"] }), (0, jsx_runtime_1.jsx)("span", { children: INSTANCE_TYPES.find((t) => t.id === instanceType)?.price })] }), enableDatabase && ((0, jsx_runtime_1.jsxs)("div", { className: "cost-item", children: [(0, jsx_runtime_1.jsx)("span", { children: "PostgreSQL Database" }), (0, jsx_runtime_1.jsx)("span", { children: "$5/month" })] })), (0, jsx_runtime_1.jsxs)("div", { className: "cost-total", children: [(0, jsx_runtime_1.jsx)("span", { children: "Total" }), (0, jsx_runtime_1.jsxs)("span", { children: ["$", parseInt(INSTANCE_TYPES.find((t) => t.id === instanceType)?.price.replace(/[^0-9]/g, '') ||
                                                '0') + (enableDatabase ? 5 : 0), "/month"] })] })] })] })] }));
};
exports.DeploymentConfiguration = DeploymentConfiguration;
//# sourceMappingURL=DeploymentConfiguration.js.map