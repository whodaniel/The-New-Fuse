/**
 * Example Usage of Command Palette
 *
 * This file demonstrates how to integrate the CommandPalette into your app
 */

import { CheckCircle, Command, Terminal, XCircle } from 'lucide-react';
import React from 'react';
import { CommandPalette, executeCommandAPI, useCommandPalette } from './index';

export const CommandPaletteExample: React.FC = () => {
  const { isOpen, isExecuting, executionResult, open, close, executeCommand, getRecentExecutions } =
    useCommandPalette({
      shortcut: 'Cmd+K', // Or 'Ctrl+K' for Windows/Linux
      onExecute: async (command) => {
        // Option 1: Execute via API
        return await executeCommandAPI(command, '/api/commands/execute');

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">The New Fuse Command Center</h1>
          </div>

          <button
            onClick={open}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Command className="w-5 h-5" />
            Open Command Palette
            <kbd className="ml-2 px-2 py-1 text-xs bg-blue-700 rounded">⌘K</kbd>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Message */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to TNF Command Center</h2>
          <p className="text-lg text-gray-600 mb-6">
            Access all 300+ commands, processes, and workflows through a unified interface.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Development</h3>
              <p className="text-sm text-blue-700">
                Start dev servers, run builds, and manage your development environment
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Testing & Quality</h3>
              <p className="text-sm text-green-700">
                Run tests, lint code, check types, and ensure code quality
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">Claude & Agents</h3>
              <p className="text-sm text-purple-700">
                Manage agents, create workflows, and leverage Claude capabilities
              </p>
            </div>
          </div>
        </div>

        {/* Execution Result */}
        {executionResult && (
          <div
            className={`mb-8 p-6 rounded-xl border-2 ${
              executionResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {executionResult.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3
                  className={`font-semibold mb-2 ${
                    executionResult.success ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {executionResult.success ? 'Command Executed Successfully' : 'Execution Failed'}
                </h3>
                {executionResult.output && (
                  <pre className="mt-2 p-3 bg-white rounded-lg text-sm overflow-x-auto border border-gray-200">
                    {executionResult.output}
                  </pre>
                )}
                {executionResult.error && (
                  <p className="mt-2 text-sm text-red-700 font-medium">
                    Error: {executionResult.error}
                  </p>
                )}
                {executionResult.exitCode !== undefined && (
                  <p className="mt-2 text-sm text-gray-600">
                    Exit code: {executionResult.exitCode}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Executions */}
        {recentExecutions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Executions</h3>
            <div className="space-y-3">
              {recentExecutions.map((execution, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-gray-800">
                        {execution.command.command}
                      </code>
                      {execution.result.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {execution.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            title="Start Dev Server"
            description="Launch development environment"
            command="pnpm dev"
            color="blue"
            onClick={() =>
              executeCommand({
                id: 'dev',
                name: 'Start Development',
                description: 'Start frontend + API gateway',
                command: 'pnpm dev',
                category: 'development',
                tags: ['dev', 'start'],
              })
            }
          />
          <QuickAction
            title="Run Tests"
            description="Execute all test suites"
            command="pnpm test"
            color="green"
            onClick={() =>
              executeCommand({
                id: 'test',
                name: 'Run All Tests',
                description: 'Run all tests via Turbo',
                command: 'pnpm test',
                category: 'test',
                tags: ['test'],
              })
            }
          />
          <QuickAction
            title="Build Project"
            description="Production build"
            command="pnpm build"
            color="purple"
            onClick={() =>
              executeCommand({
                id: 'build',
                name: 'Production Build',
                description: 'Main production build',
                command: 'pnpm build',
                category: 'build',
                tags: ['build'],
              })
            }
          />
          <QuickAction
            title="Type Check"
            description="Validate TypeScript"
            command="pnpm type-check"
            color="orange"
            onClick={() =>
              executeCommand({
                id: 'type-check',
                name: 'Type Check',
                description: 'TypeScript type checking',
                command: 'pnpm type-check',
                category: 'quality',
                tags: ['typescript', 'check'],
              })
            }
          />
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="mt-12 bg-gray-100 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ShortcutItem keys={['⌘', 'K']} description="Open Command Palette" />
            <ShortcutItem keys={['↑', '↓']} description="Navigate commands" />
            <ShortcutItem keys={['Enter']} description="Execute selected command" />
            <ShortcutItem keys={['Esc']} description="Close Command Palette" />
          </div>
        </div>
      </main>

      {/* Command Palette */}
      <CommandPalette isOpen={isOpen} onClose={close} onExecute={executeCommand} />

      {/* Loading Overlay */}
      {isExecuting && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div>
                <h3 className="font-semibold text-gray-900">Executing Command</h3>
                <p className="text-sm text-gray-600 mt-1">Please wait...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Quick Action Card Component
 */
const QuickAction: React.FC<{
  title: string;
  description: string;
  command: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  onClick: () => void;
}> = ({ title, description, command, color, onClick }) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-900',
    green: 'bg-green-50 border-green-200 hover:bg-green-100 text-green-900',
    purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-900',
    orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-900',
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition-colors text-left ${colors[color]}`}
    >
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-sm opacity-80 mb-2">{description}</p>
      <code className="text-xs bg-white/50 px-2 py-1 rounded font-mono">{command}</code>
    </button>
  );
};

/**
 * Keyboard Shortcut Item Component
 */
const ShortcutItem: React.FC<{
  keys: string[];
  description: string;
}> = ({ keys, description }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {keys.map((key, index) => (
          <kbd
            key={index}
            className="px-2 py-1 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded shadow-sm"
          >
            {key}
          </kbd>
        ))}
      </div>
      <span className="text-sm text-gray-600">{description}</span>
    </div>
  );
};

export default CommandPaletteExample;
