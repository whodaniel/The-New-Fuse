import { Badge, GlassCard, PremiumButton, PremiumInput, PremiumSelect } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { agentService } from '@/services/AgentService';
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Cpu,
  Eye,
  FileCode,
  HardDrive,
  Layers,
  Loader2,
  Lock,
  Network,
  Plus,
  Shield,
  Terminal,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AGENT FORGE 3.0: THE KERNEL INTERFACE
 * Hardware-intimate manufacturing for the Self-Synthesizing Swarm.
 */
export const UnifiedAgentCreator: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [isForging, setIsForging] = useState(false);

  // Forge State - Aligned with TNF Next-Gen Architecture
  const [formData, setFormData] = useState({
    name: '',
    type: 'executor',
    model: 'dola-seed-2.0-pro:free',
    provider: 'kilocode',
    description: '',
    capabilities: ['relay', 'memory'],
    sensory: {
      vision: 'simd-optimized',
      audio: 'spectral-matching',
      capture: 'zero-copy-mss',
    },
    forge: {
      jitEnabled: true,
      llvmSafety: true,
      simdAcceleration: true,
    },
    sandbox: {
      enabled: true,
      isolation: 'macOS-sandbox-exec',
      permissions: ['filesystem-read', 'network-egress'],
    },
  });

  const handleForge = async () => {
    setIsForging(true);
    try {
      // Sync with PFP Studio Identity logic
      const pfpUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(formData.name)}&backgroundColor=020617&eyes=shade,frame&mouth=bite,pixel`;

      await agentService.createAgent({
        name: formData.name,
        type: formData.type,
        description: formData.description,
        model: formData.model,
        provider: formData.provider,
        capabilities: formData.capabilities,
        configuration: {
          sandbox: formData.sandbox,
          sensory: formData.sensory,
          forge: formData.forge,
          bus: { protocol: 'synaptic-rust-v1', throughput: 'high-priority' },
        },
        metadata: {
          forgedAt: new Date().toISOString(),
          status: 'standby',
          pfpUrl: pfpUrl,
          kernelVersion: 'LLVM-Forge-0.9.4',
        },
        status: 'standby',
        version: '1.0.0',
      });

      addToast({
        title: 'Hardware Link Established',
        description: `${formData.name} has been forged into the kernel.`,
        variant: 'success',
      });
      navigate('/agents');
    } catch (err) {
      addToast({
        title: 'Forge Autophagy Failure',
        description: 'Critical error during native compilation handshake.',
        variant: 'error',
      });
    } finally {
      setIsForging(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div className="space-y-2 border-l-4 border-amber-500 pl-6">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
          Core Synthesis
        </h2>
        <p className="text-lg text-slate-400">Define the operative identity and neural backbone.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">
            Agent Callsign
          </label>
          <PremiumInput
            placeholder="e.g. Hermes-0.8.0-Local"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="h-16 text-xl bg-slate-950/50 border-slate-800 focus:border-amber-500/50"
          />
        </div>
        <div className="space-y-4">
          <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">
            Operational Archetype
          </label>
          <PremiumSelect
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { label: 'Executor (JIT/Native)', value: 'executor' },
              { label: 'Scout (Sensor/Vision)', value: 'scout' },
              { label: 'Analyzer (LLVM/Safety)', value: 'analyzer' },
              { label: 'Coordinator (Bus/Sync)', value: 'coordinator' },
            ]}
            className="h-16 text-lg bg-slate-950/50 border-slate-800"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">
            Neural Provider Backbone
          </label>
          <span className="text-[9px] text-slate-500 font-bold uppercase">
            Fallback Chain Enabled
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              id: 'kilocode',
              name: 'KiloCode',
              sub: 'Dola-Seed-2.0-Pro',
              icon: Zap,
              active: formData.provider === 'kilocode',
            },
            {
              id: 'nvidia',
              name: 'NVIDIA NGC',
              sub: 'Llama-3-70B-SIMD',
              icon: Cpu,
              active: formData.provider === 'nvidia',
            },
            {
              id: 'local',
              name: 'Local Kernel',
              sub: 'Gemma-2-9B-Native',
              icon: HardDrive,
              active: formData.provider === 'local',
            },
          ].map((p) => (
            <div
              key={p.id}
              onClick={() => setFormData({ ...formData, provider: p.id, model: p.sub })}
              className={`p-5 rounded-xl border transition-all cursor-pointer group ${
                p.active
                  ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-lg ${p.active ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400 group-hover:text-white'}`}
                >
                  <p.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-black text-white uppercase text-xs tracking-wider">{p.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{p.sub}</p>
                </div>
              </div>
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
          className="bg-amber-500 hover:bg-amber-600 text-black font-black"
        >
          Initialize Sensory Suite
          <ArrowRight className="ml-2 h-6 w-6" />
        </PremiumButton>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-left">
      <div className="space-y-2 border-l-4 border-sky-500 pl-6">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
          Sensory & Tools
        </h2>
        <p className="text-lg text-slate-400">Map native hardware inputs to the agent runtime.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-6 bg-slate-950/40 border-slate-800 space-y-6">
          <h3 className="text-xs font-black text-sky-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Eye className="w-4 h-4" /> Sensory Overrides
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-black/40 rounded border border-white/5">
              <span className="text-sm font-bold text-white uppercase tracking-tighter">
                SIMD Vision (34 FPS)
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]">
                ACTIVE
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/40 rounded border border-white/5">
              <span className="text-sm font-bold text-white uppercase tracking-tighter">
                Spectral Audio Link
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]">
                ACTIVE
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/40 rounded border border-white/5">
              <span className="text-sm font-bold text-white uppercase tracking-tighter">
                Zero-Copy MSS Capture
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]">
                ACTIVE
              </Badge>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-2 gap-4">
          {[
            { id: 'relay', name: 'Synaptic Bus', icon: Network, color: 'text-amber-400' },
            { id: 'forge', name: 'JIT Forge', icon: Wand2, color: 'text-fuchsia-400' },
            { id: 'safety', name: 'IR Safety', icon: Shield, color: 'text-emerald-400' },
            { id: 'memory', name: 'Compounding', icon: Layers, color: 'text-sky-400' },
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
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col gap-3 ${
                  isActive
                    ? 'border-sky-500 bg-sky-500/10 shadow-[0_0_20px_rgba(14,165,233,0.1)]'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-600'
                }`}
              >
                <div className={`p-2 w-fit rounded-lg bg-transparent/10 ${tool.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-black text-white uppercase text-[10px] tracking-widest">
                  {tool.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between pt-8">
        <PremiumButton
          size="xl"
          variant="outline"
          onClick={() => setStep(1)}
          className="border-slate-800 text-slate-400"
        >
          <ArrowLeft className="mr-2 h-6 w-6" />
          Neural Link
        </PremiumButton>
        <PremiumButton
          size="xl"
          variant="gradient"
          onClick={() => setStep(3)}
          className="bg-sky-500 hover:bg-sky-600 text-black font-black"
        >
          Configure Forge
          <ArrowRight className="ml-2 h-6 w-6" />
        </PremiumButton>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-left">
      <div className="space-y-2 border-l-4 border-fuchsia-500 pl-6">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
          Forge Execution
        </h2>
        <p className="text-lg text-slate-400">
          Finalize runtime parameters and hardware isolation.
        </p>
      </div>

      <GlassCard className="p-8 bg-slate-950/40 border-slate-800 space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/30">
              <Lock className="h-8 w-8 text-fuchsia-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                OS Sandbox Isolation
              </h3>
              <p className="text-slate-400 text-sm font-medium">
                Hardened environment via macOS `sandbox-exec`
              </p>
            </div>
          </div>
          <div
            className={`w-16 h-8 rounded-full transition-all cursor-pointer flex items-center p-1 ${
              formData.sandbox.enabled ? 'bg-fuchsia-500' : 'bg-slate-800'
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
            <label className="text-[10px] font-black text-fuchsia-500 uppercase tracking-[0.3em]">
              Compilation Mode
            </label>
            <PremiumSelect
              value={formData.forge.jitEnabled ? 'jit' : 'interpreted'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  forge: { ...formData.forge, jitEnabled: e.target.value === 'jit' },
                })
              }
              options={[
                { label: 'JIT Hot-Swap (Native)', value: 'jit' },
                { label: 'Interpreted (Script)', value: 'interpreted' },
              ]}
              className="h-14 bg-slate-950 border-slate-800"
            />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-fuchsia-500 uppercase tracking-[0.3em]">
              Security Gating
            </label>
            <PremiumSelect
              value={formData.forge.llvmSafety ? 'strict' : 'heuristic'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  forge: { ...formData.forge, llvmSafety: e.target.value === 'strict' },
                })
              }
              options={[
                { label: 'Strict LLVM IR Audit', value: 'strict' },
                { label: 'Heuristic Syscall Check', value: 'heuristic' },
              ]}
              className="h-14 bg-slate-950 border-slate-800"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-black/20">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-slate-500" />
            <p className="text-xs font-mono text-slate-500">
              STDOUT: Preparing native target... LLVM-Triple: arm64-apple-darwin
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="flex justify-between pt-8">
        <PremiumButton
          size="xl"
          variant="outline"
          onClick={() => setStep(2)}
          className="border-slate-800 text-slate-400"
        >
          <ArrowLeft className="mr-2 h-6 w-6" />
          Sensory
        </PremiumButton>
        <PremiumButton
          size="xl"
          variant="gradient"
          onClick={handleForge}
          disabled={isForging}
          className="bg-fuchsia-500 hover:bg-fuchsia-600 text-black font-black shadow-[0_0_50px_rgba(217,70,239,0.4)]"
        >
          {isForging ? (
            <>
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Compining Native Binary...
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
    <div className="min-h-screen bg-[#020617] px-3 py-16">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Breadcrumbs - High Contrast */}
        <div className="flex items-center justify-center gap-6">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all border-2 ${
                  step >= s
                    ? 'border-amber-500 bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                    : 'border-slate-800 bg-slate-900 text-slate-600'
                }`}
              >
                {s === 1 ? (
                  <Brain className="w-6 h-6" />
                ) : s === 2 ? (
                  <Plus className="w-6 h-6" />
                ) : (
                  <FileCode className="w-6 h-6" />
                )}
              </div>
              {s < 3 && (
                <div className={`h-[2px] w-20 ${step > s ? 'bg-amber-500' : 'bg-slate-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <GlassCard className="p-10 md:p-16 rounded-[4rem] border-white/5 bg-slate-900/40 shadow-none relative overflow-hidden backdrop-blur-3xl">
          {/* Hardware grid background pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Decorative background pulse */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/5 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-sky-500/5 rounded-full blur-[120px] animate-pulse" />

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </GlassCard>

        <div className="text-center">
          <button
            onClick={() => navigate('/agents')}
            className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 hover:text-red-400 transition-colors flex items-center gap-2 mx-auto"
          >
            <X className="h-4 w-4" />
            Abort Sync Protocol
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedAgentCreator;
