'use client';
import { GlassCard as Card } from '@/components/ui/premium/GlassCard';
import { motion } from 'framer-motion';

interface PipelineNodeProps {
  node: {
    id: string;
    type: string;
    position: { x: number; y: number };
  };
  onDrag: (position: { x: number; y: number }) => void;
  onConnect: (nodeId: string, type: 'input' | 'output') => void;
}

export function PipelineNode({ node, onDrag, onConnect }: PipelineNodeProps) {
  const handleDragEnd = (_event: any, info: any) => {
    onDrag({ x: info.point.x, y: info.point.y });
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
      }}
    >
      <Card title={node.type} gradient="blue" className="w-48">
        <div className="flex justify-between">
          <div
            className="w-3 h-3 bg-blue-500 rounded-full cursor-pointer"
            onMouseDown={() => onConnect(node.id, 'input')}
          />
          <div
            className="w-3 h-3 bg-green-500 rounded-full cursor-pointer"
            onMouseDown={() => onConnect(node.id, 'output')}
          />
        </div>
      </Card>
    </motion.div>
  );
}
