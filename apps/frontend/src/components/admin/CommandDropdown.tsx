import { ChevronDown, Info, Play, Terminal } from 'lucide-react';
import { useState } from 'react';
import { ADMIN_COMMANDS, AdminCommand } from '../../config/admin-commands';
import { cn } from '../../lib/utils';
import { Tooltip } from '../ui/tooltip';
// Assuming we have a configured axios instance or similar service
import axios from 'axios';
import { getApiUrl } from '../../config/ports';

interface CommandDropdownProps {
  className?: string;
}

export function CommandDropdown({ className }: CommandDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    id: string;
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const executeCommand = async (command: AdminCommand) => {
    if (
      command.requiresConfirmation &&
      !window.confirm(`Are you sure you want to run: ${command.label}?`)
    ) {
      return;
    }

    setLoading(command.id);
    setStatus(null);

    try {
      const baseUrl = getApiUrl();
      const url = `${baseUrl}${command.endpoint}`;

      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios({
        method: command.method,
        url,
        headers,
      });

      setStatus({
        id: command.id,
        type: 'success',
        message: 'Command triggered successfully',
      });

      // Auto-clear success message after 3 seconds
      setTimeout(() => setStatus(null), 3000);
    } catch (error: any) {
      console.error(`Error executing command ${command.id}:`, error);
      setStatus({
        id: command.id,
        type: 'error',
        message: error.response?.data?.message || 'Failed to execute command',
      });
    } finally {
      setLoading(null);
    }
  };

  // Group commands by category
  const groupedCommands = ADMIN_COMMANDS.reduce(
    (acc, command) => {
      if (!acc[command.category]) {
        acc[command.category] = [];
      }
      acc[command.category].push(command);
      return acc;
    },
    {} as Record<string, AdminCommand[]>
  );

  return (
    <div className={cn('relative inline-block text-left', className)}>
      <div>
        <button
          type="button"
          onClick={toggleDropdown}
          className="inline-flex items-center justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Terminal className="mr-2 h-4 w-4" />
          System Commands
          <ChevronDown className="-mr-1 ml-2 h-4 w-4" />
        </button>
      </div>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 divide-y divide-gray-100"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          {Object.entries(groupedCommands).map(([category, commands]) => (
            <div key={category} className="py-1">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                {category}
              </div>
              {commands.map((command) => (
                <div
                  key={command.id}
                  className="px-4 py-3 hover:bg-gray-50 flex items-center justify-between group"
                >
                  <div className="flex items-center flex-1 min-w-0 mr-4">
                    {command.icon && (
                      <command.icon className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0 group-hover:text-blue-500" />
                    )}
                    <div className="truncate">
                      <p className="text-sm font-medium text-gray-900">{command.label}</p>
                      {status?.id === command.id && (
                        <p
                          className={cn(
                            'text-xs truncate',
                            status.type === 'success' ? 'text-green-600' : 'text-red-600'
                          )}
                        >
                          {status.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Tooltip label={command.description}>
                      <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    </Tooltip>

                    <button
                      onClick={() => executeCommand(command)}
                      disabled={loading === command.id}
                      className={cn(
                        'p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500',
                        loading === command.id
                          ? 'bg-gray-100 cursor-wait'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      )}
                      title="Run Command"
                    >
                      <Play
                        className={cn(
                          'h-3 w-3 fill-current',
                          loading === command.id && 'animate-pulse'
                        )}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close (simplified) - in a real app use a hook */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
