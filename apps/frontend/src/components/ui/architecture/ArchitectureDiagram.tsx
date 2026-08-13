/**
 * Architecture Diagram Component
 *
 * TNF multi-agent architecture with orthogonal axes:
 * baton identity ≠ daccRole ≠ workerAction ≠ platform.
 */

import React from 'react';

const ArchitectureDiagram: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <svg viewBox="0 0 860 480" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#64748b" />
          </marker>
        </defs>

        <rect x="0" y="0" width="860" height="480" fill="#1e293b" rx="12" />

        <text x="430" y="28" textAnchor="middle" fill="#e2e8f0" fontSize="16" fontWeight="bold">
          TNF Multi-Agent Architecture (DACC Axes)
        </text>
        <text x="430" y="48" textAnchor="middle" fill="#94a3b8" fontSize="10">
          Role seat ⊥ platform · Baton = master-clock only
        </text>

        {/* Director */}
        <rect x="320" y="62" width="220" height="40" fill="#f43f5e" rx="8" />
        <text x="430" y="80" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
          DIRECTOR (authority seat)
        </text>
        <text x="430" y="94" textAnchor="middle" fill="#fecdd3" fontSize="9">
          human or designated super/sub-director — any platform
        </text>

        <line
          x1="430"
          y1="102"
          x2="430"
          y2="118"
          stroke="#64748b"
          strokeWidth="2"
          markerEnd="url(#arrow)"
        />

        {/* Master Clock / Baton */}
        <rect x="280" y="120" width="300" height="52" fill="#3b82f6" rx="8" />
        <text x="430" y="140" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">
          ORCHESTRATOR baton · master-clock
        </text>
        <text x="430" y="158" textAnchor="middle" fill="#bfdbfe" fontSize="9">
          identity ORCHESTRATOR-{'{ts}'} · platform master-clock / tnf-runtime
        </text>

        <line
          x1="430"
          y1="172"
          x2="430"
          y2="188"
          stroke="#64748b"
          strokeWidth="2"
          markerEnd="url(#arrow)"
        />

        {/* Broker */}
        <rect x="300" y="190" width="260" height="44" fill="#8b5cf6" rx="8" />
        <text x="430" y="210" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
          BROKER (channel / dispatch seat)
        </text>
        <text x="430" y="224" textAnchor="middle" fill="#ddd6fe" fontSize="9">
          process or AI — not locked to any CLI platform
        </text>

        <line x1="430" y1="234" x2="430" y2="250" stroke="#64748b" strokeWidth="2" />

        {/* Workers */}
        <rect x="40" y="258" width="150" height="56" fill="#10b981" rx="8" />
        <text x="115" y="280" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
          Worker
        </text>
        <text x="115" y="296" textAnchor="middle" fill="#a7f3d0" fontSize="9">
          daccRole=worker
        </text>
        <text x="115" y="308" textAnchor="middle" fill="#6ee7b7" fontSize="8">
          + caps / workerAction
        </text>

        <rect x="210" y="258" width="150" height="56" fill="#10b981" rx="8" />
        <text x="285" y="280" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
          Worker
        </text>
        <text x="285" y="296" textAnchor="middle" fill="#a7f3d0" fontSize="9">
          may run orchestration work
        </text>
        <text x="285" y="308" textAnchor="middle" fill="#6ee7b7" fontSize="8">
          without holding baton
        </text>

        <rect x="380" y="258" width="150" height="56" fill="#10b981" rx="8" />
        <text x="455" y="280" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
          Worker
        </text>
        <text x="455" y="296" textAnchor="middle" fill="#a7f3d0" fontSize="9">
          any platform
        </text>
        <text x="455" y="308" textAnchor="middle" fill="#6ee7b7" fontSize="8">
          antigravity · claude · pi…
        </text>

        <rect x="550" y="258" width="150" height="56" fill="#10b981" rx="8" />
        <text x="625" y="280" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
          Participant
        </text>
        <text x="625" y="296" textAnchor="middle" fill="#a7f3d0" fontSize="9">
          federation / browser
        </text>
        <text x="625" y="308" textAnchor="middle" fill="#6ee7b7" fontSize="8">
          seat ≠ product name
        </text>

        {/* Platform lane (orthogonal) */}
        <rect x="40" y="340" width="780" height="70" fill="#0f172a" stroke="#334155" rx="8" />
        <text x="60" y="362" fill="#fbbf24" fontSize="11" fontWeight="bold">
          Platform lane (fulfillment · orthogonal to daccRole)
        </text>
        <text x="60" y="380" fill="#cbd5e1" fontSize="10">
          antigravity · claude · gemini · jules · pi · vscode · browser · tnf-runtime · master-clock
        </text>
        <text x="60" y="396" fill="#94a3b8" fontSize="9">
          Platforms are not hierarchy seats. Assigning orchestration capabilities ≠ claiming
          ORCHESTRATOR-{'{ts}'} baton identity.
        </text>

        {/* Redis */}
        <rect x="720" y="190" width="100" height="44" fill="#f59e0b" rx="6" />
        <text x="770" y="210" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
          Redis bus
        </text>
        <text x="770" y="224" textAnchor="middle" fill="#fde68a" fontSize="8">
          state + handoff
        </text>
        <line
          x1="560"
          y1="212"
          x2="720"
          y2="212"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeDasharray="4"
        />

        <text x="40" y="450" fill="#94a3b8" fontSize="9">
          ▲ Control / baton hierarchy
        </text>
        <text x="220" y="450" fill="#fbbf24" fontSize="9">
          ■ Platform assignment (independent)
        </text>
        <text x="460" y="450" fill="#a7f3d0" fontSize="9">
          ■ Worker dispatch eligible (non-infra daccRole)
        </text>
      </svg>
    </div>
  );
};

export default ArchitectureDiagram;
