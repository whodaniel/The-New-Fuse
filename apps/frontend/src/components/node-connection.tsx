'use client';
export {}
exports.NodeConnection = NodeConnection;
import react_1 from 'react';
function NodeConnection({ from, to }): any {
    const fromPos = { x: 0, y: 0 };
    const toPos = { x: 100, y: 100 };
    return (<svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
      <line x1={fromPos.x} y1={fromPos.y} x2={toPos.x} y2={toPos.y} stroke="white" strokeWidth="2"/>
    </svg>);
}
export {};
//# sourceMappingURL=node-connection.js.map