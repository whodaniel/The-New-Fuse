import React, { useState, useEffect } from 'react';
import {
  ProviderDefinition,
  AuthProfile,
  ProviderConfig
} from '@the-new-fuse/types';
import { llmProviderService } from '@/services/LLMProviderService';
import { GlassCard } from '@/components/ui/premium/GlassCard';
import { PremiumButton } from '@/components/ui/premium/PremiumButton';
import { PremiumInput } from '@/components/ui/premium/PremiumInput';
import {
  Shield,
  Key,
  Zap,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  GripVertical,
  Activity
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AdvancedLLMProviders() {
  const [providers, setProviders] = useState<ProviderDefinition[]>([]);
  const [profiles, setProfiles] = useState<AuthProfile[]>([]);
  const [config, setConfig] = useState<ProviderConfig | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newApiKey, setNewApiKey] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [p, prof, c] = await Promise.all([
        llmProviderService.listProviders(),
        llmProviderService.getAuthProfiles(),
        llmProviderService.getConfig()
      ]);
      setProviders(p);
      setProfiles(prof);
      setConfig(c);
      if (p.length > 0 && !selectedProviderId) {
        setSelectedProviderId(p[0].id);
      }
    } catch (error) {
      console.error('Failed to load LLM provider data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProvider = providers.find(p => p.id === selectedProviderId);
  const selectedProfile = profiles.find(p => p.providerId === selectedProviderId);

  const handleAddApiKey = async () => {
    if (!selectedProviderId || !newApiKey) return;

    const profile: AuthProfile = {
      id: `${selectedProviderId}:${Date.now()}`,
      providerId: selectedProviderId,
      label: `${selectedProvider?.name} Key`,
      credential: {
        type: 'api_key',
        key: newApiKey
      }
    };

    try {
      await llmProviderService.addAuthProfile(profile);
      setNewApiKey('');
      loadData();
    } catch (error) {
      console.error('Failed to add API key:', error);
    }
  };

  const handleSetPrimaryModel = async (modelId: string) => {
    if (!config) return;
    const newConfig = { ...config, primaryModelId: modelId };
    try {
      await llmProviderService.saveConfig(newConfig);
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Provider Network...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Provider Network
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage your AI intelligence grid. Connect providers and orchestrate model failover.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Provider List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Available Nodes
            </h2>
            <PremiumButton variant="ghost" size="sm" className="h-8 gap-1">
              <Plus className="w-3 h-3" /> Add Node
            </PremiumButton>
          </div>

          <div className="space-y-3">
            {providers.map(provider => {
              const isSelected = provider.id === selectedProviderId;
              const isConnected = profiles.some(p => p.providerId === provider.id);

              return (
                <GlassCard
                  key={provider.id}
                  onClick={() => setSelectedProviderId(provider.id)}
                  className={`cursor-pointer transition-all duration-300 border-2 ${
                    isSelected ? 'border-blue-500/50 scale-[1.02] shadow-lg shadow-blue-500/10' : 'border-transparent hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-slate-900/50 border border-slate-800`}>
                        {/* Placeholder for real icons */}
                        <Zap className={`w-6 h-6 ${isConnected ? 'text-blue-400' : 'text-slate-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100">{provider.name}</h3>
                        <p className="text-xs text-muted-foreground">{provider.models.length} models available</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={isConnected ? "success" as any : "secondary" as any} className="text-[10px] h-5">
                        {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                      </Badge>
                      {isConnected ? (
                         <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                         <XCircle className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>

        {/* Right Column: Provider Management */}
        <div className="lg:col-span-8">
          {selectedProvider ? (
            <GlassCard className="h-full border border-slate-800/50 overflow-hidden">
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-100">{selectedProvider.name} Management</h2>
                      <p className="text-muted-foreground">Configure authentication and intelligence routing for {selectedProvider.name}.</p>
                    </div>
                  </div>
                  <PremiumButton variant="outline" className="border-red-900/50 text-red-500 hover:bg-red-900/10">
                    Deactivate Node
                  </PremiumButton>
                </div>

                {/* 1. API Keys */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-100 font-semibold mb-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    1. Authentication & Security
                  </div>

                  {selectedProfile ? (
                    <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Active Credentials</p>
                        <code className="text-blue-300">••••••••••••••••{selectedProfile.credential.key?.slice(-4)}</code>
                      </div>
                      <PremiumButton variant="ghost" size="icon" onClick={() => llmProviderService.removeAuthProfile(selectedProfile.id).then(loadData)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </PremiumButton>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert variant="info" className="bg-blue-900/20 border-blue-800/50">
                        <Key className="h-4 w-4" />
                        <AlertTitle>No API Key Found</AlertTitle>
                        <AlertDescription>
                          A valid API key is required to activate this intelligence node.
                        </AlertDescription>
                      </Alert>
                      <div className="flex gap-3">
                        <PremiumInput
                          placeholder="Enter your API Key..."
                          className="flex-1"
                          type="password"
                          value={newApiKey}
                          onChange={(e) => setNewApiKey(e.target.value)}
                        />
                        <PremiumButton onClick={handleAddApiKey}>Connect Node</PremiumButton>
                      </div>
                    </div>
                  )}
                </section>

                {/* 2. Primary Model */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-100 font-semibold mb-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    2. Primary Intelligence Core
                  </div>

                  <div className="grid gap-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <PremiumButton variant="outline" className="w-full justify-between h-14 px-6 border-slate-800 hover:border-slate-600 bg-slate-900/20">
                          <div className="flex flex-col items-start">
                             <span className="text-xs text-muted-foreground">Active Model</span>
                             <span className="font-bold">{config?.primaryModelId.split('/')[1] || 'Select Model'}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 opacity-50" />
                        </PremiumButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[400px] bg-slate-950 border-slate-800 p-2 shadow-2xl">
                        {selectedProvider.models.map(model => (
                          <DropdownMenuItem
                            key={model.id}
                            className="flex flex-col items-start p-3 focus:bg-blue-600/20"
                            onClick={() => handleSetPrimaryModel(`${selectedProvider.id}/${model.id}`)}
                          >
                            <div className="font-bold flex items-center justify-between w-full">
                              {model.name}
                              {config?.primaryModelId === `${selectedProvider.id}/${model.id}` && (
                                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground flex gap-3 mt-1 uppercase tracking-tighter">
                               <span>Context: {model.contextWindow.toLocaleString()}</span>
                               <span>Reasoning: {model.reasoning ? 'YES' : 'NO'}</span>
                               <span>Cost: VERY LOW</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </section>

                {/* 3. Fallbacks */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-100 font-semibold mb-2">
                    <GripVertical className="w-5 h-5 text-amber-400" />
                    3. Failover Redundancy
                  </div>

                  <div className="space-y-2">
                    {config?.fallbackModelIds.map((fallbackId, idx) => (
                      <div key={fallbackId} className="flex items-center gap-3 bg-slate-900/30 p-3 rounded-xl border border-slate-800/50 group">
                        <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-amber-400 cursor-grab" />
                        <span className="text-sm font-medium flex-1 text-slate-300">{fallbackId}</span>
                        <Badge variant="outline" className="text-[10px] border-amber-900/50 text-amber-500">FALLBACK {idx + 1}</Badge>
                        <PremiumButton variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="w-3 h-3" />
                        </PremiumButton>
                      </div>
                    ))}
                    <PremiumButton variant="outline" className="w-full border-dashed border-slate-800 hover:border-slate-700 h-12 gap-2 text-muted-foreground">
                      <Plus className="w-4 h-4" /> Add Fallback Redundancy
                    </PremiumButton>
                  </div>
                </section>

                <div className="pt-6">
                  <PremiumButton className="w-full h-14 text-lg font-bold shadow-xl shadow-blue-600/20">
                    Save Network Configuration
                  </PremiumButton>
                </div>
              </div>
            </GlassCard>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Select a node from the network to configure.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
