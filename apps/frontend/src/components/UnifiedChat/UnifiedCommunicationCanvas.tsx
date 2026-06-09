import { useState } from 'react';
import A2AMultiAgentChat from '../A2AMultiAgentChat';
import { SlashPopover } from './SlashPopover';
import { ToolsetConfigDrawer } from './ToolsetConfigDrawer';
import { Settings } from 'lucide-react';

export const UnifiedCommunicationCanvas = () => {
  const [chatInput, setChatInput] = useState('');
  const [isSlashOpen, setIsSlashOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // A wrapper that merges multi-agent capabilities with Hermes micro-interactions
  return (
    <div className="relative flex w-full h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-800">
          <h2 className="text-xl font-bold">Unified Communication Canvas</h2>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full"
            title="Configure Active Tools & Skills"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          <A2AMultiAgentChat />
        </div>

        {/* Slash Command Popover overlay */}
        <div className="absolute bottom-24 left-1/4">
          <SlashPopover 
            inputValue={chatInput}
            onSelectCommand={(cmd) => setChatInput(cmd + ' ')}
            isOpen={isSlashOpen}
            setIsOpen={setIsSlashOpen}
          />
        </div>
      </div>

      {/* Slide-out Toolset Drawer */}
      <ToolsetConfigDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  );
};
