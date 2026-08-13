import AgentProfile from '@/components/profile/AgentProfile';
import { Badge, GlassCard, PremiumButton } from '@/components/ui';
import {
  agentVisualProfileCatalog,
  createAgentProfileFallbackAvatar,
  getAgentVisualProfileBySlug,
} from '@/data/agentVisualProfiles';
import {
  ArrowLeft,
  Copy,
  FileCode2,
  Fingerprint,
  Layers3,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const AgentCatalogProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const profile = useMemo(() => getAgentVisualProfileBySlug(slug), [slug]);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  if (!profile) {
    return (
      <div className="min-h-screen bg-transparent px-3 py-16">
        <div className="mx-auto max-w-4xl">
          <GlassCard
            className="rounded-[32px] border border-white/10 p-10 text-center"
            hover={false}
          >
            <Sparkles className="mx-auto mb-4 h-14 w-14 text-slate-400" />
            <h1 className="text-3xl font-black text-white">Profile not found</h1>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              That agent slug does not exist in the generated portrait catalog.
            </p>
            <div className="mt-8 flex justify-center">
              <Link to="/agents/profiles">
                <PremiumButton variant="gradient">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Profile Atlas
                </PremiumButton>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(profile.promptSpec.imagePrompt);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('failed');
      window.setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-transparent px-3 py-16">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-sky-200">
              <WandSparkles className="h-3.5 w-3.5" />
              Agent Portrait Profile
            </div>
            <h1 className="mt-4 text-4xl font-black text-white">{profile.displayName}</h1>
            <p className="mt-2 max-w-3xl text-lg text-slate-300">{profile.profile.tagline}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/agents/profiles">
              <PremiumButton variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Profile Atlas
              </PremiumButton>
            </Link>
            <Link to="/agents">
              <PremiumButton variant="outline">Control Surface</PremiumButton>
            </Link>
            <PremiumButton onClick={handleCopyPrompt} variant="gradient">
              <Copy className="mr-2 h-4 w-4" />
              {copyState === 'copied'
                ? 'Prompt Copied'
                : copyState === 'failed'
                  ? 'Copy Failed'
                  : 'Copy Prompt'}
            </PremiumButton>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="space-y-6">
            <AgentProfile
              agentData={{
                machineId: profile.profile.machineId,
                vanityName: profile.profile.vanityName,
                verifiedAvatarUrl: createAgentProfileFallbackAvatar(profile),
                isVerified: true,
                badges: profile.profile.badgeSet,
                sponsors: [],
              }}
            />

            <GlassCard className="rounded-[28px] border border-white/10 p-5" hover={false}>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                <Fingerprint className="h-4 w-4" />
                Catalog Metadata
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Machine ID</span>
                  <span className="font-mono text-white">{profile.profile.machineId}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Source Kind</span>
                  <span className="text-white">{profile.sourceKind}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Source File</span>
                  <span className="max-w-[240px] truncate font-mono text-white">
                    {profile.sourceFile}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Style System</span>
                  <span className="text-white">{profile.promptSpec.styleName}</span>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard className="rounded-[30px] border border-white/10 p-6" hover={false}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-fuchsia-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    Role Summary
                  </div>
                  <h2 className="mt-4 text-3xl font-black text-white">{profile.profile.role}</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge className="border-sky-500/20 bg-sky-500/10 text-sky-200">
                    {profile.profile.promptStatus}
                  </Badge>
                  <Badge className="border-white/10 bg-white/5 text-slate-200">
                    {profile.lookupKeys.length} lookup keys
                  </Badge>
                </div>
              </div>

              <p className="mt-5 text-base leading-relaxed text-slate-300">
                {profile.profile.summary}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {profile.profile.badgeSet.map((badge) => (
                  <Badge
                    key={badge.id}
                    className="border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-200"
                  >
                    {badge.name}
                  </Badge>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="rounded-[30px] border border-white/10 p-6" hover={false}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-amber-200">
                    <FileCode2 className="h-3.5 w-3.5" />
                    Gemini Portrait Prompt
                  </div>
                  <p className="mt-3 text-sm text-slate-400">
                    Built for {agentVisualProfileCatalog.styleSystem.modelTarget}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-white/8 bg-black/20 p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-100">
                  {profile.promptSpec.imagePrompt}
                </p>
              </div>

              <div className="mt-5 rounded-[24px] border border-white/8 bg-black/20 p-5">
                <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-400">
                  Negative Prompt
                </p>
                <p className="text-sm leading-7 text-slate-300">
                  {profile.promptSpec.negativePrompt}
                </p>
              </div>
            </GlassCard>

            <div className="grid gap-6 lg:grid-cols-2">
              <GlassCard className="rounded-[30px] border border-white/10 p-6" hover={false}>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-emerald-200">
                  <Layers3 className="h-3.5 w-3.5" />
                  Visual Motifs
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {profile.profile.visualMotifs.map((motif) => (
                    <Badge
                      key={motif}
                      className="border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-200"
                    >
                      {motif}
                    </Badge>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="rounded-[30px] border border-white/10 p-6" hover={false}>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-indigo-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Render Notes
                </div>
                <div className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                  {profile.promptSpec.renderNotes.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentCatalogProfile;
