import React from "react";
import { Tooltip } from "react-tooltip";
import { isMobile } from "react-device-detect";

interface TooltipConfig {
  id: string;
  place: "top" | "bottom" | "left" | "right";
  content: string;
}

const tooltips: TooltipConfig[] = [
  {
    id: "similarity-score",
    place: "top",
    content: "This score represents how closely this chunk matches your query.",
  },
  {
    id: "regenerate-response",
    place: "top",
    content: "Generate a new response for this message.",
  },
  {
    id: "delete-message",
    place: "top",
    content: "Delete this message from the chat history.",
  },
  {
    id: "edit-message",
    place: "top",
    content: "Edit this message.",
  },
  {
    id: "fork-thread",
    place: "top",
    content: "Create a new thread starting from this message.",
  },
];

export function ChatTooltips(): JSX.Element | null {
  if (isMobile) return null;

  return (
    <>
      {tooltips.map((tooltip) => (
        <Tooltip
          key={tooltip.id}
          id={tooltip.id}
          place={tooltip.place}
          content={tooltip.content}
          className="tooltip !text-xs"
        />
      ))}
    </>
  );
}