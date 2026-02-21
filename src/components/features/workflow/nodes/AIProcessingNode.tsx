import React from "react";
import { Node as ReactFlowNode } from "react-flow-renderer";
import { nodeTypes } from "@the-new-fuse/nodeTypes";

export const AIProcessingNode: FC<{
  position: { x: number; y: number };
  inputs?: string[];
  outputs?: string[];
}> = ({ position, inputs = [], outputs = [] }) => {
  return (
    <ReactFlowNode
      position={position}
      style={{
        backgroundColor: "#4a90e2",
        padding: "10px",
        borderRadius: "5px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div>
        <h3 style={{ color: "white", margin: 0 }}>
          {nodeTypes.AI_PROCESSING.label}
        </h3>
        <p style={{ color: "white", margin: 0 }}>
          {nodeTypes.AI_PROCESSING.category}
        </p>
      </div>
    </ReactFlowNode>
  );
};
