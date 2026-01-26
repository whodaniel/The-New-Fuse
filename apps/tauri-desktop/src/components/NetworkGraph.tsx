import React, { useRef, useState } from 'react';

// ============================================================================
// NETWORK GRAPH COMPONENT (Visual Simulation)
// ============================================================================

export const NetworkGraph: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Generating mock nodes for the visualization
  const [nodes] = useState(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 10 + 5,
      connections: [] as number[],
    }));
  });

  return (
    <div className="network-graph-container" ref={containerRef}>
      <div className="nodes-layer">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="node"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: `${node.size}px`,
              height: `${node.size}px`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      <svg className="connections-layer">
        {/* Mock connections - just random lines for visual flair */}
        <line
          x1="10%"
          y1="10%"
          x2="40%"
          y2="80%"
          stroke="rgba(59, 130, 246, 0.2)"
          strokeWidth="1"
        />
        <line
          x1="40%"
          y1="80%"
          x2="80%"
          y2="20%"
          stroke="rgba(59, 130, 246, 0.2)"
          strokeWidth="1"
        />
        <line
          x1="80%"
          y1="20%"
          x2="20%"
          y2="30%"
          stroke="rgba(59, 130, 246, 0.2)"
          strokeWidth="1"
        />
        <line
          x1="50%"
          y1="50%"
          x2="90%"
          y2="90%"
          stroke="rgba(59, 130, 246, 0.2)"
          strokeWidth="1"
        />
      </svg>
      <div className="particles-layer">
        <div className="particle p1" />
        <div className="particle p2" />
        <div className="particle p3" />
      </div>

      <style>{`
        .network-graph-container {
          width: 100%;
          height: 100%;
          background: #0b0e14;
          position: relative;
          overflow: hidden;
        }

        .nodes-layer {
            position: absolute;
            inset: 0;
            z-index: 10;
        }

        .node {
            position: absolute;
            background: #3b82f6;
            border-radius: 50%;
            box-shadow: 0 0 10px #3b82f6;
            opacity: 0.6;
            transform: translate(-50%, -50%);
            animation: pulse-node 3s infinite ease-in-out;
        }

        .connections-layer {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 5;
        }

        .particles-layer {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 8;
        }

        .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #fff;
            border-radius: 50%;
            box-shadow: 0 0 4px #fff;
            opacity: 0;
        }

        .p1 { top: 10%; left: 10%; animation: travel 4s linear infinite; }
        .p2 { top: 40%; left: 80%; animation: travel 5s linear infinite 1s; }
        .p3 { top: 80%; left: 20%; animation: travel 6s linear infinite 0.5s; }

        @keyframes pulse-node {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
        }

        @keyframes travel {
            0% { transform: translate(0, 0); opacity: 1; }
            100% { transform: translate(200px, 100px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
