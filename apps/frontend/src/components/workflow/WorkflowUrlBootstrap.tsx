/**
 * Load ?id= (and optional source=local-ai) into the shared WorkflowProvider canvas.
 * Cloud UUIDs come from Nest GET /api/workflows/:id; local-ai is not available in SaaS.
 */
import { useWorkflow } from '@the-new-fuse/workflow-builder';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export const WorkflowUrlBootstrap: React.FC<{
  onMeta?: (name?: string, description?: string) => void;
}> = ({ onMeta }) => {
  const [searchParams] = useSearchParams();
  const { actions } = useWorkflow();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('id');
    const source = searchParams.get('source');
    if (!id) return;

    let cancelled = false;
    void (async () => {
      setError(null);
      if (source === 'local-ai') {
        setError(
          'source=local-ai graphs live on the desktop (~/.tnf/workflow-graphs). Use Open SaaS builder from TNF Desktop to sync first.'
        );
        return;
      }
      try {
        setStatus(`Loading workflow ${id}…`);
        await actions.loadWorkflow(id);
        if (cancelled) return;
        setStatus(`Loaded workflow ${id}`);
        onMeta?.();
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || `Failed to load workflow ${id}`);
        setStatus(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actions, onMeta, searchParams]);

  if (!status && !error) return null;
  return (
    <div
      className={`px-3 py-1.5 text-xs border-b ${
        error
          ? 'bg-rose-950/40 border-rose-500/30 text-rose-100'
          : 'bg-emerald-950/30 border-emerald-500/20 text-emerald-100'
      }`}
    >
      {error || status}
    </div>
  );
};

export default WorkflowUrlBootstrap;
