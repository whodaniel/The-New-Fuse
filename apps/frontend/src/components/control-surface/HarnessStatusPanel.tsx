import { GlassCard } from '@/components/ui/premium/GlassCard';
import { Loader2, PauseCircle, PlayCircle, Shield, Users } from 'lucide-react';
import { useHarnessStatus } from './useHarnessStatus';

export function HarnessStatusPanel() {
  const { data, isLoading, isError } = useHarnessStatus();

  if (isLoading) {
    return (
      <GlassCard className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading harness status…
      </GlassCard>
    );
  }

  if (isError || !data) {
    return (
      <GlassCard className="p-4 text-sm text-muted-foreground">
        Harness API unavailable — start the API co-located with your operator CLI, or run{' '}
        <code className="font-mono text-xs">tnf harness fleet-status</code>.
      </GlassCard>
    );
  }

  const partialLayers = data.harness?.layers
    ? Object.entries(data.harness.layers).filter(([, v]) => v.status !== 'implemented')
    : [];

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          Harness Framework
        </h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            data.fleet.paused ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300'
          }`}
        >
          {data.fleet.paused ? (
            <span className="inline-flex items-center gap-1">
              <PauseCircle className="w-3 h-3" /> {data.fleet.mode}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <PlayCircle className="w-3 h-3" /> running
            </span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-muted-foreground text-xs uppercase tracking-wide">Relay agents</div>
          <div className="font-medium flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {data.relay.registryCount}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs uppercase tracking-wide">Harness ver.</div>
          <div className="font-medium">{data.harness?.version ?? '—'}</div>
        </div>
      </div>

      {partialLayers.length > 0 && (
        <div className="text-xs text-amber-300/90">
          {partialLayers.length} layer(s) not fully implemented:{' '}
          {partialLayers.map(([k]) => k.replace(/_/g, ' ')).join(', ')}
        </div>
      )}

      {data.lastCycle && (
        <div className="text-xs text-muted-foreground border-t border-white/5 pt-2">
          Last cycle: {String((data.lastCycle as { timestamp?: string }).timestamp ?? 'recorded')}
        </div>
      )}
    </GlassCard>
  );
}
