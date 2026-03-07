// @ts-nocheck
import { GlassCard, PremiumButton, StatsCard } from '@/components/ui/premium';
import { useAuthorization } from '@/hooks/useAuthorization';
import {
  marketplaceService,
  type MarketplaceCatalogItem,
  type MarketplaceKind,
} from '@/services/marketplace.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Boxes, Compass, Gamepad2, GitBranch, Music2, Sparkles, Store, Wrench } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const ARCADE_EXPERIENCE_CATEGORIES = [
  'games',
  'music',
  'content',
  'social',
  'social-toys',
  'pooltogether',
  'community',
  'lab',
] as const;

const PRIMITIVE_KINDS: MarketplaceKind[] = [
  'workflow',
  'mcp_server',
  'skill',
  'prompt',
  'agent_template',
  'agent',
  'model',
];

const TABS: { id: 'all' | MarketplaceKind; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'experience', label: 'Experiences' },
  { id: 'workflow', label: 'Workflows' },
  { id: 'mcp_server', label: 'MCP Servers' },
  { id: 'skill', label: 'Skills' },
  { id: 'prompt', label: 'Prompts' },
  { id: 'agent_template', label: 'Templates' },
  { id: 'model', label: 'Models' },
];

function kindIcon(kind: MarketplaceKind) {
  if (kind === 'experience') return <Gamepad2 className="w-4 h-4" />;
  if (kind === 'workflow') return <GitBranch className="w-4 h-4" />;
  if (kind === 'mcp_server') return <Boxes className="w-4 h-4" />;
  if (kind === 'skill') return <Sparkles className="w-4 h-4" />;
  if (kind === 'prompt') return <Compass className="w-4 h-4" />;
  if (kind === 'agent_template') return <Store className="w-4 h-4" />;
  return <Wrench className="w-4 h-4" />;
}

type PublicationStatus = 'draft' | 'review' | 'published' | 'archived';

