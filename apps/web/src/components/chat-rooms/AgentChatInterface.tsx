import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Cpu,
  ListChecks,
  Workflow,
  FileText,
  TrendingUp,
  Zap,
  Brain,
  Target,
} from 'lucide-react';
import ChatRoomView from './ChatRoomView';

interface AgentAction {
  id: string;
  type: 'summary' | 'task' | 'workflow' | 'command' | 'analysis';
  icon: React.ReactNode;
  label: string;
  description: string;
}

interface AgentChatInterfaceProps {
  roomId: string;
  agentId: string;
  apiBaseUrl?: string;
  wsUrl?: string;
}

export const AgentChatInterface: React.FC<AgentChatInterfaceProps> = ({
  roomId,
  agentId,
  apiBaseUrl = '/api',
  wsUrl = 'http://localhost:3001',
}) => {
  const [showAgentPanel, setShowAgentPanel] = useState(true);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'MEDIUM',
  });
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  const agentActions: AgentAction[] = [
    {
      id: 'summary',
      type: 'summary',
      icon: <FileText className="w-5 h-5" />,
      label: 'Summarize',
      description: 'Generate conversation summary',
    },
    {
      id: 'suggestions',
      type: 'analysis',
      icon: <Brain className="w-5 h-5" />,
      label: 'Suggest Actions',
      description: 'AI-powered next steps',
    },
    {
      id: 'create-task',
      type: 'task',
      icon: <ListChecks className="w-5 h-5" />,
      label: 'Create Task',
      description: 'Assign tasks from discussion',
    },
    {
      id: 'trigger-workflow',
      type: 'workflow',
      icon: <Workflow className="w-5 h-5" />,
      label: 'Trigger Workflow',
      description: 'Execute automated workflows',
    },
    {
      id: 'execute-command',
      type: 'command',
      icon: <Zap className="w-5 h-5" />,
      label: 'Execute Command',
      description: 'Run agent commands',
    },
    {
      id: 'analyze',
      type: 'analysis',
      icon: <TrendingUp className="w-5 h-5" />,
      label: 'Analyze',
      description: 'Analyze conversation patterns',
    },
  ];

  const handleGenerateSummary = async () => {
    setActiveAction('summary');
    try {
      const response = await fetch(`${apiBaseUrl}/chat-rooms/${roomId}/summarize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Failed to generate summary:', error);
    }
  };

  const handleGetSuggestions = async () => {
    setActiveAction('suggestions');
    try {
      const response = await fetch(`${apiBaseUrl}/chat-rooms/${roomId}/suggestions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title) {
      alert('Please enter a task title');
      return;
    }

    try {
      // In a real implementation, this would use the WebSocket
      // to emit an agent:create-task event
      console.log('Creating task:', taskForm);

      // Reset form
      setTaskForm({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: '',
        priority: 'MEDIUM',
      });
      setActiveAction(null);
      alert('Task created successfully!');
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleExecuteCommand = async () => {
    if (!commandInput.trim()) return;

    try {
      // In a real implementation, this would use the WebSocket
      // to emit an agent:execute-command event
      console.log('Executing command:', commandInput);

      setCommandHistory([...commandHistory, commandInput]);
      setCommandInput('');
    } catch (error) {
      console.error('Failed to execute command:', error);
    }
  };

  const renderActionPanel = () => {
    if (!activeAction) return null;

    switch (activeAction) {
      case 'summary':
        return (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Conversation Summary
              </h3>
              <button
                onClick={() => setActiveAction(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {summary ? (
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {summary}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Generating summary...</p>
              </div>
            )}
          </div>
        );

      case 'suggestions':
        return (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Suggested Next Actions
              </h3>
              <button
                onClick={() => setActiveAction(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {suggestions.length > 0 ? (
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 hover:bg-blue-100 dark:hover:bg-blue-900 dark:hover:bg-opacity-30 cursor-pointer"
                  >
                    <Target className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">{suggestion}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Analyzing conversation...</p>
              </div>
            )}
          </div>
        );

      case 'create-task':
        return (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create Task
              </h3>
              <button
                onClick={() => setActiveAction(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateTask();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Task description"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assign To
                  </label>
                  <input
                    type="text"
                    value={taskForm.assignedTo}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, assignedTo: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="User ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Task
              </button>
            </form>
          </div>
        );

      case 'execute-command':
        return (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Execute Command
              </h3>
              <button
                onClick={() => setActiveAction(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleExecuteCommand();
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder="Enter command..."
                />
                <button
                  onClick={handleExecuteCommand}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>

              {commandHistory.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Command History:
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {commandHistory.map((cmd, index) => (
                      <div
                        key={index}
                        className="text-sm font-mono text-gray-700 dark:text-gray-300 py-1"
                      >
                        $ {cmd}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatRoomView
          roomId={roomId}
          userId={agentId}
          isAgent={true}
          apiBaseUrl={apiBaseUrl}
          wsUrl={wsUrl}
        />
      </div>

      {/* Agent Actions Panel */}
      {showAgentPanel && (
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Agent Actions
                </h2>
              </div>
              <button
                onClick={() => setShowAgentPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 mb-4">
              {agentActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    if (action.id === 'summary') handleGenerateSummary();
                    else if (action.id === 'suggestions') handleGetSuggestions();
                    else setActiveAction(action.id);
                  }}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                    activeAction === action.id
                      ? 'bg-purple-100 dark:bg-purple-900 dark:bg-opacity-30'
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="text-purple-600 dark:text-purple-400 flex-shrink-0">
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {action.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {action.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Active Action Panel */}
            {renderActionPanel()}

            {/* Agent Info */}
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Agent Status
                </span>
              </div>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-green-600 dark:text-green-400">Active</span>
                </div>
                <div className="flex justify-between">
                  <span>Agent ID:</span>
                  <span className="font-mono">{agentId.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span>Room ID:</span>
                  <span className="font-mono">{roomId.substring(0, 8)}...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Panel Toggle */}
      {!showAgentPanel && (
        <button
          onClick={() => setShowAgentPanel(true)}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700"
        >
          <Cpu className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default AgentChatInterface;
