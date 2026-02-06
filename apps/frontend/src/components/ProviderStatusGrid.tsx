import React, { useState, useEffect } from 'react';
import {
  ProviderDefinition,
  AuthProfile
} from '@the-new-fuse/types';
import { llmProviderService } from '@/services/LLMProviderService';
import { GlassCard } from '@/components/ui/premium/GlassCard';
import { Zap, ShieldCheck, ShieldAlert, Cpu, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ProviderStatusGrid() {
  const [providers, setProviders] = useState<ProviderDefinition[]>([]);
  const [profiles, setProfiles] = useState<AuthProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, prof] = await Promise.all([
          llmProviderService.listProviders(),
          llmProviderService.getAuthProfiles()
        ]);
        setProviders(p);
        setProfiles(prof);
      } catch (err) {
        console.error('Dashboard failed to load providers:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
           <Cpu className="w-5 h-5 text-blue-400" />
           Intelligence Nodes
        </h3>
        <Badge variant="outline" className="border-blue-500/30 text-blue-400">
           {profiles.length} Active Connections
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map(provider => {
          const isConnected = profiles.some(p => p.providerId === provider.id);
          return (
            <GlassCard key={provider.id} className="relative overflow-hidden group">
              <div className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                  isConnected ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-900/50 border-slate-800 text-slate-500'
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-100 truncate">{provider.name}</h4>
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <span className="flex items-center gap-1 text-[10px] text-green-400 font-bold uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3" /> Ready
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <ShieldAlert className="w-3 h-3" /> Standby
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">{provider.models.length} Models</div>
                  <Activity className={`w-4 h-4 ml-auto mt-1 ${isConnected ? 'text-blue-500' : 'text-slate-700'}`} />
                </div>
              </div>
              {/* Subtle hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
