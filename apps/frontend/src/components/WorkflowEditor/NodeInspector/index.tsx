import React from 'react';
import { Tab } from '@headlessui/react';
import { ConfigurationPanel } from './ConfigurationPanel.js';
import { InputsPanel } from './InputsPanel.js';
import { OutputsPanel } from './OutputsPanel.js';
import { HistoryPanel } from './HistoryPanel.js';
import type { Node } from '../../../types/workflow.js';

interface NodeInspectorProps {
  node: Node;
  onUpdate: (changes: any) => void;
}

export const NodeInspector: React.React.FC<NodeInspectorProps> = ({ node, onUpdate }) => {
  return (
    <div className="node-inspector w-80 border-l bg-secondary">
      <div className="p-4 border-b">
        <h3 className="font-semibold">{node.data.label}</h3>
        <p className="text-sm text-gray-500">{node.type}</p>
      </div>

      <Tab.Group>
        <Tab.List className="flex border-b">
          <Tab className="flex-1 p-2 ui-selected:border-b-2 ui-selected:border-primary">
            Configuration
          </Tab>
          <Tab className="flex-1 p-2 ui-selected:border-b-2 ui-selected:border-primary">
            Inputs
          </Tab>
          <Tab className="flex-1 p-2 ui-selected:border-b-2 ui-selected:border-primary">
            Outputs
          </Tab>
          <Tab className="flex-1 p-2 ui-selected:border-b-2 ui-selected:border-primary">
            History
          </Tab>
        </Tab.List>

        <Tab.Panels className="overflow-y-auto h-[calc(100vh-200px)]">
          <Tab.Panel>
            <ConfigurationPanel node={node} onUpdate={onUpdate} />
          </Tab.Panel>
          <Tab.Panel>
            <InputsPanel node={node} onUpdate={onUpdate} />
          </Tab.Panel>
          <Tab.Panel>
            <OutputsPanel node={node} />
          </Tab.Panel>
          <Tab.Panel>
            <HistoryPanel nodeId={node.id} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};