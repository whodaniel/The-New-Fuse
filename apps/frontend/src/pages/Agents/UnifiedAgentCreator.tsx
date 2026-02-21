import { GlassCard, PremiumButton, PremiumInput, PremiumSelect } from '@/components/ui/premium';
import { useToast } from '@/hooks/useToast';
import { agentService } from '@/services/AgentService';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Layers,
  Loader2,
  Lock,
  Search,
  Shield,
  Terminal,
  Wand2,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AGENT FORGE 2.0
 * The definitive AI manufacturing interface.
 */
export const UnifiedAgentCreator: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [isForging, setIsForging] = useState(false);

  // Forge State
  const [formData, setFormData] = useState({
    name: '',
    type: 'scout',
    model: 'GPT-4o',
    description: '',
    capabilities: [] as string[],
    sandbox: {
      enabled: true,
      cpu: 1,
      memory: 512,
      isolation: 'ZeroClaw',
    },
  });

  const handleForge = async () => {
    setIsForging(true);
    try {
      await agentService.createAgent({
        name: formData.name,
        type: formData.type,
        description: formData.description,
        model: formData.model,
        capabilities: formData.capabilities,
        configuration: { sandbox: formData.sandbox },
        metadata: { forgedAt: new Date().toISOString(), status: 'standby' },
        status: 'standby',
        version: '1.0.0',
      });
      addToast({
        title: 'Soul Forged Successfully',
        description: `${formData.name} is now part of the swarm.`,
        variant: 'success',
      });
      navigate('/agents');
    } catch (err) {
      addToast({
        title: 'Forge Error',
        description: 'Failed to manufacture agent soul.',
        variant: 'error',
      });
    } finally {
      setIsForging(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-white">Soul Selection</h2>
        <p className="text-xl text-gray-400">
          Define the identity and intelligence level of your agent.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="text-sm font-bold text-blue-400 uppercase tracking-widest">
            Agent Name
          </label>
          <PremiumInput
            placeholder="e.g., PicoClaw Alpha"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="h-16 text-xl"
          />
        </div>
        <div className="space-y-4">
          <label className="text-sm font-bold text-blue-400 uppercase tracking-widest">
            Archetype
          </label>
          <PremiumSelect
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { label: 'Scout (Research)', value: 'scout' },
              { label: 'Analyzer (Audit)', value: 'analyzer' },
              { label: 'Executor (Code)', value: 'executor' },
              { label: 'Coordinator (Orch)', value: 'coordinator' },
            ]}
            className="h-16 text-xl"
          />
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-bold text-blue-400 uppercase tracking-widest">
          Model Backbone
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['GPT-4o', 'Claude 3.5', 'DeepSeek-V3', 'Llama-3.1'].map((m) => (
            <div
              key={m}
              onClick={() => setFormData({ ...formData, model: m })}
              className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                formData.model === m
                  ? 'border-blue-500 bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <p className="text-center font-bold text-white">{m}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-8">
        <PremiumButton
          size="xl"
          variant="gradient"
          disabled={!formData.name}
          onClick={() => setStep(2)}
        >
          Next: Tools & Capabilities
          <ArrowRight className="ml-2 h-6 w-6" />
        </PremiumButton>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-white">Tooling & MCP</h2>
        <p className="text-xl text-gray-400">Select the capabilities this agent will wield.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: 'web-search', name: 'Web Search', icon: Search, color: 'text-blue-400' },
          { id: 'filesystem', name: 'Filesystem', icon: Box, color: 'text-purple-400' },
          { id: 'git', name: 'GitHub Ops', icon: Terminal, color: 'text-green-400' },
          { id: 'sandbox', name: 'Sandboxing', icon: Shield, color: 'text-red-400' },
          { id: 'relay', name: 'Relay Protocol', icon: Zap, color: 'text-yellow-400' },
          { id: 'memory', name: 'Long-term Memory', icon: Layers, color: 'text-cyan-400' },
        ].map((tool) => {
          const Icon = tool.icon;
          const isActive = formData.capabilities.includes(tool.id);
          return (
            <div
              key={tool.id}
              onClick={() => {
                const newCaps = isActive
                  ? formData.capabilities.filter((c) => c !== tool.id)
                  : [...formData.capabilities, tool.id];
                setFormData({ ...formData, capabilities: newCaps });
              }}
              className={`p-6 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${
                isActive
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className={`p-3 rounded-lg bg-white/5 ${tool.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="font-bold text-white">{tool.name}</span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-8">
        <PremiumButton size="xl" variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft className="mr-2 h-6 w-6" />
          Back
        </PremiumButton>
        <PremiumButton size="xl" variant="gradient" onClick={() => setStep(3)}>
          Next: Sandbox Config
          <ArrowRight className="ml-2 h-6 w-6" />
        </PremiumButton>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-white">Sandbox Hardware</h2>
        <p className="text-xl text-gray-400">Enforce resource isolation via ZeroClaw.</p>
      </div>

      <GlassCard className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Lock className="h-8 w-8 text-red-400" />
            <div>
              <h3 className="text-2xl font-bold text-white">ZeroClaw Isolation</h3>
              <p className="text-gray-400">Hardened environment for untrusted task execution.</p>
            </div>
          </div>
          <div
            className={`w-16 h-8 rounded-full transition-all cursor-pointer flex items-center p-1 ${
              formData.sandbox.enabled ? 'bg-blue-500' : 'bg-gray-700'
            }`}
            onClick={() =>
              setFormData({
                ...formData,
                sandbox: { ...formData.sandbox, enabled: !formData.sandbox.enabled },
              })
            }
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                formData.sandbox.enabled ? 'translate-x-8' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="space-y-4">
            <label className="text-sm font-bold text-blue-400 uppercase tracking-widest">
              CPU Limit
            </label>
            <PremiumSelect
              value={formData.sandbox.cpu.toString()}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sandbox: { ...formData.sandbox, cpu: parseInt(e.target.value) },
                })
              }
              options={[
                { label: '0.5 vCPU (Efficient)', value: '0.5' },
                { label: '1.0 vCPU (Standard)', value: '1' },
                { label: '2.0 vCPU (Pro)', value: '2' },
              ]}
              className="h-14"
            />
          </div>
          <div className="space-y-4">
            <label className="text-sm font-bold text-blue-400 uppercase tracking-widest">
              Memory Limit
            </label>
            <PremiumSelect
              value={formData.sandbox.memory.toString()}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sandbox: { ...formData.sandbox, memory: parseInt(e.target.value) },
                })
              }
              options={[
                { label: '256 MB (Nano)', value: '256' },
                { label: '512 MB (Standard)', value: '512' },
                { label: '1024 MB (Power)', value: '1024' },
              ]}
              className="h-14"
            />
          </div>
        </div>
      </GlassCard>

      <div className="flex justify-between pt-8">
        <PremiumButton size="xl" variant="outline" onClick={() => setStep(2)}>
          <ArrowLeft className="mr-2 h-6 w-6" />
          Back
        </PremiumButton>
        <PremiumButton
          size="xl"
          variant="gradient"
          onClick={handleForge}
          disabled={isForging}
          className="shadow-[0_0_40px_rgba(59,130,246,0.6)]"
        >
          {isForging ? (
            <>
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Forging Soul...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-6 w-6" />
              Finalize & Deploy
            </>
          )}
        </PremiumButton>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent px-6 py-16">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-4">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  step >= s ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-800 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`h-1 w-12 rounded-full ${step > s ? 'bg-blue-500' : 'bg-gray-800'}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <GlassCard className="p-12 rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden">
          {/* Decorative background pulse */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] animate-pulse" />

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </GlassCard>

        <div className="text-center">
          <button
            onClick={() => navigate('/agents')}
            className="text-gray-500 hover:text-white transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Abort Manufacturing
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedAgentCreator;
