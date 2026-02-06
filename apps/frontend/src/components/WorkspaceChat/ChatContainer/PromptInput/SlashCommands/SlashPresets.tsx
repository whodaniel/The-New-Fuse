import { Sparkles } from 'lucide-react';

interface SlashPresetsProps {
  sendCommand: (command: string, submit?: boolean) => void;
  setShowing: (showing: boolean) => void;
}

export default function SlashPresets({ sendCommand, setShowing }: SlashPresetsProps) {
  return (
    <div
      onClick={() => {
        sendCommand('/presets');
        setShowing(false);
      }}
      className="w-full flex flex-col justify-start items-start p-2 rounded-lg hover:bg-theme-action-menu-item-hover cursor-pointer"
    >
      <div className="w-full flex justify-start items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <p className="text-sm font-medium text-theme-text-primary">Presets</p>
      </div>
      <p className="text-xs text-theme-text-secondary mt-1">View and use conversation presets</p>
    </div>
  );
}
