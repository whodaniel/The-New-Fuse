"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineNode = PipelineNode;
import react_1 from 'react';
import framer_motion_1 from 'framer-motion';
import card_1 from '@/components/ui/card';
function PipelineNode({ node, onDrag, onConnect }) {
    const handleDragEnd = (event, info) => {
        onDrag({ x: info.point.x, y: info.point.y });
    };
    return (<framer_motion_1.motion.div drag dragMomentum={false} onDragEnd={handleDragEnd} style={{
            position: 'absolute',
            left: node.position.x,
            top: node.position.y,
        }}>
      <card_1.Card className="w-48">
        <card_1.CardHeader>
          <card_1.CardTitle>{node.type}</card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent>
          
          <div className="flex justify-between">
            <div className="w-3 h-3 bg-blue-500 rounded-full cursor-pointer" onMouseDown={() => onConnect(node.id, 'input')}/>
            <div className="w-3 h-3 bg-green-500 rounded-full cursor-pointer" onMouseDown={() => onConnect(node.id, 'output')}/>
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </framer_motion_1.motion.div>);
}
export {};
//# sourceMappingURL=pipeline-node.js.map