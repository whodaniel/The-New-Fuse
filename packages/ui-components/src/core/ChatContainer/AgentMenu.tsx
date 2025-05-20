import React, { useState, useRef, useEffect } from "react";
import { RobotSimple } from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";

interface AgentMenuProps {
  showing: boolean;
  setShowing: (showing: boolean) => void;
}

interface AvailableAgentsProps {
  showing: boolean;
  setShowing: (showing: boolean) => void;
  sendCommand: (command: string, submit?: boolean) => void;
  promptRef: React.RefObject<HTMLTextAreaElement>;
}

interface UseAvailableAgentsReturn {
  showAgents: boolean;
  setShowAgents: (showing: boolean) => void;
}

export default function AvailableAgentsButton({ showing, setShowing }: AgentMenuProps): JSX.Element {
  return (
    <div
      id="agent-cmd-btn"
      data-tooltip-id="tooltip-agent-cmd-btn"
      data-tooltip-content="View all available agents for your workspace."
      onClick={() => setShowing(!showing)}
      className={`flex justify-center items-center cursor-pointer ${
        showing ? "!opacity-100" : ""
      }`}
    >
      <RobotSimple
        color="var(--theme-sidebar-footer-icon-fill)"
        className="w-[20px] h-[20px] pointer-events-none opacity-60 hover:opacity-100 light:opacity-100 light:hover:opacity-60"
        weight="bold"
      />
      <Tooltip
        id="tooltip-agent-cmd-btn"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99"
      />
    </div>
  );
}

export function AvailableAgents({
  showing,
  setShowing,
  sendCommand,
  promptRef,
}: AvailableAgentsProps): JSX.Element {
  const agentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function listenForOutsideClick() {
      if (!showing || !agentRef.current) return false;
      document.addEventListener("click", closeIfOutside);
    }
    listenForOutsideClick();
    return () => {
      document.removeEventListener("click", closeIfOutside);
    };
  }, [showing, agentRef.current]);

  const closeIfOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.id === "agent-cmd-btn") return;
    const isOutside = !agentRef?.current?.contains(target);
    if (!isOutside) return;
    setShowing(false);
  };

  const handleAgentSelect = (agentCommand: string) => {
    if (!promptRef.current) return;
    const cursorPosition = promptRef.current.selectionStart;
    promptRef.current.setSelectionRange(cursorPosition - 1, cursorPosition);
    sendCommand(agentCommand);
    setShowing(false);
  };

  return (
    <div hidden={!showing}>
      <div className="w-full flex justify-center absolute bottom-[130px] md:bottom-[150px] left-0 z-10 px-4">
        <div
          ref={agentRef}
          className="w-[600px] bg-theme-action-menu-bg rounded-2xl flex shadow flex-col justify-start items-start gap-2.5 p-2 overflow-y-auto max-h-[300px] no-scroll"
        >
          <button
            onClick={() => handleAgentSelect("@research")}
            className="w-full text-left px-4 py-2 rounded hover:bg-theme-action-menu-item-hover"
          >
            <p className="text-white text-sm font-medium">Research Assistant</p>
            <p className="text-white/60 text-xs">
              Help with research tasks and information gathering
            </p>
          </button>
          <button
            onClick={() => handleAgentSelect("@code")}
            className="w-full text-left px-4 py-2 rounded hover:bg-theme-action-menu-item-hover"
          >
            <p className="text-white text-sm font-medium">Code Assistant</p>
            <p className="text-white/60 text-xs">
              Help with coding tasks and technical implementation
            </p>
          </button>
          <button
            onClick={() => handleAgentSelect("@writing")}
            className="w-full text-left px-4 py-2 rounded hover:bg-theme-action-menu-item-hover"
          >
            <p className="text-white text-sm font-medium">Writing Assistant</p>
            <p className="text-white/60 text-xs">
              Help with content creation and writing tasks
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

export function useAvailableAgents(): UseAvailableAgentsReturn {
  const [showAgents, setShowAgents] = useState<boolean>(false);
  return { showAgents, setShowAgents };
}