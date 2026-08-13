import OpsPageHeader from '@/components/ops/OpsPageHeader';
import { Badge, GlassCard, PremiumButton, PremiumInput } from '@/components/ui';
import {
  agentVisualProfileCatalog,
  createAgentProfileFallbackAvatar,
  type AgentVisualProfileRecord,
} from '@/data/agentVisualProfiles';
import { ArrowRight, Fingerprint, Image, Search, Sparkles } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AgentProfileAtlas = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const filteredAgents = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return agentVisualProfileCatalog.agents;
    }

    return agentVisualProfileCatalog.agents.filter((agent) => {
      const haystack = [
        agent.displayName,
        agent.slug,
        agent.profile.role,
        agent.profile.tagline,
        agent.profile.summary,
        agent.sourceKind,
        agent.sourceFile,
        ...agent.profile.badgeSet.map((badge) => badge.name),
        ...agent.profile.visualMotifs,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [deferredQuery]);

  return (
    <div className="min-h-screen bg-transparent px-3 py-16">
      <div className="mx-auto max-w-7xl space-y-12">
        <OpsPageHeader
          eyebrow="Agent Profiles"
          title="Portrait Prompt Atlas"
          subtitle="Every agent definition now has a catalog-backed profile page with a reusable Gemini portrait prompt, badge set, motifs, and source metadata."
          meta={
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge className="border-sky-500/20 bg-sky-500/10 text-sky-200">
                {agentVisualProfileCatalog.totalAgents} profiles
              </Badge>
              <Badge className="border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-200">
                {agentVisualProfileCatalog.styleSystem.styleName}
              </Badge>
              <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-200">
                {agentVisualProfileCatalog.styleSystem.modelTarget}
              </Badge>
            </div>
          }
          actions={
            <>
              <PremiumButton onClick={() => navigate('/agents')} variant="outline">
                Back to Builder
              </PremiumButton>
              <PremiumButton onClick={() => navigate('/settings/api')} variant="outline">
                API Connections
              </PremiumButton>
            </>
          }
        />

        <GlassCard className="rounded-[32px] border border-white/10 p-6 sm:p-8" hover={false}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-sky-200">
                <Image className="h-3.5 w-3.5" />
                Gemini Prompt Catalog
              </div>
              <h2 className="text-3xl font-black text-white">Search the full agent lookbook.</h2>
              <p className="max-w-2xl text-slate-300">
                These pages are independent of live provisioning, so you can review personas,
                prompts, and visual direction before generating PFPs or binding providers.
              </p>
            </div>

            <div className="w-full max-w-xl">
              <PremiumInput
                placeholder="Search by agent name, role, badges, motif, or source..."
                className="h-14 rounded-2xl text-base"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                icon={Search}
                iconPosition="left"
              />
            </div>
          </div>
        </GlassCard>

        {filteredAgents.length === 0 ? (
          <GlassCard className="rounded-[32px] border border-dashed border-white/15 p-10 text-center">
            <Sparkles className="mx-auto mb-4 h-14 w-14 text-slate-400" />
            <h3 className="text-2xl font-bold text-white">No matching profiles</h3>
            <p className="mt-3 text-slate-400">
              Try a different search term or clear the query to browse the full catalog.
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredAgents.map((agent) => (
              <AgentAtlasCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AgentAtlasCard = ({ agent }: { agent: AgentVisualProfileRecord }) => (
  <Link to={`/agents/profiles/${agent.slug}`} className="group block">
    <GlassCard className="h-full rounded-[28px] border border-white/10 p-5" hover={false}>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={createAgentProfileFallbackAvatar(agent)}
              alt={agent.displayName}
              className="h-16 w-16 shrink-0 rounded-2xl border border-white/10 object-cover"
              loading="lazy"
            />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-white">{agent.displayName}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-sky-300">
                {agent.profile.role}
              </p>
            </div>
          </div>

          <Badge className="border-white/10 bg-white/5 text-slate-200">{agent.sourceKind}</Badge>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-100">{agent.profile.tagline}</p>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-400">
            {agent.profile.summary}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {agent.profile.badgeSet.slice(0, 4).map((badge) => (
            <Badge
              key={badge.id}
              className="border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-200"
            >
              {badge.name}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/8 bg-black/20 p-4">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.24em] text-slate-400">Profile</p>
            <p className="text-sm text-white">{agent.profile.promptStatus}</p>
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.24em] text-slate-400">Motifs</p>
            <p className="text-sm text-white">
              {agent.profile.visualMotifs.slice(0, 2).join(', ')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <span className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
            <Fingerprint className="h-3.5 w-3.5" />
            {agent.profile.machineId}
          </span>
          <span className="flex items-center gap-2 font-bold text-sky-300 transition-all group-hover:gap-3">
            Open profile
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </GlassCard>
  </Link>
);

export default AgentProfileAtlas;
