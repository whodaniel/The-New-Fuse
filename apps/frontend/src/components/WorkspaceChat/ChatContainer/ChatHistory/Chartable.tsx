import React from 'react';
import { WorkspaceData } from '@/types/workspace';

interface ChartableProps {
  workspace: WorkspaceData | null;
  props: {
    content: string;
    uuid?: string;
    type?: string;
  };
}

export default function Chartable({ workspace, props }: ChartableProps) {
  // Basic chart visualization component
  return (
    <div className="flex justify-center items-center w-full my-4">
      <div className="bg-white/10 rounded-lg p-4 w-full max-w-4xl">
        <h3 className="text-white text-lg font-semibold mb-2">Chart Visualization</h3>
        <div className="bg-white/5 rounded p-4 min-h-[200px] flex items-center justify-center">
          <div className="text-white/60 text-center">
            <div className="text-2xl mb-2">📊</div>
            <p>Chart data would be rendered here</p>
            <pre className="text-xs mt-2 text-left overflow-auto max-h-20">
              {JSON.stringify(props.content, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}