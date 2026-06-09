import React, { useState } from 'react';
import { Bot, CheckSquare, MessageSquare, Plus, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui';

export const ProjectView: React.FC = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello. I am ready to help you formulate the execution plan for this project. What are our primary objectives?' },
  ]);
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Define project scope', status: 'completed' },
    { id: '2', title: 'Setup database schema', status: 'pending' },
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setMessages([...messages, { role: 'user', content: inputValue }]);
    setInputValue('');
    
    // Simulate agent response converting intent to task
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I've understood your intent. I am dispatching a new task to the queue for execution.` 
      }]);
      setTasks(prev => [...prev, {
        id: Date.now().toString(),
        title: `Execute: ${inputValue.substring(0, 30)}...`,
        status: 'pending'
      }]);
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col pt-4 px-4 max-w-screen-2xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Project: Application Redesign</h1>
          <p className="text-sm text-gray-400">Personal Domain • Procedural Execution Mode</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-medium flex items-center">
            <Bot className="w-3 h-3 mr-1" />
            Active Agent: Architect
          </span>
        </div>
      </div>

      {/* Split View Container */}
      <div className="flex-1 flex gap-6 min-h-[600px] pb-6">
        
        {/* Left Pane: Thread (Interaction Cog) */}
        <GlassCard className="flex-1 flex flex-col overflow-hidden border-gray-800">
          <div className="p-3 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
            <div className="flex items-center text-white font-medium">
              <MessageSquare className="w-4 h-4 mr-2 text-blue-400" />
              Thread (Interaction)
            </div>
            <span className="text-xs text-gray-500">Procedural Intake Processor</span>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-800 bg-gray-900/50">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Describe your goal to generate tasks..."
                className="flex-1 bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </GlassCard>

        {/* Right Pane: Tasks (Execution Cog) */}
        <GlassCard className="w-[400px] flex flex-col overflow-hidden border-gray-800">
          <div className="p-3 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
            <div className="flex items-center text-white font-medium">
              <CheckSquare className="w-4 h-4 mr-2 text-purple-400" />
              Task Queue (Execution)
            </div>
            <button className="p-1 hover:bg-gray-800 rounded">
              <Plus className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center text-gray-500 text-sm mt-10">
                No tasks dispatched yet. Use the thread to generate execution steps.
              </div>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg flex items-start gap-3 hover:bg-gray-800 transition-colors cursor-pointer">
                  <div className={`mt-0.5 w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${
                    task.status === 'completed' 
                      ? 'bg-green-500/20 border-green-500' 
                      : 'border-gray-500'
                  }`}>
                    {task.status === 'completed' && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-white'}`}>
                      {task.title}
                    </h4>
                    <span className="text-xs text-gray-500 mt-1 block">Assigned to: Agent</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

      </div>
    </div>
  );
};

export default ProjectView;
