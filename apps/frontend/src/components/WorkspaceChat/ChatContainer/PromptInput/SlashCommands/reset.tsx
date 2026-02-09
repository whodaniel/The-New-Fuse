import { X } from "lucide-react";

interface ResetCommandProps {
  sendCommand: (command: string, submit?: boolean) => void;
  setShowing: (showing: boolean) => void;
}

export default function ResetCommand({ sendCommand, setShowing }: ResetCommandProps) {
  return (
    <div
      onClick={() => {
        sendCommand("/reset");
        setShowing(false);
      }}
      className="w-full flex flex-col justify-start items-start p-2 rounded-lg hover:bg-theme-action-menu-item-hover cursor-pointer"
    >
      <div className="w-full flex justify-start items-center gap-2">
        <X className="w-4 h-4 text-red-500" />
        <p className="text-sm font-medium text-theme-text-primary">Reset</p>
      </div>
      <p className="text-xs text-theme-text-secondary mt-1">
        Reset the current conversation
      </p>
    </div>
  );
}