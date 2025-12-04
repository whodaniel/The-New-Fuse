"use strict";
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicKnowledgeGraph = DynamicKnowledgeGraph;
import react_1 from 'react';
import react_force_graph_1 from 'react-force-graph';
import card_1 from '@/components/ui/card';
import websocket_1 from '../services/websocket';
function DynamicKnowledgeGraph() {
    var fgRef = (0, react_1.useRef)();
    var _a = (0, react_1.useState)({ nodes: [], links: [] }), graphData = _a[0], setGraphData = _a[1];
    (0, react_1.useEffect)(function () {
        websocket_1.webSocketService.on('knowledgeGraphUpdate', setGraphData);
        return function () {
            websocket_1.webSocketService.off('knowledgeGraphUpdate', setGraphData);
        };
    }, []);
    return (_jsxs(card_1.Card, { className: "w-full h-[600px]", children: [_jsx(card_1.CardHeader, { children: _jsx(card_1.CardTitle, { children: "Dynamic Knowledge Graph" }) }), _jsx(card_1.CardContent, { className: "h-full", children: _jsx(react_force_graph_1.ForceGraph3D, { ref: fgRef, graphData: graphData, nodeLabel: "name", nodeAutoColorBy: "group", linkDirectionalParticles: 2, linkDirectionalParticleSpeed: function (d) { return d.value * 0.001; }, nodeThreeObject: function (node) {
                        var sprite = new SpriteText(node.name);
                        sprite.color = node.color;
                        sprite.textHeight = 8;
                        return sprite;
                    } }) })] }));
}
