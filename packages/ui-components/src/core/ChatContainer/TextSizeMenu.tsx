import React from "react";
import { TextAa } from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";

// Mock hook for text size
function useTextSize() {
  const [textSize, setTextSize] = React.useState("md");
  return { textSize, setTextSize };
}

interface TextSizeOption {
  label: string;
  value: string;
  className: string;
}

const TEXT_SIZE_OPTIONS: TextSizeOption[] = [
  { label: "Small", value: "sm", className: "text-sm" },
  { label: "Medium", value: "md", className: "text-base" },
  { label: "Large", value: "lg", className: "text-lg" },
];

export default function TextSizeButton(): JSX.Element {
  const { textSize, setTextSize } = useTextSize();

  return (
    <>
      <div className="relative group">
        <button
          data-tooltip-id="tooltip-text-size"
          data-tooltip-content="Adjust text size"
          className="flex justify-center items-center"
        >
          <TextAa
            color="var(--theme-sidebar-footer-icon-fill)"
            className="w-[20px] h-[20px] pointer-events-none opacity-60 hover:opacity-100 light:opacity-100 light:hover:opacity-60"
            weight="bold"
          />
        </button>
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block">
          <div className="bg-theme-action-menu-bg rounded-lg shadow-lg p-2 min-w-[120px]">
            {TEXT_SIZE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setTextSize(option.value)}
                className={`w-full text-left px-3 py-1.5 rounded ${
                  textSize === option.value
                    ? "bg-theme-action-menu-item-selected text-white"
                    : "text-theme-text-secondary hover:bg-theme-action-menu-item-hover"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Tooltip
        id="tooltip-text-size"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99"
      />
    </>
  );
}