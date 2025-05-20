import React from "react";
import { XCircle } from "@phosphor-icons/react";

interface EndAgentSessionProps {
  sendCommand: (command: string, submit?: boolean) => void;
  setShowing: (showing: boolean) => void;
}

export default function EndAgentSession({ sendCommand, setShowing }: EndAgentSessionProps): JSX.Element {
  const handleSelect = () => {
    sendCommand("/end", true);
    setShowing(false);
  };

  return (
    <button
      onClick={handleSelect}
      className="w-full text-left px-4 py-2 rounded hover:bg-theme-action-menu-item-hover flex items-start gap-x-3"
    >
      <XCircle className="w-5 h-5 mt-0.5" />
      <div>
        <p className="text-white text-sm font-medium">/end</p>
        <p className="text-white/60 text-xs">
          End the current agent session and return to normal chat mode
        </p>
      </div>
    </button>
  );
}