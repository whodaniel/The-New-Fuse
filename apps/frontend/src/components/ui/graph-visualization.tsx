import MasterGraph from '@/pages/MasterGraph';

interface GraphVisualizationProps {
  /** @deprecated The master graph uses its authenticated graph service. */
  websocketUrl?: string;
  showMiniMap?: boolean;
  showControls?: boolean;
  className?: string;
}

/** Compatibility surface backed by actual graph data. */
export function GraphVisualization({ className = '' }: GraphVisualizationProps) {
  return (
    <div className={className}>
      <MasterGraph embedded />
    </div>
  );
}
export default GraphVisualization;
