import { useEffect, ReactNode } from 'react';
import { Bot, Calendar, Target, Users } from 'lucide-react';

interface SlashCommand {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
}

const COMMANDS: SlashCommand[] = [
  { id: 'goal', name: '/goal', description: 'Run a long-running autonomous goal loop', icon: <Target className="w-4 h-4 mr-2" /> },
  { id: 'schedule', name: '/schedule', description: 'Schedule a cron job or timer', icon: <Calendar className="w-4 h-4 mr-2" /> },
  { id: 'teamwork', name: '/teamwork-preview', description: 'Summon a team of specialized agents', icon: <Users className="w-4 h-4 mr-2" /> },
  { id: 'grill', name: '/grill-me', description: 'Start an interactive Q&A alignment session', icon: <Bot className="w-4 h-4 mr-2" /> },
];

export const SlashPopover = ({
  inputValue,
  onSelectCommand,
  isOpen,
  setIsOpen
}: {
  inputValue: string;
  onSelectCommand: (cmd: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  useEffect(() => {
    if (inputValue.endsWith('/')) {
      setIsOpen(true);
    } else if (!inputValue.includes('/')) {
      setIsOpen(false);
    }
  }, [inputValue, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute z-50 w-72 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 overflow-hidden bottom-full mb-2 left-0">
      <div className="p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <input 
          type="text" 
          placeholder="Search slash commands..." 
          className="w-full bg-transparent border-none text-sm outline-none"
          autoFocus
        />
      </div>
      <div className="max-h-64 overflow-y-auto p-1">
        <div className="text-xs font-semibold text-gray-500 px-2 py-1 mb-1">Suggestions</div>
        {COMMANDS.map((cmd) => (
          <div
            key={cmd.id}
            onClick={() => {
              onSelectCommand(cmd.name);
              setIsOpen(false);
            }}
            className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-sm"
          >
            {cmd.icon}
            <div>
              <div className="text-sm font-semibold">{cmd.name}</div>
              <div className="text-xs text-gray-500">{cmd.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
