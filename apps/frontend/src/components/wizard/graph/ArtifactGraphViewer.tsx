import React, { useEffect, useState } from 'react';
import { Loader2, FileJson, Share2, Download, Maximize2 } from 'lucide-react';
import { GraphVisualizer } from './GraphVisualizer';

interface ArtifactGraphViewerProps {
  artifactUrl: string;
  title?: string;
}

export const ArtifactGraphViewer: React.FC<ArtifactGraphViewerProps> = ({ artifactUrl, title }) => {
  const [data, setData] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await fetch(artifactUrl);
        if (!response.ok) throw new Error(`Failed to load artifact: ${response.statusText}`);
        
        const jsonData = await response.json();
        
        // Transform data if it's in a slightly different format
        const nodes = (jsonData.nodes || []).map((n: any) => ({
          id: n.id,
          data: {
            label: n.label || n.name || n.id,
            kind: n.kind || n.type || 'node',
            ...n
          },
          position: n.position || { x: Math.random() * 400, y: Math.random() * 400 }
        }));

        const edges = (jsonData.edges || []).map((e: any) => ({
          id: e.id || `${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          label: e.type || e.label,
          animated: true,
          data: { ...e }
        }));

        setData({ nodes, edges });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [artifactUrl]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 bg-black/20 rounded-xl border border-white/5">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <div className="text-sm font-medium text-gray-400">Synthesizing graph structure...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
        <div className="text-red-400 font-bold mb-1">Graph Synthesis Failed</div>
        <div className="text-xs text-red-300/60 truncate max-w-md mx-auto">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black/40 rounded-xl border border-white/5 overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-2">
          <FileJson className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-gray-200 uppercase tracking-widest">
            {title || 'Graph Artifact Viewer'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-400" title="Full Screen">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-400" title="Export">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative min-h-[500px]">
        <GraphVisualizer 
          nodes={data.nodes} 
          edges={data.edges}
          onNodeClick={(e, node) => console.log('Node clicked:', node)}
        />
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-black/20 text-[10px] text-gray-500 font-mono">
        <div>{data.nodes.length} nodes • {data.edges.length} edges</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Premium Renderer</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
            <span>Interactive</span>
          </div>
        </div>
      </div>
    </div>
  );
};
