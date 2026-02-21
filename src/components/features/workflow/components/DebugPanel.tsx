import React from "react";
import { ExecutionState, ExecutionLog } from "@the-new-fuse/types";

interface DebugPanelProps {
  visible: boolean;
  executionStates: Record<string, ExecutionState>;
  logs: ExecutionLog[];
  onClear: () => void;
}

export const DebugPanel: FC<DebugPanelProps> = ({
  visible,
  executionStates,
  logs,
  onClear,
}) => {
  if (!visible) return null;

  return (
    <div className="fixed bottom-0 right-0 w-96 h-64 bg-white border shadow-lg">
      <div className="flex justify-between items-center p-2 border-b">
        <h3 className="font-semibold">Debug Panel</h3>
        <button
          onClick={onClear}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Clear
        </button>
      </div>
      <div className="h-full overflow-y-auto p-2">
        {logs.map((log, index) => (
          <div
            key={index}
            className="mb-2 p-2 rounded text-sm"
            style={{
              backgroundColor:
                executionStates[log.nodeId] === "running"
                  ? "#fff7ed"
                  : executionStates[log.nodeId] === "completed"
                    ? "#f0fdf4"
                    : executionStates[log.nodeId] === "error"
                      ? "#fef2f2"
                      : "transparent",
            }}
          >
            <div className="font-medium">{log.nodeId}</div>
            <div className="text-gray-600">{log.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
