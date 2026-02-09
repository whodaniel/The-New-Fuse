import React from 'react';
import { Flow } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';

interface ProtocolNode {
  type: 'request' | 'response' | 'error';
  schema: object;
  validation: object;
}

export const ProtocolDesigner: React.FC = () => {
  const [nodes, setNodes] = React.useState<ProtocolNode[]>([]);
  const [selectedFormat, setSelectedFormat] = React.useState('json');

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between p-4 border-b">
        <Select
          value={selectedFormat}
          onChange={(v) => setSelectedFormat(v)}
          options={[
            { label: 'JSON', value: 'json' },
            { label: 'Protocol Buffers', value: 'protobuf' },
            { label: 'GraphQL', value: 'graphql' }
          ]}
        />
        <Button onClick={() => {/* Export protocol */}}>
          Export Protocol
        </Button>
      </div>

      <div className="flex-1">
        <Flow
          nodes={nodes}
          onNodesChange={setNodes}
          fitView
        />
      </div>

      <Card className="m-4">
        <h3>Protocol Validation</h3>
        <pre className="bg-gray-100 p-2 rounded">
          {JSON.stringify(generateProtocolSpec(nodes), null, 2)}
        </pre>
      </Card>
    </div>
  );
};