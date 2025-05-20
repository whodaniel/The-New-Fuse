import React from "react";
import { Eraser } from "@phosphor-icons/react";

interface ResetCommandProps {
  sendCommand: (command: string, submit?: boolean) => void;
  setShowing: (showing: boolean) => void;
}

export default function ResetCommand({ sendCommand, setShowing }: ResetCommandProps): JSX.Element {
  const handleSelect = () => {
    sendCommand("/reset", true);
    setShowing(false);
  };

  return (
    <button
      onClick={handleSelect}
      className="w-full text-left px-4 py-2 rounded hover:bg-theme-action-menu-item-hover flex items-start gap-x-3"
    >
      <Eraser className="w-5 h-5 mt-0.5" />
      <div>
        <p className="text-white text-sm font-medium">/reset</p>
        <p className="text-white/60 text-xs">
          Reset the conversation and clear all chat history
        </p>
      </div>
    </button>
  );
}