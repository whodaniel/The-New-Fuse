import { useState } from 'react';
import { Clock, Calendar as CalendarIcon, Play } from 'lucide-react';

export const ScheduleBuilder = () => {
  const [cronExpression, setCronExpression] = useState('0 * * * *');
  const [prompt, setPrompt] = useState('Run system audit');

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2 text-indigo-500" />
          Autonomous Scheduler
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cron Expression
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              placeholder="* * * * *"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">e.g., "0 * * * *" for every hour</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Directive / Prompt
          </label>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-3 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 h-24"
            placeholder="What should the swarm do when this triggers?"
          />
        </div>

        <button className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <Play className="w-4 h-4 mr-2" />
          Deploy Schedule to Director
        </button>
      </div>
    </div>
  );
};
