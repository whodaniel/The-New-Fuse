import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface Command {
  id: string;
  name: string;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'tool' | 'action';
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [commands, setCommands] = useState<Command[]>([]);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev: any) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const allCommands: Command[] = [
      {
        id: 'home',
        name: 'Go to Home',
        shortcut: '⌘H',
        action: () => router.push('/'),
        category: 'navigation'
      },
      {
        id: 'agents',
        name: 'View Agents',
        shortcut: '⌘A',
        action: () => router.push('/agents'),
        category: 'navigation'
      },
      {
        id: 'workflow',
        name: 'Open Workflow Editor',
        shortcut: '⌘W',
        action: () => router.push('/workflow'),
        category: 'tool'
      },
      {
        id: 'settings',
        name: 'Open Settings',
        shortcut: '⌘,',
        action: () => router.push('/settings'),
        category: 'navigation'
      },
      {
        id: 'new-agent',
        name: 'Create New Agent',
        shortcut: '⌘N',
        action: () => router.push('/agents/new'),
        category: 'action'
      },
      {
        id: 'marketplace',
        name: 'Browse Marketplace',
        shortcut: '⌘M',
        action: () => router.push('/marketplace'),
        category: 'navigation'
      }
    ];
    setCommands(allCommands);
  }, [router]);

  useEffect(() => {
    const filtered = commands.filter(command =>
      command.name.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredCommands(filtered);
  }, [search, commands]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 text-center">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={() => setIsOpen(false)}
        />

        <div className="inline-block w-full max-w-2xl my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-xl">
          <div className="p-4">
            <input
              type="text"
              className="w-full px-4 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Search commands... (ESC to close)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.map((command) => (
              <button
                key={command.id}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                onClick={() => {
                  command.action();
                  setIsOpen(false);
                }}
              >
                <div>
                  <span className="text-gray-900 dark:text-white">{command.name}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    {command.category}
                  </span>
                </div>
                {command.shortcut && (
                  <span className="text-sm text-gray-500">{command.shortcut}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};