import { Badge } from '@/components/ui/badge';
import { GlassCard, PremiumButton, PremiumInput } from '@/components/ui/premium';
import { AGENT_PFP_DEFAULT_COUNT, getAgentDefaultPfpUrl } from '@/data/agentPfpDefaults';
import {
  agentVisualProfileCatalog,
  createAgentProfileFallbackAvatar,
  type AgentVisualProfileRecord,
} from '@/data/agentVisualProfiles';
import {
  PFP_PROVIDER_OPTIONS,
  generatePfpImage,
  type PfpProviderOption,
} from '@/services/agentPfpProviders';
import {
  blobToDataUrl,
  fetchCloudOverrides,
  fileToDataUrl,
  getDefaultPrompt,
  loadPfpOverrides,
  loadPromptOverrides,
  mergePfpOverrides,
  pushCloudOverride,
  savePfpOverrides,
  savePromptOverrides,
  withStyleFlavor,
  type AgentPfpOverride,
  type AgentPfpOverrideMap,
  type AgentPromptOverrideMap,
} from '@/services/agentPfpStore';
import {
  CheckSquare,
  Cloud,
  Download,
  ImagePlus,
  Loader2,
  Paintbrush2,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Square,
  Wand2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

interface StylePreset {
  id: string;
  label: string;
  directive: string;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'cinematic-editorial',
    label: 'Cinematic Editorial',
    directive:
      'Photoreal editorial portrait, asymmetric studio composition, nuanced skin texture, subtle production grain, art-direction quality.',
  },
  {
    id: 'retro-future-tech',
    label: 'Retro Future Tech',
    directive:
      'Retro-future industrial design language, analog controls, brushed metal textures, grounded sci-fi realism, no celestial motifs.',
  },
  {
    id: 'neo-noir',
    label: 'Neo Noir',
    directive:
      'Neo-noir portrait with controlled contrast, moody practical lights, smoke haze, hard edge shadows, premium film still framing.',
  },
  {
    id: 'modern-brand',
    label: 'Modern Brand',
    directive:
      'Modern brand portrait, high-trust founder aesthetic, clean palette, product-led environment cues, no fantasy symbolism.',
  },
  {
    id: 'graphic-illustration',
    label: 'Graphic Illustration',
    directive:
      'Bold graphic illustration with posterized shading, intentional typography-safe framing, high legibility at avatar size.',
  },
];

interface PendingSingleRegeneration {
  agentId: string;
  prompt: string;
}

const badgeClass =
  'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition-colors duration-200';

function resolveImageSrc(agent: AgentVisualProfileRecord, overrides: AgentPfpOverrideMap): string {
  const override = overrides[agent.id];
  if (override?.imageUrl) return override.imageUrl;
  return getAgentDefaultPfpUrl(agent.id) || createAgentProfileFallbackAvatar(agent);
}

