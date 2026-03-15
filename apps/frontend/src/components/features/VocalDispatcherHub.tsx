import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Radio, Settings, Terminal } from 'lucide-react';
import React, { useState } from 'react';

interface Destination {
  id: string;
  name: string;
  type: 'terminal' | 'log' | 'broadcast';
  status: 'active' | 'idle' | 'muted';
}

const VocalDispatcherHub: React.FC = () => {
  const [activeDest, setActiveDest] = useState<string>('gemini-terminal');
  const [destinations] = useState<Destination[]>([
    { id: 'gemini-terminal', name: 'Gemini Orchestrator', type: 'terminal', status: 'active' },
    { id: 'codex-terminal', name: 'Codex Swarm Watcher', type: 'terminal', status: 'idle' },
    { id: 'master-log', name: 'Atomic Truths Vault', type: 'log', status: 'idle' },
    { id: 'global-broadcast', name: 'Swarm Broadcast', type: 'broadcast', status: 'muted' },
  ]);

  const handleSwitch = (id: string) => {
    setActiveDest(id);
    console.log(`📡 Vocal Routing switched to: ${id}`);
    // In a real implementation, this would trigger a backend update to the bridge script
  };

  return (
    <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-white overflow-hidden">
      <CardHeader className="bg-zinc-800/50 border-b border-zinc-700/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Radio className="w-5 h-5 text-orange-500 animate-pulse" />
            Vocal Dispatcher Hub
          </CardTitle>
          <Badge variant="outline" className="text-zinc-400 border-zinc-700 font-mono">
            v1.0-STABLE
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col gap-3">
          {destinations.map((dest) => (
            <div
              key={dest.id}
              className={`p-3 rounded-md border flex items-center justify-between transition-all cursor-pointer ${
                activeDest === dest.id
                  ? 'bg-orange-500/10 border-orange-500/50'
                  : 'bg-zinc-800/20 border-zinc-800 hover:border-zinc-700'
              }`}
              onClick={() => handleSwitch(dest.id)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    activeDest === dest.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {dest.type === 'terminal' ? <Terminal size={18} /> : <Settings size={18} />}
                </div>
                <div>
                  <div className="font-medium">{dest.name}</div>
                  <div className="text-xs text-zinc-500 font-mono uppercase">{dest.id}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeDest === dest.id && (
                  <Mic size={16} className="text-orange-500 animate-bounce" />
                )}
                <div
                  className={`w-2 h-2 rounded-full ${
                    dest.status === 'active'
                      ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                      : dest.status === 'muted'
                        ? 'bg-red-500'
                        : 'bg-zinc-600'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 italic">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            Direct Buffer Injection Active
          </div>
          <div>Matrix Synced</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VocalDispatcherHub;
