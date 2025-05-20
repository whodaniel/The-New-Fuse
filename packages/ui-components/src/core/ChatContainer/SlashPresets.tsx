import React from "react";
import { CaretCircleRight } from "@phosphor-icons/react";

interface SlashPresetsProps {
  sendCommand: (command: string, submit?: boolean) => void;
  setShowing: (showing: boolean) => void;
}

interface PresetCommand {
  command: string;
  description: string;
}

const PRESET_COMMANDS: PresetCommand[] = [
  {
    command: "/explain",
    description: "Ask for a detailed explanation of a concept or topic",
  },
  {
    command: "/summarize",
    description: "Get a concise summary of the previous messages or content",
  },
  {
    command: "/translate",
    description: "Translate text into another language",
  },
  {
    command: "/analyze",
    description: "Get a detailed analysis of data or text",
  },
];

export default function SlashPresets({ sendCommand, setShowing }: SlashPresetsProps): JSX.Element {
  const handleSelect = (command: string) => {
    sendCommand(command);
    setShowing(false);
  };

  return (
    <>
      {PRESET_COMMANDS.map(({ command, description }) => (
        <button
          key={command}
          onClick={() => handleSelect(command)}
          className="w-full text-left px-4 py-2 rounded hover:bg-theme-action-menu-item-hover flex items-start gap-x-3"
        >
          <CaretCircleRight className="w-5 h-5 mt-0.5" />
          <div>
            <p className="text-white text-sm font-medium">{command}</p>
            <p className="text-white/60 text-xs">{description}</p>
          </div>
        </button>
      ))}
    </>
  );
}