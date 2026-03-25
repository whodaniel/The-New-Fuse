import { Badge } from '@/components/ui/badge';
import { GlassCard, PremiumButton, PremiumInput } from '@/components/ui/premium';
import { getAgentDefaultPfpUrl } from '@/data/agentPfpDefaults';
import {
  agentVisualProfileCatalog,
  createAgentProfileFallbackAvatar,
  type AgentVisualProfileRecord,
} from '@/data/agentVisualProfiles';
import {
  fetchCloudOverrides,
  getDefaultPrompt,
  loadPfpOverrides,
  loadPromptOverrides,
  mergePfpOverrides,
  savePromptOverrides,
  type AgentPfpOverrideMap,
  type AgentPromptOverrideMap,
} from '@/services/agentPfpStore';
import { ArrowRight, Clipboard, FilePenLine, RefreshCw, Search, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

function resolveImage(agent: AgentVisualProfileRecord, overrides: AgentPfpOverrideMap): string {
  return (
    overrides[agent.id]?.imageUrl ||
    getAgentDefaultPfpUrl(agent.id) ||
    createAgentProfileFallbackAvatar(agent)
  );
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export default function PfpPromptCatalogPage() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pfpOverrides, setPfpOverrides] = useState<AgentPfpOverrideMap>({});
  const [promptOverrides, setPromptOverrides] = useState<AgentPromptOverrideMap>({});
  const [draftPrompt, setDraftPrompt] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');

  useEffect(() => {
    const localPfps = loadPfpOverrides();
    const localPrompts = loadPromptOverrides();
    setPfpOverrides(localPfps);
    setPromptOverrides(localPrompts);

    let mounted = true;
    fetchCloudOverrides()
      .then((cloud) => {
        if (!mounted || !cloud) return;
        setPfpOverrides((current) => mergePfpOverrides(current, cloud));
      })
      .catch(() => {
        // Non-blocking: cloud sync optional when auth/session is unavailable.
      });

    const initialId = agentVisualProfileCatalog.agents[0]?.id || null;
    setSelectedId(initialId);
    if (initialId) {
      const profile = agentVisualProfileCatalog.agents.find((entry) => entry.id === initialId);
      if (profile) {
        setDraftPrompt(localPrompts[initialId] || getDefaultPrompt(profile));
      }
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'tnf_pfp_overrides_v5') {
        setPfpOverrides(loadPfpOverrides());
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

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return agentVisualProfileCatalog.agents;

    return agentVisualProfileCatalog.agents.filter((agent) => {
      const haystack = [
        agent.displayName,
        agent.slug,
        agent.profile.role,
        agent.profile.tagline,
        agent.profile.summary,
        ...agent.profile.visualMotifs,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [query]);

  useEffect(() => {
    if (!selectedId && filtered.length > 0) {
      setSelectedId(filtered[0].id);
      const selected = filtered[0];
      setDraftPrompt(promptOverrides[selected.id] || getDefaultPrompt(selected));
      return;
    }

    if (selectedId && !filtered.some((entry) => entry.id === selectedId)) {
      const next = filtered[0];
      if (next) {
        setSelectedId(next.id);
        setDraftPrompt(promptOverrides[next.id] || getDefaultPrompt(next));
      }
    }
  }, [filtered, selectedId, promptOverrides]);

  const selectedProfile = useMemo(
    () => filtered.find((entry) => entry.id === selectedId) || null,
    [filtered, selectedId]
  );

  useEffect(() => {
    if (!selectedProfile) return;
    setDraftPrompt(promptOverrides[selectedProfile.id] || getDefaultPrompt(selectedProfile));
    setSaveState('idle');
  }, [selectedProfile, promptOverrides]);

  const handleSelect = (profile: AgentVisualProfileRecord) => {
    setSelectedId(profile.id);
    setDraftPrompt(promptOverrides[profile.id] || getDefaultPrompt(profile));
    setSaveState('idle');
  };

  const handleSavePrompt = () => {
    if (!selectedProfile) return;
    const next = {
      ...promptOverrides,
      [selectedProfile.id]: draftPrompt,
    };
    setPromptOverrides(next);
    savePromptOverrides(next);
    setSaveState('saved');
    window.setTimeout(() => setSaveState('idle'), 1400);
  };

  const handleResetPrompt = () => {
    if (!selectedProfile) return;
    setDraftPrompt(getDefaultPrompt(selectedProfile));
    setSaveState('idle');
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(draftPrompt);
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 1400);
    } catch {
      setSaveState('idle');
    }
  };

  return (
    <div className="min-h-screen bg-transparent px-3 py-12 md:px-6">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <GlassCard
          className="border border-white/10 bg-gradient-to-r from-slate-900/85 via-cyan-950/35 to-slate-900/85 p-6 md:p-8"
          hover={false}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-100">
                <FilePenLine className="h-3.5 w-3.5" />
                Prompt Catalog
              </div>
              <h1 className="text-3xl font-black text-white md:text-4xl">
                Agent Portrait Prompt Workspace
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-200 md:text-base">
                Review, tune, and persist prompt specs that power regeneration in PFP Studio. This
                page is bound to the same override store, so your edits are instantly available.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge className="border-white/10 bg-white/5 text-slate-200">
                  {agentVisualProfileCatalog.totalAgents} profiles
                </Badge>
                <Badge className="border-white/10 bg-white/5 text-slate-200">
                  {Object.keys(promptOverrides).length} custom prompt overrides
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link to="/ai-portal">
                <PremiumButton variant="outline">Back to AI Portal</PremiumButton>
              </Link>
              <Link to="/ai-portal/pfp-studio">
                <PremiumButton variant="gradient">
                  Open PFP Studio
                  <ArrowRight className="ml-2 h-4 w-4" />
                </PremiumButton>
              </Link>
              <Link to="/agents">
                <PremiumButton variant="outline">Back to Agent Factory</PremiumButton>
              </Link>
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
          <GlassCard className="border border-white/10 p-4" hover={false}>
            <PremiumInput
              icon={Search}
              iconPosition="left"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search prompts by agent, role, motif..."
              className="mb-3 h-12 rounded-xl"
            />

            <div className="max-h-[72vh] space-y-2 overflow-y-auto pr-1">
              {filtered.map((profile) => {
                const active = profile.id === selectedId;
                return (
                  <button
                    type="button"
                    key={profile.id}
                    onClick={() => handleSelect(profile)}
                    className={`w-full rounded-xl border p-2 text-left transition ${
                      active
                        ? 'border-cyan-300/50 bg-cyan-400/10'
                        : 'border-white/10 bg-black/15 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveImage(profile, pfpOverrides)}
                        alt={profile.displayName}
                        className="h-12 w-12 rounded-lg border border-white/10 object-cover"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {profile.displayName}
                        </p>
                        <p className="truncate text-[11px] uppercase tracking-[0.16em] text-cyan-200/90">
                          {profile.profile.role}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="border border-white/10 p-5" hover={false}>
            {selectedProfile ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-white">
                      {selectedProfile.displayName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-300">{selectedProfile.profile.tagline}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className="border-white/10 bg-white/5 text-slate-200">
                        {selectedProfile.profile.promptStatus}
                      </Badge>
                      <Badge className="border-white/10 bg-white/5 text-slate-200">
                        {selectedProfile.promptSpec.styleName}
                      </Badge>
                    </div>
                  </div>

                  <img
                    src={resolveImage(selectedProfile, pfpOverrides)}
                    alt={selectedProfile.displayName}
                    className="h-28 w-28 rounded-2xl border border-white/10 object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
                  <p className="mb-1 inline-flex items-center gap-1 text-cyan-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Prompt authoring notes
                  </p>
                  <p>
                    Keep prompts specific and grounded. Avoid repeating celestial/angelic language
                    if you want stronger visual differentiation.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Image Prompt
                  </label>
                  <textarea
                    value={draftPrompt}
                    onChange={(event) => {
                      setDraftPrompt(event.target.value);
                      setSaveState('idle');
                    }}
                    rows={14}
                    className="w-full rounded-2xl border border-white/15 bg-slate-950/90 p-3 text-sm leading-6 text-white outline-none transition focus:border-cyan-300"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <PremiumButton variant="gradient" onClick={handleSavePrompt}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Save Prompt Override
                  </PremiumButton>
                  <PremiumButton variant="outline" onClick={handleCopyPrompt}>
                    <Clipboard className="mr-2 h-4 w-4" />
                    Copy Prompt
                  </PremiumButton>
                  <PremiumButton variant="outline" onClick={handleResetPrompt}>
                    Reset to Default
                  </PremiumButton>
                  <Link to={`/ai-portal/pfp-studio?agent=${selectedProfile.id}`}>
                    <PremiumButton variant="outline">Regenerate in Studio</PremiumButton>
                  </Link>
                </div>

                {saveState === 'saved' && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                    Prompt override saved.
                  </div>
                )}

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                      Negative Prompt
                    </p>
                    <p className="text-sm leading-6 text-slate-300">
                      {selectedProfile.promptSpec.negativePrompt}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                      Render Notes
                    </p>
                    <ul className="space-y-1 text-sm text-slate-300">
                      {selectedProfile.promptSpec.renderNotes.map((note) => (
                        <li key={note}>• {normalizeText(note)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[320px] items-center justify-center text-sm text-slate-400">
                No agent selected.
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
