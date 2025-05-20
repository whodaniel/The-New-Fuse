declare module 'd3-force-graph' {
  interface Node {
    id: string;
    name: string;
    x?: number;
    y?: number;
    __bckgDimensions?: [number, number];
  }

  interface Link {
    source: string;
    target: string;
  }

  interface GraphData {
    nodes: Node[];
    links: Link[];
  }

  interface ForceGraph2DInstance {
    graphData(data: GraphData): ForceGraph2DInstance;
    nodeLabel(label: string): ForceGraph2DInstance;
    nodeCanvasObject(fn: (node: Node, ctx: CanvasRenderingContext2D) => void): ForceGraph2DInstance;
    nodePointerAreaPaint(fn: (node: Node, color: string, ctx: CanvasRenderingContext2D) => void): ForceGraph2DInstance;
    onNodeClick(fn: (node: Node) => void): ForceGraph2DInstance;
    onWheel(fn: (event: WheelEvent) => void): ForceGraph2DInstance;
    d3Force(forceName: string, force: any): ForceGraph2DInstance;
    zoom(value?: number, durationMs?: number): number | ForceGraph2DInstance;
    centerAt(x: number, y: number, durationMs?: number): ForceGraph2DInstance;
    screen2GraphCoords(x: number, y: number): { x: number; y: number };
  }

  interface ForceGraph2DProps {
    ref?: React.RefObject<ForceGraph2DInstance>;
    graphData: GraphData;
    nodeLabel?: string;
    nodeCanvasObject?: (node: Node, ctx: CanvasRenderingContext2D) => void;
    nodePointerAreaPaint?: (node: Node, color: string, ctx: CanvasRenderingContext2D) => void;
    onNodeClick?: (node: Node) => void;
    onWheel?: (event: WheelEvent) => void;
  }

  const ForceGraph2D: React.React.FC<ForceGraph2DProps>;
  export default ForceGraph2D;
}
