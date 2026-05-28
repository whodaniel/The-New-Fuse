import { FC } from 'react';
export interface SubgraphModuleProps {
  graphData?: Record<string, unknown>;
  onNodeClick?: (nodeId: string) => void;
}
export const SubgraphModule: FC<SubgraphModuleProps> = ({ graphData }) => (
  <div className="tnf-subgraph" data-testid="subgraph-module">
    <h3>Knowledge Subgraph</h3>
    {graphData ? <pre>{JSON.stringify(graphData, null, 2)}</pre> : <p>No graph data</p>}
  </div>
);
export default SubgraphModule;
