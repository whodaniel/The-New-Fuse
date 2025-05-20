import React from "react";
import { nodeCategories } from "@the-new-fuse/constants/nodeTypes";

interface NodeLibrarySidebarProps {
  onNodeSelect: (nodeType: string) => void;
}

export const NodeLibrarySidebar: FC<NodeLibrarySidebarProps> = ({
  onNodeSelect,
}) => {
  return (
    <div className="w-64 border-r border-gray-200 h-full overflow-y-auto">
      {nodeCategories.map((category) => (
        <div key={category.id} className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            {category.label}
          </h3>
          <div className="space-y-2">
            {category.nodes.map((node) => (
              <div
                key={node.type}
                className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                onClick={() => onNodeSelect(node.type)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/reactflow", node.type);
                }}
              >
                <div className="flex items-center">
                  {node.icon && <node.icon className="w-4 h-4 mr-2" />}
                  <span className="text-sm">{node.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
