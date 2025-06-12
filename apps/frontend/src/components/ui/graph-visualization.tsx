import React, { useEffect, useState, useCallback } from 'react';

interface GraphVisualizationProps {
  websocketUrl?: string;
  showMiniMap?: boolean;
  showControls?: boolean;
  className?: string;
}

export function GraphVisualization({
  websocketUrl = "ws://localhost:3000/graph",
  showMiniMap = true,
  showControls = true,
  className = "",
}: GraphVisualizationProps) {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Placeholder for WebSocket connection
    console.log('Graph visualization initialized with URL:', websocketUrl);
    
    // Simulate some initial data
    setNodes([
      { id: '1', label: 'Node 1', x: 100, y: 100 },
      { id: '2', label: 'Node 2', x: 300, y: 100 },
      { id: '3', label: 'Node 3', x: 200, y: 200 },
    ]);
    
    setEdges([
      { source: '1', target: '2', label: 'connects to' },
      { source: '2', target: '3', label: 'flows to' },
    ]);
  }, [websocketUrl]);

  const handleNodeClick = useCallback((nodeId: string) => {
    console.log('Node clicked:', nodeId);
  }, []);

  return (
    <div className={`graph-visualization ${className}`} style={{ width: '100%', height: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', position: 'relative' }}>
      <div style={{ padding: '20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Graph Visualization</h3>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
          Interactive graph visualization component
        </p>
      </div>
      
      <div style={{ padding: '20px', height: 'calc(100% - 100px)', overflow: 'hidden' }}>
        <svg width="100%" height="100%" style={{ border: '1px solid #e5e7eb', borderRadius: '4px', background: '#ffffff' }}>
          {/* Render edges */}
          {edges.map((edge, index) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;
            
            return (
              <g key={index}>
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="#9ca3af"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                <text
                  x={(sourceNode.x + targetNode.x) / 2}
                  y={(sourceNode.y + targetNode.y) / 2}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#6b7280"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}
          
          {/* Render nodes */}
          {nodes.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r="20"
                fill="#3b82f6"
                stroke="#1e40af"
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onClick={() => handleNodeClick(node.id)}
              />
              <text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                fontSize="12"
                fill="white"
                fontWeight="600"
              >
                {node.id}
              </text>
              <text
                x={node.x}
                y={node.y + 35}
                textAnchor="middle"
                fontSize="10"
                fill="#374151"
              >
                {node.label}
              </text>
            </g>
          ))}
          
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#9ca3af"
              />
            </marker>
          </defs>
        </svg>
        
        {showControls && (
          <div style={{ position: 'absolute', top: '100px', right: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button style={{ padding: '8px 12px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}>
              Zoom In
            </button>
            <button style={{ padding: '8px 12px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}>
              Zoom Out
            </button>
            <button style={{ padding: '8px 12px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}>
              Fit View
            </button>
          </div>
        )}
        
        {showMiniMap && (
          <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '120px', height: '80px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#f9fafb' }}>
            <div style={{ padding: '8px', fontSize: '10px', fontWeight: '600', color: '#6b7280' }}>Mini Map</div>
          </div>
        )}
      </div>
      
      <div style={{ position: 'absolute', top: '20px', left: '20px', fontSize: '12px', color: isConnected ? '#10b981' : '#ef4444' }}>
        ● {isConnected ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
}

export default GraphVisualization;
