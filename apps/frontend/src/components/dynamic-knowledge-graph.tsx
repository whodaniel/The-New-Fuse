"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicKnowledgeGraph = DynamicKnowledgeGraph;
import react_1 from 'react';
import react_force_graph_1 from 'react-force-graph';
import card_1 from '@/components/ui/card';
import websocket_1 from '../services/websocket.js';
function DynamicKnowledgeGraph() {
    const fgRef = (0, react_1.useRef)();
    const [graphData, setGraphData] = (0, react_1.useState)({ nodes: [], links: [] });
    (0, react_1.useEffect)(() => {
        websocket_1.webSocketService.on('knowledgeGraphUpdate', setGraphData);
        return () => {
            websocket_1.webSocketService.off('knowledgeGraphUpdate', setGraphData);
        };
    }, []);
    return (<card_1.Card className="w-full h-[600px]">
      <card_1.CardHeader>
        <card_1.CardTitle>Dynamic Knowledge Graph</card_1.CardTitle>
      </card_1.CardHeader>
      <card_1.CardContent className="h-full">
        <react_force_graph_1.ForceGraph3D ref={fgRef} graphData={graphData} nodeLabel="name" nodeAutoColorBy="group" linkDirectionalParticles={2} linkDirectionalParticleSpeed={d => d.value * 0.001} nodeThreeObject={nod(e: any) => {
            const sprite = new SpriteText(node.name);
            sprite.color = node.color;
            sprite.textHeight = 8;
            return sprite;
        }}/>
      </card_1.CardContent>
    </card_1.Card>);
}
export {};
//# sourceMappingURL=dynamic-knowledge-graph.js.map