export default function MarketplaceDashboard() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuthorization();
  const [tab, setTab] = useState<'all' | MarketplaceKind>('all');
  const [surface, setSurface] = useState<'all' | 'arcade' | 'marketplace'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | PublicationStatus>('published');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newExperience, setNewExperience] = useState({
    name: '',
    description: '',
    category: 'community',
    launchUrl: '',
    tags: '',
  });
  const [newPrimitive, setNewPrimitive] = useState({
    kind: 'skill' as MarketplaceKind,
    name: '',
    description: '',
    category: 'development',
    launchUrl: '',
    tags: '',
    capabilities: '',
  });

  useEffect(() => {
    if (surface === 'arcade' && tab !== 'all' && tab !== 'experience') {
      setTab('experience');
      return;
    }

    if (surface === 'marketplace' && tab === 'experience') {
      setTab('all');
    }
  }, [surface, tab]);

  const effectiveStatusFilter: 'all' | PublicationStatus = isAdmin ? statusFilter : 'published';
  const effectiveKind = useMemo(() => {
    if (surface === 'arcade') {
      return 'experience' as MarketplaceKind;
    }
    if (surface === 'marketplace') {
      if (tab === 'all' || tab === 'experience') {
        return undefined;
      }
      return tab;
    }
    return tab === 'all' ? undefined : tab;
  }, [surface, tab]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['marketplace-catalog', effectiveKind, effectiveStatusFilter, search, isAdmin],
    queryFn: () =>
      marketplaceService.getCatalog({
        kind: effectiveKind,
        status: effectiveStatusFilter === 'all' ? undefined : effectiveStatusFilter,
        q: search.trim() || undefined,
      }),
  });

  const submitExperienceMutation = useMutation({
    mutationFn: (input: {
      name: string;
      description: string;
      category: string;
      launchUrl?: string;
      tags?: string[];
    }) => marketplaceService.submitExperience(input),
    onSuccess: () => {
      toast.success('Experience submitted to review queue.');
      setNewExperience({
        name: '',
        description: '',
        category: 'community',
        launchUrl: '',
        tags: '',
      });
      queryClient.invalidateQueries({ queryKey: ['marketplace-catalog'] });
    },
    onError: () => {
      toast.error('Failed to submit experience.');
    },
  });

  const submitPrimitiveMutation = useMutation({
    mutationFn: (input: {
      name: string;
      description: string;
      kind: MarketplaceKind;
      category: string;
      launchUrl?: string;
      tags?: string[];
      capabilities?: string[];
    }) => marketplaceService.submitCatalogItem(input),
    onSuccess: () => {
      toast.success('Primitive submitted to review queue.');
      setNewPrimitive({
        kind: 'skill',
        name: '',
        description: '',
        category: 'development',
        launchUrl: '',
        tags: '',
        capabilities: '',
      });
      queryClient.invalidateQueries({ queryKey: ['marketplace-catalog'] });
    },
    onError: (error) => {
      const message = (error as any)?.response?.data?.message || 'Failed to submit primitive.';
      toast.error(String(message));
    },
  });

  const moderationMutation = useMutation({
    mutationFn: ({ id, toStatus }: { id: string; toStatus: PublicationStatus }) =>
      marketplaceService.updatePublicationStatus(id, {
        toStatus,
        moderatedBy: 'marketplace-admin',
      }),
    onSuccess: () => {
      toast.success('Publication status updated.');
      queryClient.invalidateQueries({ queryKey: ['marketplace-catalog'] });
    },
    onError: (error) => {
      const message =
        (error as any)?.response?.data?.message || 'Failed to update publication status.';
      toast.error(String(message));
    },
  });

  const items = data?.items || [];

  const filteredItems = useMemo(() => {
    const bySurface = items.filter((item) => {
      if (surface === 'arcade') return item.kind === 'experience';
      if (surface === 'marketplace') return PRIMITIVE_KINDS.includes(item.kind);
      return true;
    });

    return [...bySurface].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [items, surface]);

  const experienceCount = items.filter((item) => item.kind === 'experience').length;
  const publishedCount = items.filter((item) => item.publicationStatus === 'published').length;
  const reviewCount = items.filter((item) => item.publicationStatus === 'review').length;
  const reviewQueue = filteredItems
    .filter((item) => item.publicationStatus === 'review')
    .slice(0, 6);
  const selectedCount = selectedIds.size;

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const bulkModerate = async (toStatus: PublicationStatus) => {
    if (selectedCount === 0) {
      return;
    }

    const ids = Array.from(selectedIds);
    try {
      await Promise.all(ids.map((id) => moderationMutation.mutateAsync({ id, toStatus })));
      setSelectedIds(new Set());
      toast.success(`Updated ${ids.length} item(s) to ${toStatus}.`);
    } catch {
      // Already handled with mutation error toast.
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              TNF Marketplace
            </h1>
            <p className="text-slate-400 mt-2">
              Canonical catalog for experiences, MCP servers, skills, prompts, templates, and
              primitives.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PremiumButton variant="outline" onClick={() => refetch()}>
              Refresh Catalog
            </PremiumButton>
            <PremiumButton variant="gradient" asChild>
              <a href="https://ai-arcade.xyz" target="_blank" rel="noreferrer">
                Open AI Arcade
              </a>
            </PremiumButton>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          label="Catalog Items"
          value={String(items.length)}
          icon={Store}
          gradient="blue"
        />
        <StatsCard
          label="Published"
          value={String(publishedCount)}
          icon={Sparkles}
          gradient="green"
        />
        <StatsCard
          label="Arcade Experiences"
          value={String(experienceCount)}
          icon={Gamepad2}
          gradient="purple"
        />
        <StatsCard
          label="Needs Review"
          value={String(reviewCount)}
          icon={Compass}
          gradient="orange"
        />
      </div>

      {isAdmin && (
        <GlassCard>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">Review Queue</h3>
              <p className="text-xs text-slate-400 mt-1">
                Fast moderation lane for submissions waiting on approval.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <PremiumButton
                variant="outline"
                onClick={() => {
                  setStatusFilter('review');
                  setSelectedIds(new Set(reviewQueue.map((item) => item.id)));
                }}
              >
                Focus Queue
              </PremiumButton>
              <PremiumButton
                variant="outline"
                onClick={() => bulkModerate('published')}
                disabled={selectedCount === 0 || moderationMutation.isPending}
              >
                Publish Selected
              </PremiumButton>
              <PremiumButton
                variant="outline"
                onClick={() => bulkModerate('archived')}
                disabled={selectedCount === 0 || moderationMutation.isPending}
              >
                Archive Selected
              </PremiumButton>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {reviewQueue.length === 0 ? (
              <p className="text-sm text-slate-400">No items currently in review.</p>
            ) : (
              reviewQueue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-white/10 bg-slate-900/50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs text-slate-400">
                        {item.kind.replace('_', ' ')} • {item.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PremiumButton
                        variant="outline"
                        onClick={() =>
                          moderationMutation.mutate({ id: item.id, toStatus: 'published' })
                        }
                        disabled={moderationMutation.isPending}
                      >
                        Approve
                      </PremiumButton>
                      <PremiumButton
                        variant="outline"
                        onClick={() =>
                          moderationMutation.mutate({ id: item.id, toStatus: 'archived' })
                        }
                        disabled={moderationMutation.isPending}
                      >
                        Reject
                      </PremiumButton>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
            placeholder="Search catalog by name, description, tags..."
          />
          <select
            value={effectiveStatusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as 'all' | 'draft' | 'review' | 'published' | 'archived'
              )
            }
            className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
            disabled={!isAdmin}
          >
            {isAdmin ? (
              <>
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </>
            ) : (
              <option value="published">Published</option>
            )}
          </select>
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <PremiumButton variant="outline" onClick={() => refetch()}>
                Refresh
              </PremiumButton>
              {isAdmin && (
                <PremiumButton
                  variant="outline"
                  onClick={() => {
                    const allIds = filteredItems.map((item) => item.id);
                    setSelectedIds(new Set(allIds));
                  }}
                >
                  Select All
                </PremiumButton>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: 'all', label: 'All Surfaces' },
            { id: 'arcade', label: 'Arcade Only' },
            { id: 'marketplace', label: 'Primitives Only' },
          ].map((item) => (
            <button
              key={item.id}
              className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                surface === item.id
                  ? 'bg-blue-500/20 border-blue-400 text-blue-200'
                  : 'bg-slate-900/50 border-white/10 text-slate-300 hover:bg-slate-800/70'
              }`}
              onClick={() => setSurface(item.id as 'all' | 'arcade' | 'marketplace')}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((item) => {
            const disabled =
              (surface === 'arcade' && item.id !== 'all' && item.id !== 'experience') ||
              (surface === 'marketplace' && item.id === 'experience');
            return (
              <button
                key={item.id}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                  tab === item.id
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                    : 'bg-slate-900/50 border-white/10 text-slate-300 hover:bg-slate-800/70'
                }`}
                disabled={disabled}
                aria-disabled={disabled}
                title={disabled ? 'Not available for selected surface' : undefined}
                style={disabled ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <p className="text-slate-400">Loading marketplace catalog...</p>
        ) : isError ? (
          <p className="text-red-300">Failed to load marketplace catalog.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredItems.map((item: MarketplaceCatalogItem) => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {isAdmin && (
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-900"
                        checked={selectedIds.has(item.id)}
                        onChange={(event) => toggleSelected(item.id, event.target.checked)}
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {item.category} • {item.publicationStatus}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-cyan-300 text-xs uppercase tracking-wider">
                    {kindIcon(item.kind)}
                    <span>{item.kind.replace('_', ' ')}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-300 mt-3">{item.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {isAdmin && (
                  <div className="mt-4 flex items-center gap-2">
                    <select
                      value={item.publicationStatus}
                      className="rounded-md border border-white/10 bg-slate-900/70 px-2 py-1 text-xs text-slate-100"
                      onChange={(event) =>
                        moderationMutation.mutate({
                          id: item.id,
                          toStatus: event.target.value as PublicationStatus,
                        })
                      }
                      disabled={moderationMutation.isPending}
                    >
                      <option value="draft">draft</option>
                      <option value="review">review</option>
                      <option value="published">published</option>
                      <option value="archived">archived</option>
                    </select>
                    <span className="text-[11px] text-slate-400">Moderation</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center gap-2 mb-2 text-cyan-200">
            <Gamepad2 className="w-4 h-4" />
            <h3 className="font-semibold">Arcade Surface</h3>
          </div>
          <p className="text-sm text-slate-300 mb-4">
            Arcade should display only published experiences: games, music, social toys, pool
            variations, and community creations.
          </p>
          <PremiumButton variant="gradient" asChild>
            <a href="https://ai-arcade.xyz" target="_blank" rel="noreferrer">
              Go To Arcade
            </a>
          </PremiumButton>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 mb-2 text-blue-200">
            <Music2 className="w-4 h-4" />
            <h3 className="font-semibold">Submit Experience</h3>
          </div>
          <p className="text-sm text-slate-300 mb-4">
            Community creators can submit arcade experiences here for moderation and publishing.
          </p>
          <div className="space-y-2">
            <input
              value={newExperience.name}
              onChange={(event) =>
                setNewExperience((prev) => ({ ...prev, name: event.target.value }))
              }
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
              placeholder="Experience name"
            />
            <textarea
              value={newExperience.description}
              onChange={(event) =>
                setNewExperience((prev) => ({ ...prev, description: event.target.value }))
              }
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
              rows={3}
              placeholder="Describe the gameplay or interaction..."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select
                value={newExperience.category}
                onChange={(event) =>
                  setNewExperience((prev) => ({ ...prev, category: event.target.value }))
                }
                className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
              >
                {ARCADE_EXPERIENCE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input
                value={newExperience.launchUrl}
                onChange={(event) =>
                  setNewExperience((prev) => ({ ...prev, launchUrl: event.target.value }))
                }
                className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
                placeholder="Launch URL (optional)"
              />
            </div>
            <input
              value={newExperience.tags}
              onChange={(event) =>
                setNewExperience((prev) => ({ ...prev, tags: event.target.value }))
              }
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
              placeholder="Tags comma-separated (optional)"
            />
            <div className="flex items-center gap-2">
              <PremiumButton variant="outline" asChild>
                <Link to="/resources">Open Resources Dashboard</Link>
              </PremiumButton>
              <PremiumButton
                variant="gradient"
                onClick={() =>
                  submitExperienceMutation.mutate({
                    name: newExperience.name.trim(),
                    description: newExperience.description.trim(),
                    category: newExperience.category.trim() || 'community',
                    launchUrl: newExperience.launchUrl.trim() || undefined,
                    tags: newExperience.tags
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  })
                }
                disabled={
                  submitExperienceMutation.isPending ||
                  !newExperience.name.trim() ||
                  !newExperience.description.trim()
                }
              >
                Submit
              </PremiumButton>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 mb-2 text-indigo-200">
            <Boxes className="w-4 h-4" />
            <h3 className="font-semibold">Submit Primitive</h3>
          </div>
          <p className="text-sm text-slate-300 mb-4">
            Use this lane for MCP servers, skills, prompts, workflows, templates, ready agents, and
            models.
          </p>
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select
                value={newPrimitive.kind}
                onChange={(event) =>
                  setNewPrimitive((prev) => ({
                    ...prev,
                    kind: event.target.value as MarketplaceKind,
                  }))
                }
                className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
              >
                {PRIMITIVE_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
              <input
                value={newPrimitive.category}
                onChange={(event) =>
                  setNewPrimitive((prev) => ({ ...prev, category: event.target.value }))
                }
                className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
                placeholder="Category"
              />
            </div>
            <input
              value={newPrimitive.name}
              onChange={(event) =>
                setNewPrimitive((prev) => ({ ...prev, name: event.target.value }))
              }
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
              placeholder="Primitive name"
            />
            <textarea
              value={newPrimitive.description}
              onChange={(event) =>
                setNewPrimitive((prev) => ({ ...prev, description: event.target.value }))
              }
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
              rows={3}
              placeholder="Describe the primitive..."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                value={newPrimitive.launchUrl}
                onChange={(event) =>
                  setNewPrimitive((prev) => ({ ...prev, launchUrl: event.target.value }))
                }
                className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
                placeholder="Docs / endpoint URL (optional)"
              />
              <input
                value={newPrimitive.tags}
                onChange={(event) =>
                  setNewPrimitive((prev) => ({ ...prev, tags: event.target.value }))
                }
                className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
                placeholder="Tags comma-separated (optional)"
              />
            </div>
            <input
              value={newPrimitive.capabilities}
              onChange={(event) =>
                setNewPrimitive((prev) => ({ ...prev, capabilities: event.target.value }))
              }
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
              placeholder="Capabilities comma-separated (optional)"
            />
            <div className="flex items-center gap-2">
              <PremiumButton
                variant="gradient"
                onClick={() =>
                  submitPrimitiveMutation.mutate({
                    kind: newPrimitive.kind,
                    name: newPrimitive.name.trim(),
                    description: newPrimitive.description.trim(),
                    category: newPrimitive.category.trim() || 'development',
                    launchUrl: newPrimitive.launchUrl.trim() || undefined,
                    tags: newPrimitive.tags
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                    capabilities: newPrimitive.capabilities
                      .split(',')
                      .map((capability) => capability.trim())
                      .filter(Boolean),
                  })
                }
                disabled={
                  submitPrimitiveMutation.isPending ||
                  !newPrimitive.kind ||
                  !newPrimitive.name.trim() ||
                  !newPrimitive.description.trim()
                }
              >
                Submit Primitive
              </PremiumButton>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
