import { StopCircle } from "lucide-react";

interface EndAgentSessionProps {
  sendCommand: (command: string, submit?: boolean) => void;
  setShowing: (showing: boolean) => void;
}

export default function EndAgentSession({ sendCommand, setShowing }: EndAgentSessionProps) {
  return (
    <div
      onClick={() => {
        sendCommand("/end");
        setShowing(false);
      }}
      className="w-full flex flex-col justify-start items-start p-2 rounded-lg hover:bg-theme-action-menu-item-hover cursor-pointer"
    >
      <div className="w-full flex justify-start items-center gap-2">
        <StopCircle className="w-4 h-4 text-orange-500" />
        <p className="text-sm font-medium text-theme-text-primary">End Agent Session</p>
      </div>
      <p className="text-xs text-theme-text-secondary mt-1">
        End the current agent session
      </p>
    </div>
  );
}