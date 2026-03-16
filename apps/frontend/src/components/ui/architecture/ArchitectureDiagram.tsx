/**
 * Architecture Diagram Component
 *
 * Simple SVG diagram showing the TNF multi-agent architecture
 * Created based on Gemini assessment feedback
 */

import React from 'react';

const ArchitectureDiagram: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <svg viewBox="0 0 800 400" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
        {/* Background */}
        <rect x="0" y="0" width="800" height="400" fill="#1e293b" rx="12" />

        {/* Title */}
        <text x="400" y="30" textAnchor="middle" fill="#e2e8f0" fontSize="18" fontWeight="bold">
          TNF Multi-Agent Architecture
        </text>

        {/* Orchestrator */}
        <rect x="300" y="60" width="200" height="50" fill="#3b82f6" rx="8" />
        <text x="400" y="90" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
          Orchestrator
        </text>

        {/* Arrow from Orchestrator to Broker */}
        <line
          x1="400"
          y1="110"
          x2="400"
          y2="150"
          stroke="#64748b"
          strokeWidth="2"
          markerEnd="url(#arrow)"
        />

        {/* Broker */}
        <rect x="300" y="150" width="200" height="50" fill="#8b5cf6" rx="8" />
        <text x="400" y="180" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
          Broker / Message Bus
        </text>

        {/* Arrow from Broker to Workers */}
        <line x1="400" y1="200" x2="400" y2="240" stroke="#64748b" strokeWidth="2" />

        {/* Worker Nodes */}
        <rect x="50" y="260" width="140" height="60" fill="#10b981" rx="8" />
        <text x="120" y="290" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
          Worker Agent 1
        </text>
        <text x="120" y="308" textAnchor="middle" fill="#a7f3d0" fontSize="10">
          Task Execution
        </text>

        <rect x="220" y="260" width="140" height="60" fill="#10b981" rx="8" />
        <text x="290" y="290" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
          Worker Agent 2
        </text>
        <text x="290" y="308" textAnchor="middle" fill="#a7f3d0" fontSize="10">
          Data Processing
        </text>

        <rect x="390" y="260" width="140" height="60" fill="#10b981" rx="8" />
        <text x="460" y="290" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
          Worker Agent 3
        </text>
        <text x="460" y="308" textAnchor="middle" fill="#a7f3d0" fontSize="10">
          API Integration
        </text>

        <rect x="560" y="260" width="140" height="60" fill="#10b981" rx="8" />
        <text x="630" y="290" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
          Worker Agent N
        </text>
        <text x="630" y="308" textAnchor="middle" fill="#a7f3d0" fontSize="10">
          Custom Tasks
        </text>

        {/* Horizontal arrows from Broker to Workers */}
        <line
          x1="400"
          y1="240"
          x2="120"
          y2="260"
          stroke="#64748b"
          strokeWidth="1"
          strokeDasharray="4"
        />
        <line
          x1="400"
          y1="240"
          x2="290"
          y2="260"
          stroke="#64748b"
          strokeWidth="1"
          strokeDasharray="4"
        />
        <line
          x1="400"
          y1="240"
          x2="460"
          y2="260"
          stroke="#64748b"
          strokeWidth="1"
          strokeDasharray="4"
        />
        <line
          x1="400"
          y1="240"
          x2="630"
          y2="260"
          stroke="#64748b"
          strokeWidth="1"
          strokeDasharray="4"
        />

        {/* Redis / Storage */}
        <rect x="620" y="130" width="140" height="40" fill="#f59e0b" rx="6" />
        <text x="690" y="155" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
          Redis Synaptic Bus
        </text>

        {/* Arrow from Broker to Redis */}
        <line
          x1="500"
          y1="175"
          x2="620"
          y2="150"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeDasharray="4"
        />

        {/* Legend */}
        <text x="50" y="370" fill="#94a3b8" fontSize="10">
          ▲ Control Flow
        </text>
        <text x="180" y="370" fill="#f59e0b" fontSize="10">
          --- Data Sync
        </text>

        {/* External Services */}
        <rect x="50" y="60" width="100" height="30" fill="#6366f1" rx="4" />
        <text x="100" y="80" textAnchor="middle" fill="white" fontSize="10">
          External APIs
        </text>

        <rect x="50" y="100" width="100" height="30" fill="#6366f1" rx="4" />
        <text x="100" y="120" textAnchor="middle" fill="white" fontSize="10">
          Databases
        </text>

        {/* Arrow from External to Orchestrator */}
        <line
          x1="150"
          y1="75"
          x2="300"
          y2="85"
          stroke="#6366f6"
          strokeWidth="1"
          strokeDasharray="4"
        />
      </svg>
    </div>
  );
};

export default ArchitectureDiagram;
