'use client';
import { jsx as _jsx } from "react/jsx-runtime";
exports.NodeConnection = NodeConnection;
function NodeConnection(_a) {
    var from = _a.from, to = _a.to;
    var fromPos = { x: 0, y: 0 };
    var toPos = { x: 100, y: 100 };
    return (_jsx("svg", { style: { position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }, children: _jsx("line", { x1: fromPos.x, y1: fromPos.y, x2: toPos.x, y2: toPos.y, stroke: "white", strokeWidth: "2" }) }));
}