function downloadImage(name: string, dataUrl: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.png`;
  link.click();
}

export default function PfpStudioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<AgentPfpOverrideMap>({});
  const [promptOverrides, setPromptOverrides] = useState<AgentPromptOverrideMap>({});
  const [providerId, setProviderId] = useState<PfpProviderOption['id']>('imfinit');
  const [modelId, setModelId] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [stylePresetId, setStylePresetId] = useState(STYLE_PRESETS[0].id);
  const [autoRefreshAfterApply, setAutoRefreshAfterApply] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ complete: 0, total: 0 });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [modalState, setModalState] = useState<PendingSingleRegeneration | null>(null);
  const [singlePrompt, setSinglePrompt] = useState('');
  const [singleGenerating, setSingleGenerating] = useState(false);
  const [singlePreview, setSinglePreview] = useState<string | null>(null);

  const agents = agentVisualProfileCatalog.agents;

  const provider = useMemo(
    () =>
      PFP_PROVIDER_OPTIONS.find((option) => option.id === providerId) || PFP_PROVIDER_OPTIONS[0],
    [providerId]
  );

  useEffect(() => {
    setModelId(provider.models[0]?.id || '');
  }, [provider]);

  useEffect(() => {
    setOverrides(loadPfpOverrides());
    setPromptOverrides(loadPromptOverrides());

    let mounted = true;
    fetchCloudOverrides()
      .then((cloud) => {
        if (!mounted || !cloud) return;
        setOverrides((local) => {
          const merged = mergePfpOverrides(local, cloud);
          savePfpOverrides(merged);
          return merged;
        });
      })
      .catch(() => {
        // Non-blocking: cloud override endpoint is optional.
      });

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'tnf_pfp_overrides_v5') {
        setOverrides(loadPfpOverrides());
      }
      if (event.key === 'tnf_pfp_prompt_overrides_v2') {
        setPromptOverrides(loadPromptOverrides());
      }
    };

    window.addEventListener('storage', onStorage);
    return () => {
      mounted = false;
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const filteredAgents = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return agents;

    return agents.filter((agent) => {
      const haystack = [
        agent.displayName,
        agent.slug,
        agent.profile.role,
        agent.profile.tagline,
        agent.profile.summary,
        ...agent.profile.badgeSet.map((badge) => badge.name),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [agents, query]);

  const selectedStyle = useMemo(
    () => STYLE_PRESETS.find((preset) => preset.id === stylePresetId) || STYLE_PRESETS[0],
    [stylePresetId]
  );
  const cloudSyncEnabled =
    typeof window !== 'undefined' && Boolean(window.TNF_PFP_OVERRIDES_ENDPOINT);

  const selectedCount = selectedIds.size;
  const withOverrideCount = useMemo(() => Object.keys(overrides).length, [overrides]);

  const persistOverride = async (
    agentId: string,
    nextOverride: Omit<AgentPfpOverride, 'updatedAt'>
  ) => {
    setOverrides((current) => {
      const merged = {
        ...current,
        [agentId]: {
          ...nextOverride,
          updatedAt: new Date().toISOString(),
        },
      };
      savePfpOverrides(merged);
      return merged;
    });

    try {
      await pushCloudOverride(agentId, {
        ...nextOverride,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // Optional cloud persistence should not block local success.
    }
  };

  const savePrompt = (agentId: string, prompt: string) => {
    setPromptOverrides((current) => {
      const next = { ...current, [agentId]: prompt };
      savePromptOverrides(next);
      return next;
    });
  };

  const toggleSelect = (agentId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  const openSingleModal = (agent: AgentVisualProfileRecord) => {
    const seededPrompt =
      promptOverrides[agent.id] ||
      withStyleFlavor(getDefaultPrompt(agent), selectedStyle.directive);
    setModalState({ agentId: agent.id, prompt: seededPrompt });
    setSinglePrompt(seededPrompt);
    setSinglePreview(null);
    setStatusMessage(null);
  };

  useEffect(() => {
    const requestedAgentId = searchParams.get('agent');
    if (!requestedAgentId) return;

    const agent = agents.find((entry) => entry.id === requestedAgentId);
    if (!agent) return;

    const seededPrompt =
      promptOverrides[agent.id] ||
      withStyleFlavor(getDefaultPrompt(agent), selectedStyle.directive);

    setModalState({ agentId: agent.id, prompt: seededPrompt });
    setSinglePrompt(seededPrompt);
    setSinglePreview(null);
    setStatusMessage(null);
    setSearchParams({}, { replace: true });
  }, [agents, promptOverrides, searchParams, selectedStyle.directive, setSearchParams]);

  const closeSingleModal = () => {
    setModalState(null);
    setSinglePrompt('');
    setSinglePreview(null);
    setSingleGenerating(false);
  };

  const resolveAgentById = (agentId: string) =>
    agents.find((entry) => entry.id === agentId) || null;

  const generateSinglePreview = async () => {
    if (!modalState) return;

    setSingleGenerating(true);
    setStatusMessage('Generating image...');

    try {
      const imageBlob = await generatePfpImage({
        providerId,
        modelId,
        prompt: singlePrompt,
        apiKey: apiKey.trim() || undefined,
        customEndpoint: customEndpoint.trim() || undefined,
      });
      const dataUrl = await blobToDataUrl(imageBlob);
      setSinglePreview(dataUrl);
      savePrompt(modalState.agentId, singlePrompt);
      setStatusMessage('Preview ready. Apply to replace the current PFP.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to generate image.');
    } finally {
      setSingleGenerating(false);
    }
  };

  const applySinglePreview = async () => {
    if (!modalState || !singlePreview) return;
    const profile = resolveAgentById(modalState.agentId);
    if (!profile) return;

    await persistOverride(profile.id, {
      imageUrl: singlePreview,
      prompt: singlePrompt,
      provider: providerId,
      model: modelId,
      style: selectedStyle.label,
      source: 'generated',
    });

    if (autoDownload) {
      downloadImage(profile.displayName, singlePreview);
    }

    if (autoRefreshAfterApply) {
      window.location.reload();
      return;
    }

    closeSingleModal();
    setStatusMessage(`Updated ${profile.displayName}.`);
  };

  const regenerateSelected = async () => {
    if (selectedIds.size === 0 || batchRunning) return;

    setBatchRunning(true);
    setBatchProgress({ complete: 0, total: selectedIds.size });
    setStatusMessage(`Regenerating ${selectedIds.size} selected agents...`);

    const targetIds = Array.from(selectedIds);
    let failed = 0;

    for (let index = 0; index < targetIds.length; index += 1) {
      const agentId = targetIds[index];
      const agent = resolveAgentById(agentId);
      if (!agent) continue;

      const prompt =
        promptOverrides[agentId] ||
        withStyleFlavor(getDefaultPrompt(agent), selectedStyle.directive);

      try {
        const imageBlob = await generatePfpImage({
          providerId,
          modelId,
          prompt,
          apiKey: apiKey.trim() || undefined,
          customEndpoint: customEndpoint.trim() || undefined,
        });
        const dataUrl = await blobToDataUrl(imageBlob);

        await persistOverride(agentId, {
          imageUrl: dataUrl,
          prompt,
          provider: providerId,
          model: modelId,
          style: selectedStyle.label,
          source: 'generated',
        });

        if (autoDownload) {
          downloadImage(agent.displayName, dataUrl);
        }
      } catch {
        failed += 1;
      }

      setBatchProgress({ complete: index + 1, total: targetIds.length });
    }

    setBatchRunning(false);
    if (autoRefreshAfterApply) {
      window.location.reload();
      return;
    }

    setStatusMessage(
      failed === 0
        ? `Batch complete: ${targetIds.length} updated.`
        : `Batch complete: ${targetIds.length - failed} updated, ${failed} failed.`
    );
  };

  const handleDropOnCard = async (agent: AgentVisualProfileRecord, file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatusMessage('Only image files can replace a PFP.');
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      await persistOverride(agent.id, {
        imageUrl: dataUrl,
        prompt: promptOverrides[agent.id] || getDefaultPrompt(agent),
        provider: 'upload',
        model: 'upload',
        style: 'Manual Upload',
        source: 'upload',
      });

      if (autoDownload) {
        downloadImage(agent.displayName, dataUrl);
      }

      if (autoRefreshAfterApply) {
        window.location.reload();
        return;
      }

      setStatusMessage(`Uploaded replacement for ${agent.displayName}.`);
    } catch {
      setStatusMessage('Failed to read dropped image file.');
    }
  };

  return (
    <div className="min-h-screen bg-transparent px-3 py-12 md:px-6">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <GlassCard
          className="overflow-hidden border border-white/10 bg-gradient-to-br from-cyan-500/10 via-slate-950/60 to-orange-400/10 p-0"
          hover={false}
        >
          <div className="grid gap-6 p-6 md:grid-cols-[1.2fr_minmax(0,1fr)] md:p-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.26em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                Agent PFP Studio
              </div>
              <h1 className="text-3xl font-black text-white md:text-4xl">
                Deploy-Ready Portrait Control Surface
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-200 md:text-base">
                Regenerate, batch-update, and manually replace agent profile images directly in the
                SaaS UI. Changes persist across refresh, sync into the prompt catalog, and can
                optionally push to your cloud endpoint.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className={badgeClass}>
                  {agentVisualProfileCatalog.totalAgents} catalog profiles
                </Badge>
                <Badge className={badgeClass}>
                  {AGENT_PFP_DEFAULT_COUNT} default Space Age assets
                </Badge>
                <Badge className={badgeClass}>{withOverrideCount} custom overrides</Badge>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Link
                  to="/ai-portal"
                  className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-slate-200 hover:bg-white/10"
                >
                  AI Portal
                </Link>
                <Link
                  to="/agent-builder"
                  className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-slate-200 hover:bg-white/10"
                >
                  Agent Builder
                </Link>
                <Link
                  to="/workflows/builder"
                  className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-slate-200 hover:bg-white/10"
                >
                  Workflow Builder
                </Link>
                <Link
                  to="/agents/onboard"
                  className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-slate-200 hover:bg-white/10"
                >
                  Agent Onboard
                </Link>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">
                    Provider
                  </label>
                  <select
                    value={providerId}
                    onChange={(event) =>
                      setProviderId(event.target.value as PfpProviderOption['id'])
                    }
                    className="h-11 w-full rounded-xl border border-white/15 bg-slate-950/80 px-3 text-sm text-white outline-none transition focus:border-cyan-300"
                  >
                    {PFP_PROVIDER_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">
                    Model
                  </label>
                  <select
                    value={modelId}
                    onChange={(event) => setModelId(event.target.value)}
                    className="h-11 w-full rounded-xl border border-white/15 bg-slate-950/80 px-3 text-sm text-white outline-none transition focus:border-cyan-300"
                  >
                    {provider.models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(provider.requiresApiKey || providerId === 'custom') && (
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    type="password"
                    placeholder="API key"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    className="h-11 rounded-xl border border-white/15 bg-slate-950/80 px-3 text-sm text-white outline-none transition focus:border-cyan-300"
                  />
                  {providerId === 'custom' ? (
                    <input
                      type="url"
                      placeholder="https://your-endpoint.example/generate"
                      value={customEndpoint}
                      onChange={(event) => setCustomEndpoint(event.target.value)}
                      className="h-11 rounded-xl border border-white/15 bg-slate-950/80 px-3 text-sm text-white outline-none transition focus:border-cyan-300"
                    />
                  ) : (
                    <div className="flex items-center rounded-xl border border-white/10 bg-slate-900/70 px-3 text-xs text-slate-300">
                      Bring your own key to use premium generation.
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={stylePresetId}
                  onChange={(event) => setStylePresetId(event.target.value)}
                  className="h-11 rounded-xl border border-white/15 bg-slate-950/80 px-3 text-sm text-white outline-none transition focus:border-cyan-300"
                >
                  {STYLE_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 px-3 text-xs text-slate-300">
                  <Settings2 className="h-4 w-4 text-cyan-300" />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={autoRefreshAfterApply}
                      onChange={(event) => setAutoRefreshAfterApply(event.target.checked)}
                    />
                    auto-refresh after apply
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={autoDownload}
                      onChange={(event) => setAutoDownload(event.target.checked)}
                    />
                    auto-download
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1">
                  <Cloud className="h-3.5 w-3.5 text-cyan-300" />
                  Cloud sync {cloudSyncEnabled ? 'enabled' : 'optional (set endpoint)'}
                </span>
                <Link className="text-cyan-300 hover:text-cyan-200" to="/ai-portal/pfp-prompts">
                  Open Prompt Catalog →
                </Link>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="border border-white/10 p-4" hover={false}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-lg">
              <PremiumInput
                icon={Search}
                iconPosition="left"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search agent portraits by name, role, tagline, badges..."
                className="h-12 rounded-xl"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge className={badgeClass}>{filteredAgents.length} visible</Badge>
              <Badge className={badgeClass}>{selectedCount} selected</Badge>
              <PremiumButton
                variant="outline"
                size="sm"
                disabled={batchRunning || selectedCount === 0}
                onClick={regenerateSelected}
              >
                {batchRunning ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-3.5 w-3.5" />
                )}
                Regenerate Selected
              </PremiumButton>
              <PremiumButton
                variant="outline"
                size="sm"
                onClick={() => {
                  const ids = filteredAgents.map((agent) => agent.id);
                  setSelectedIds(new Set(ids));
                }}
              >
                <CheckSquare className="mr-2 h-3.5 w-3.5" />
                Select Visible
              </PremiumButton>
              <PremiumButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                disabled={selectedCount === 0}
              >
                <Square className="mr-2 h-3.5 w-3.5" />
                Clear
              </PremiumButton>
            </div>
          </div>

          {(batchRunning || statusMessage) && (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-slate-300">
              {batchRunning ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300" />
                    Batch generation in progress
                  </div>
                  <span>
                    {batchProgress.complete}/{batchProgress.total}
                  </span>
                </div>
              ) : (
                <p>{statusMessage}</p>
              )}
            </div>
          )}
        </GlassCard>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filteredAgents.map((agent) => {
            const imageSrc = resolveImageSrc(agent, overrides);
            const checked = selectedIds.has(agent.id);

            return (
              <GlassCard
                key={agent.id}
                className="group overflow-hidden border border-white/10 p-0"
                hover={false}
              >
                <div className="relative">
                  <div
                    className="relative aspect-square overflow-hidden border-b border-white/10 bg-slate-900"
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.currentTarget.classList.add('ring-2', 'ring-cyan-300');
                    }}
                    onDragLeave={(event) => {
                      event.currentTarget.classList.remove('ring-2', 'ring-cyan-300');
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      event.currentTarget.classList.remove('ring-2', 'ring-cyan-300');
                      const file = event.dataTransfer.files?.[0];
                      if (file) {
                        void handleDropOnCard(agent, file);
                      }
                    }}
                  >
                    <img
                      src={imageSrc}
                      alt={agent.displayName}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />

                    <div className="absolute inset-x-2 top-2 flex items-center justify-between">
                      <label className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-2 py-1 text-[11px] text-white backdrop-blur-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(agent.id)}
                          className="h-3.5 w-3.5 accent-cyan-400"
                        />
                        pick
                      </label>

                      <button
                        type="button"
                        onClick={() => openSingleModal(agent)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white transition hover:border-cyan-300 hover:text-cyan-200"
                        title="Regenerate"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="pointer-events-none absolute bottom-2 left-2 rounded-full border border-white/20 bg-black/55 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-white/80">
                      drop image to replace
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="line-clamp-1 text-sm font-semibold text-white">
                      {agent.displayName}
                    </h3>
                    <p className="line-clamp-1 text-[11px] uppercase tracking-[0.18em] text-cyan-200/90">
                      {agent.profile.role}
                    </p>
                  </div>

                  <p className="line-clamp-2 text-xs leading-5 text-slate-300">
                    {agent.profile.tagline}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {agent.profile.badgeSet.slice(0, 3).map((badge) => (
                      <Badge
                        key={`${agent.id}-${badge.id}`}
                        className="border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-200"
                      >
                        {badge.name}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{overrides[agent.id] ? 'customized' : 'default space age'}</span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
                      onClick={() => downloadImage(agent.displayName, imageSrc)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      download
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <GlassCard
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto border border-white/15 p-6"
            hover={false}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                  Regenerate Portrait
                </p>
                <h2 className="text-2xl font-bold text-white">
                  {resolveAgentById(modalState.agentId)?.displayName}
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Tune prompt direction to avoid repetitive angelic results. Style preset:{' '}
                  {selectedStyle.label}
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl border border-white/20 px-3 py-1.5 text-sm text-white hover:border-cyan-300"
                onClick={closeSingleModal}
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.1fr_minmax(0,1fr)]">
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Prompt</label>
                <textarea
                  value={singlePrompt}
                  onChange={(event) => setSinglePrompt(event.target.value)}
                  rows={12}
                  className="w-full rounded-2xl border border-white/15 bg-slate-950/90 p-3 text-sm leading-6 text-white outline-none transition focus:border-cyan-300"
                />

                <div className="flex flex-wrap gap-2">
                  <PremiumButton
                    variant="gradient"
                    onClick={generateSinglePreview}
                    disabled={singleGenerating || !singlePrompt.trim()}
                  >
                    {singleGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="mr-2 h-4 w-4" />
                    )}
                    Generate Preview
                  </PremiumButton>
                  <PremiumButton
                    variant="outline"
                    onClick={() => {
                      const profile = resolveAgentById(modalState.agentId);
                      if (!profile) return;
                      const resetPrompt = withStyleFlavor(
                        getDefaultPrompt(profile),
                        selectedStyle.directive
                      );
                      setSinglePrompt(resetPrompt);
                    }}
                  >
                    <Paintbrush2 className="mr-2 h-4 w-4" />
                    Reset Prompt
                  </PremiumButton>
                  <PremiumButton
                    variant="outline"
                    onClick={applySinglePreview}
                    disabled={!singlePreview}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Apply Replacement
                  </PremiumButton>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Preview</label>
                <div className="aspect-square overflow-hidden rounded-2xl border border-white/15 bg-slate-950/90">
                  {singlePreview ? (
                    <img
                      src={singlePreview}
                      alt="Generated preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      Generate to preview replacement
                    </div>
                  )}
                </div>

                {statusMessage && (
                  <p className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-slate-300">
                    {statusMessage}
                  </p>
                )}

                {singlePreview && (
                  <PremiumButton
                    variant="outline"
                    onClick={() =>
                      downloadImage(
                        resolveAgentById(modalState.agentId)?.displayName || 'agent',
                        singlePreview
                      )
                    }
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Preview
                  </PremiumButton>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
