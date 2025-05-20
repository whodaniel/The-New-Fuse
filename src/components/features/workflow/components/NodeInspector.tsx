import React from "react";
import { Node } from "reactflow";
import { nodeConfigurationSchema } from "@the-new-fuse/schemas/nodeConfiguration";

interface NodeInspectorProps {
  selectedNode: Node | null;
  onNodeUpdate: (nodeId: string, data: unknown) => void;
}

export const NodeInspector: FC<NodeInspectorProps> = ({
  selectedNode,
  onNodeUpdate,
}) => {
  if (!selectedNode) {
    return (
      <div className="w-64 border-l border-gray-200 p-4">
        <p className="text-gray-500 text-sm">Select a node to configure</p>
      </div>
    );
  }

  const handleConfigChange = (key: string, value: unknown) => {
    onNodeUpdate(selectedNode.id, {
      ...selectedNode.data,
      config: {
        ...selectedNode.data.config,
        [key]: value,
      },
    });
  };

  return (
    <div className="w-64 border-l border-gray-200 p-4">
      <h3 className="font-semibold mb-4">{selectedNode.data.label}</h3>
      <div className="space-y-4">
        {Object.entries(nodeConfigurationSchema[selectedNode.type] || {}).map(
          ([key, field]) => (
            <div key={key} className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {field.label}
              </label>
              {field.type === "text" && (
                <input
                  type="text"
                  className="w-full border rounded p-1"
                  value={selectedNode.data.config[key] || ""}
                  onChange={(e) => handleConfigChange(key, e.target.value)}
                />
              )}
              {field.type === "select" && (
                <select
                  className="w-full border rounded p-1"
                  value={selectedNode.data.config[key] || ""}
                  onChange={(e) => handleConfigChange(key, e.target.value)}
                >
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );
};
