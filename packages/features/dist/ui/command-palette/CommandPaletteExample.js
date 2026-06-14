"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandPaletteExample = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Example Usage of Command Palette
 *
 * This file demonstrates how to integrate the CommandPalette into your app
 */
const lucide_react_1 = require("lucide-react");
const index_js_1 = require("./index.js");
const CommandPaletteExample = () => {
    const { isOpen, isExecuting, executionResult, open, close, executeCommand, getRecentExecutions } = (0, index_js_1.useCommandPalette)({
        shortcut: 'Cmd+K', // Or 'Ctrl+K' for Windows/Linux
        onExecute: async (command) => {
            // Option 1: Execute via API
            return await (0, index_js_1.executeCommandAPI)(command, '/api/commands/execute');
            // Option 2: Custom execution logic
            // return {
            //   success: true,
            //   output: `Executed: ${command.command}`,
            // };
        },
        onOpen: () => {
            console.log('Command palette opened');
        },
        onClose: () => {
            console.log('Command palette closed');
        },
    });
    const recentExecutions = getRecentExecutions(5);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-gray-50", children: [(0, jsx_runtime_1.jsx)("header", { className: "bg-white border-b border-gray-200 px-6 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-7xl mx-auto flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Terminal, { className: "w-8 h-8 text-blue-600" }), (0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-bold text-gray-900", children: "The New Fuse Command Center" })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: open, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Command, { className: "w-5 h-5" }), "Open Command Palette", (0, jsx_runtime_1.jsx)("kbd", { className: "ml-2 px-2 py-1 text-xs bg-blue-700 rounded", children: "\u2318K" })] })] }) }), (0, jsx_runtime_1.jsxs)("main", { className: "max-w-7xl mx-auto px-6 py-12", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-3xl font-bold text-gray-900 mb-4", children: "Welcome to TNF Command Center" }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg text-gray-600 mb-6", children: "Access all 300+ commands, processes, and workflows through a unified interface." }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-blue-50 rounded-lg", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold text-blue-900 mb-2", children: "Development" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-blue-700", children: "Start dev servers, run builds, and manage your development environment" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-green-50 rounded-lg", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold text-green-900 mb-2", children: "Testing & Quality" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-green-700", children: "Run tests, lint code, check types, and ensure code quality" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-purple-50 rounded-lg", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold text-purple-900 mb-2", children: "Claude & Agents" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-purple-700", children: "Manage agents, create workflows, and leverage Claude capabilities" })] })] })] }), executionResult && ((0, jsx_runtime_1.jsx)("div", { className: `mb-8 p-6 rounded-xl border-2 ${executionResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-3", children: [executionResult.success ? ((0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { className: "w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.XCircle, { className: "w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" })), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsx)("h3", { className: `font-semibold mb-2 ${executionResult.success ? 'text-green-900' : 'text-red-900'}`, children: executionResult.success ? 'Command Executed Successfully' : 'Execution Failed' }), executionResult.output && ((0, jsx_runtime_1.jsx)("pre", { className: "mt-2 p-3 bg-white rounded-lg text-sm overflow-x-auto border border-gray-200", children: executionResult.output })), executionResult.error && ((0, jsx_runtime_1.jsxs)("p", { className: "mt-2 text-sm text-red-700 font-medium", children: ["Error: ", executionResult.error] })), executionResult.exitCode !== undefined && ((0, jsx_runtime_1.jsxs)("p", { className: "mt-2 text-sm text-gray-600", children: ["Exit code: ", executionResult.exitCode] }))] })] }) })), recentExecutions.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-xl font-bold text-gray-900 mb-4", children: "Recent Executions" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: recentExecutions.map((execution, index) => ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("code", { className: "text-sm font-mono text-gray-800", children: execution.command.command }), execution.result.success ? ((0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { className: "w-4 h-4 text-green-600" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.XCircle, { className: "w-4 h-4 text-red-600" }))] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500 mt-1", children: execution.timestamp.toLocaleString() })] }) }, index))) })] })), (0, jsx_runtime_1.jsxs)("div", { className: "mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [(0, jsx_runtime_1.jsx)(QuickAction, { title: "Start Dev Server", description: "Launch development environment", command: "pnpm dev", color: "blue", onClick: () => executeCommand({
                                    id: 'dev',
                                    name: 'Start Development',
                                    description: 'Start frontend + API gateway',
                                    command: 'pnpm dev',
                                    category: 'development',
                                    tags: ['dev', 'start'],
                                }) }), (0, jsx_runtime_1.jsx)(QuickAction, { title: "Run Tests", description: "Execute all test suites", command: "pnpm test", color: "green", onClick: () => executeCommand({
                                    id: 'test',
                                    name: 'Run All Tests',
                                    description: 'Run all tests via Turbo',
                                    command: 'pnpm test',
                                    category: 'test',
                                    tags: ['test'],
                                }) }), (0, jsx_runtime_1.jsx)(QuickAction, { title: "Build Project", description: "Production build", command: "pnpm build", color: "purple", onClick: () => executeCommand({
                                    id: 'build',
                                    name: 'Production Build',
                                    description: 'Main production build',
                                    command: 'pnpm build',
                                    category: 'build',
                                    tags: ['build'],
                                }) }), (0, jsx_runtime_1.jsx)(QuickAction, { title: "Type Check", description: "Validate TypeScript", command: "pnpm type-check", color: "orange", onClick: () => executeCommand({
                                    id: 'type-check',
                                    name: 'Type Check',
                                    description: 'TypeScript type checking',
                                    command: 'pnpm type-check',
                                    category: 'quality',
                                    tags: ['typescript', 'check'],
                                }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-12 bg-gray-100 rounded-xl p-6", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-bold text-gray-900 mb-4", children: "Keyboard Shortcuts" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsx)(ShortcutItem, { keys: ['⌘', 'K'], description: "Open Command Palette" }), (0, jsx_runtime_1.jsx)(ShortcutItem, { keys: ['↑', '↓'], description: "Navigate commands" }), (0, jsx_runtime_1.jsx)(ShortcutItem, { keys: ['Enter'], description: "Execute selected command" }), (0, jsx_runtime_1.jsx)(ShortcutItem, { keys: ['Esc'], description: "Close Command Palette" })] })] })] }), (0, jsx_runtime_1.jsx)(index_js_1.CommandPalette, { isOpen: isOpen, onClose: close, onExecute: executeCommand }), isExecuting && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold text-gray-900", children: "Executing Command" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-600 mt-1", children: "Please wait..." })] })] }) }) }))] }));
};
exports.CommandPaletteExample = CommandPaletteExample;
/**
 * Quick Action Card Component
 */
const QuickAction = ({ title, description, command, color, onClick }) => {
    const colors = {
        blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-900',
        green: 'bg-green-50 border-green-200 hover:bg-green-100 text-green-900',
        purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-900',
        orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-900',
    };
    return ((0, jsx_runtime_1.jsxs)("button", { onClick: onClick, className: `p-4 rounded-lg border-2 transition-colors text-left ${colors[color]}`, children: [(0, jsx_runtime_1.jsx)("h4", { className: "font-semibold mb-1", children: title }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm opacity-80 mb-2", children: description }), (0, jsx_runtime_1.jsx)("code", { className: "text-xs bg-white/50 px-2 py-1 rounded font-mono", children: command })] }));
};
/**
 * Keyboard Shortcut Item Component
 */
const ShortcutItem = ({ keys, description }) => {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex gap-1", children: keys.map((key, index) => ((0, jsx_runtime_1.jsx)("kbd", { className: "px-2 py-1 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded shadow-sm", children: key }, index))) }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm text-gray-600", children: description })] }));
};
exports.default = exports.CommandPaletteExample;
//# sourceMappingURL=CommandPaletteExample.js.map