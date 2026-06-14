"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolutionSteps = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Solution Steps
 *
 * Guide users through fixing identified issues
 */
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const SOLUTIONS = [
    {
        id: 'fix-api-connection',
        title: 'Fix API Connection Issues',
        description: 'Steps to resolve API connectivity problems',
        forIssues: ['api-health', 'connection', 'API connection failed'],
        steps: [
            {
                id: '1',
                type: 'manual',
                title: 'Check if the API server is running',
                content: 'Verify that the API server is started and accessible on the expected port.',
            },
            {
                id: '2',
                type: 'command',
                title: 'Check API server status',
                content: 'pnpm dev:api',
                note: 'Run this in the project root to start the API server',
            },
            {
                id: '3',
                type: 'command',
                title: 'Test API health endpoint',
                content: 'curl http://localhost:3001/health',
                note: 'Should return {"status":"ok"}',
            },
            {
                id: '4',
                type: 'code',
                title: 'Check environment variables',
                content: `# .env file should contain:
API_URL=http://localhost:3001
API_KEY=your-api-key-here`,
            },
        ],
        docs: 'https://docs.thenewfuse.com/troubleshooting/api',
    },
    {
        id: 'fix-database',
        title: 'Fix Database Connection',
        description: 'Steps to resolve database connectivity issues',
        forIssues: ['db-connection', 'database', 'Cannot connect to database'],
        steps: [
            {
                id: '1',
                type: 'command',
                title: 'Check PostgreSQL status',
                content: 'pg_isready -h localhost -p 5432',
            },
            {
                id: '2',
                type: 'command',
                title: 'Start PostgreSQL (if using Docker)',
                content: 'docker-compose up -d postgres',
            },
            {
                id: '3',
                type: 'code',
                title: 'Verify DATABASE_URL',
                content: `# .env file:
DATABASE_URL="postgresql://user:password@localhost:5432/thenewfuse"`,
            },
            {
                id: '4',
                type: 'command',
                title: 'Run database migrations',
                content: 'pnpm db:migrate',
            },
        ],
        docs: 'https://docs.thenewfuse.com/troubleshooting/database',
    },
    {
        id: 'fix-cloud_runtime',
        title: 'Fix CloudRuntime Deployment',
        description: 'Steps to resolve CloudRuntime deployment issues',
        forIssues: ['deployment', 'Deploy to CloudRuntime', 'CloudRuntime deployment failing'],
        steps: [
            {
                id: '1',
                type: 'command',
                title: 'Login to CloudRuntime',
                content: 'cloud_runtime login',
            },
            {
                id: '2',
                type: 'command',
                title: 'Check CloudRuntime status',
                content: 'cloud_runtime status',
            },
            {
                id: '3',
                type: 'command',
                title: 'View deployment logs',
                content: 'cloud_runtime logs',
            },
            {
                id: '4',
                type: 'manual',
                title: 'Check environment variables',
                content: 'Verify all required environment variables are set in CloudRuntime dashboard',
            },
            {
                id: '5',
                type: 'command',
                title: 'Force redeploy',
                content: 'cloud_runtime up --detach',
            },
        ],
        docs: 'https://docs.thenewfuse.com/deployment/cloud_runtime',
    },
    {
        id: 'fix-permissions',
        title: 'Fix Permission Issues',
        description: 'Steps to resolve access and permission problems',
        forIssues: ['access', 'permission denied', 'Permission denied errors'],
        steps: [
            {
                id: '1',
                type: 'manual',
                title: 'Check your role',
                content: 'Verify your user role in the admin dashboard. You may need elevated permissions.',
            },
            {
                id: '2',
                type: 'manual',
                title: 'Check token expiration',
                content: 'Your authentication token may have expired. Try logging out and logging back in.',
            },
            {
                id: '3',
                type: 'code',
                title: 'Verify JWT configuration',
                content: `# Check JWT_SECRET is set
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d`,
            },
            {
                id: '4',
                type: 'manual',
                title: 'Contact administrator',
                content: 'If you believe you should have access, contact your organization administrator.',
            },
        ],
        docs: 'https://docs.thenewfuse.com/security/rbac',
    },
];
const SolutionSteps = ({ context, onDataChange, validationErrors = [], }) => {
    const [completedSteps, setCompletedSteps] = (0, react_1.useState)(context.data.completedSolutionSteps || []);
    const [expandedSolutions, setExpandedSolutions] = (0, react_1.useState)(['fix-api-connection']);
    const [copiedCommand, setCopiedCommand] = (0, react_1.useState)(null);
    // Find relevant solutions based on context
    const problemCategory = context.data.problemCategory;
    const problemDescription = context.data.problemDescription;
    const diagnosticResults = context.data.diagnosticResults;
    const relevantSolutions = SOLUTIONS.filter((solution) => {
        // Match based on problem category
        if (problemCategory &&
            solution.forIssues.some((issue) => issue.toLowerCase().includes(problemCategory.toLowerCase()))) {
            return true;
        }
        // Match based on problem description
        if (problemDescription &&
            solution.forIssues.some((issue) => problemDescription.toLowerCase().includes(issue.toLowerCase()) ||
                issue.toLowerCase().includes(problemDescription.toLowerCase()))) {
            return true;
        }
        // Match based on failed diagnostics
        if (diagnosticResults) {
            const failedChecks = diagnosticResults.filter((r) => r.status === 'failed').map((r) => r.id);
            return solution.forIssues.some((issue) => failedChecks.includes(issue));
        }
        return false;
    });
    const toggleSolution = (solutionId) => {
        setExpandedSolutions((prev) => prev.includes(solutionId) ? prev.filter((id) => id !== solutionId) : [...prev, solutionId]);
    };
    const toggleStepComplete = (stepId) => {
        const newCompleted = completedSteps.includes(stepId)
            ? completedSteps.filter((id) => id !== stepId)
            : [...completedSteps, stepId];
        setCompletedSteps(newCompleted);
        onDataChange({ completedSolutionSteps: newCompleted });
    };
    const copyToClipboard = async (text, stepId) => {
        await navigator.clipboard.writeText(text);
        setCopiedCommand(stepId);
        setTimeout(() => setCopiedCommand(null), 2000);
    };
    const getStepIcon = (type) => {
        switch (type) {
            case 'command':
                return (0, jsx_runtime_1.jsx)(lucide_react_1.Terminal, { className: "w-4 h-4" });
            case 'code':
                return (0, jsx_runtime_1.jsx)(lucide_react_1.FileCode, { className: "w-4 h-4" });
            case 'info':
                return (0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "w-4 h-4" });
            default:
                return (0, jsx_runtime_1.jsx)(lucide_react_1.Wrench, { className: "w-4 h-4" });
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "wizard-step-solutions", children: [(0, jsx_runtime_1.jsxs)("div", { className: "step-header", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Wrench, { className: "w-8 h-8 text-primary" }), (0, jsx_runtime_1.jsx)("h2", { className: "step-title", children: "Solution Steps" }), (0, jsx_runtime_1.jsx)("p", { className: "step-description", children: "Follow these steps to resolve your issue" })] }), validationErrors.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "validation-errors", children: validationErrors.map((error, index) => ((0, jsx_runtime_1.jsx)("div", { className: "error-message", children: error }, index))) })), (0, jsx_runtime_1.jsx)("div", { className: "solutions-container", children: relevantSolutions.length === 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "no-solutions", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "w-12 h-12" }), (0, jsx_runtime_1.jsx)("h3", { children: "No specific solutions found" }), (0, jsx_runtime_1.jsx)("p", { children: "Try running diagnostics or describing your issue in more detail." })] })) : (relevantSolutions.map((solution) => {
                    const isExpanded = expandedSolutions.includes(solution.id);
                    const solutionCompletedSteps = solution.steps.filter((step) => completedSteps.includes(`${solution.id}-${step.id}`)).length;
                    return ((0, jsx_runtime_1.jsxs)("div", { className: "solution-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "solution-header", onClick: () => toggleSolution(solution.id), children: [(0, jsx_runtime_1.jsxs)("div", { className: "solution-info", children: [(0, jsx_runtime_1.jsx)("h3", { children: solution.title }), (0, jsx_runtime_1.jsx)("p", { children: solution.description }), (0, jsx_runtime_1.jsxs)("div", { className: "solution-progress", children: [solutionCompletedSteps, "/", solution.steps.length, " steps completed"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "solution-toggle", children: isExpanded ? (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronUp, {}) : (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, {}) })] }), isExpanded && ((0, jsx_runtime_1.jsxs)("div", { className: "solution-steps", children: [solution.steps.map((step) => {
                                        const stepKey = `${solution.id}-${step.id}`;
                                        const isCompleted = completedSteps.includes(stepKey);
                                        return ((0, jsx_runtime_1.jsxs)("div", { className: `solution-step ${step.type} ${isCompleted ? 'completed' : ''}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "step-checkbox", children: (0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: isCompleted, onChange: () => toggleStepComplete(stepKey) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "step-content", children: [(0, jsx_runtime_1.jsxs)("div", { className: "step-title", children: [getStepIcon(step.type), (0, jsx_runtime_1.jsx)("span", { children: step.title })] }), step.type === 'command' || step.type === 'code' ? ((0, jsx_runtime_1.jsxs)("div", { className: "code-block", children: [(0, jsx_runtime_1.jsx)("pre", { children: step.content }), (0, jsx_runtime_1.jsx)("button", { className: "copy-btn", onClick: () => copyToClipboard(step.content, stepKey), children: copiedCommand === stepKey ? ((0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "w-4 h-4" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.Copy, { className: "w-4 h-4" })) })] })) : ((0, jsx_runtime_1.jsx)("p", { className: "step-description", children: step.content })), step.note && (0, jsx_runtime_1.jsx)("p", { className: "step-note", children: step.note })] })] }, step.id));
                                    }), solution.docs && ((0, jsx_runtime_1.jsxs)("a", { href: solution.docs, target: "_blank", rel: "noopener noreferrer", className: "docs-link", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ExternalLink, { className: "w-4 h-4" }), "View Documentation"] }))] }))] }, solution.id));
                })) }), (0, jsx_runtime_1.jsxs)("div", { className: "step-tips", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Still having issues?" }), (0, jsx_runtime_1.jsxs)("ul", { children: [(0, jsx_runtime_1.jsx)("li", { children: "Check the full documentation for more detailed guides" }), (0, jsx_runtime_1.jsx)("li", { children: "Search the community forums for similar issues" }), (0, jsx_runtime_1.jsx)("li", { children: "Contact support with your diagnostic results" })] })] })] }));
};
exports.SolutionSteps = SolutionSteps;
//# sourceMappingURL=SolutionSteps.js.map