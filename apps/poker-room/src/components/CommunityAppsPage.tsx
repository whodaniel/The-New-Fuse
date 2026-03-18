import { motion } from 'framer-motion';
import { Loader2, Rocket, Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  CloudflareBuildOption,
  CommunityActivity,
  CommunityArcadeApp,
  CommunityComment,
  CommunityMembership,
  communityApi,
} from '../api';

interface CommunityAppsPageProps {
  username: string;
  email?: string;
  membershipOverride?: CommunityMembership | null;
  onBack: () => void;
}

const CLOUDFLARE_OPTIONS: { value: CloudflareBuildOption; label: string }[] = [
  { value: 'workers', label: 'Workers' },
  { value: 'pages', label: 'Pages' },
  { value: 'durable-objects', label: 'Durable Objects' },
  { value: 'queues', label: 'Queues' },
  { value: 'd1', label: 'D1' },
  { value: 'r2', label: 'R2' },
  { value: 'ai-gateway', label: 'AI Gateway' },
  { value: 'agents-sdk', label: 'Agents SDK' },
];

const FALLBACK_APPS: CommunityArcadeApp[] = [
  {
    id: 'fallback-neon-blackjack',
    name: 'Neon Blackjack',
    summary: 'Fast solo blackjack with synthwave visuals and daily score ladders.',
    creator: 'tnf-core',
    category: 'cards',
    tags: ['blackjack', 'solo'],
    status: 'published',
    featured: true,
    playUrl: 'https://ai-arcade.xyz',
    votes: 91,
    cloudflare: { option: 'pages' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fallback-agent-clash',
    name: 'Agent Clash Arena',
    summary: 'Bot-vs-bot strategy battles streamed in real time.',
    creator: 'community-labs',
    category: 'strategy',
    tags: ['agents', 'simulation'],
    status: 'published',
    playUrl: 'https://ai-arcade.xyz',
    votes: 134,
    cloudflare: { option: 'workers' },
    createdAt: new Date().toISOString(),
  },
];

export default function CommunityAppsPage({
  username,
  email,
  membershipOverride,
  onBack,
}: CommunityAppsPageProps) {
  const [apps, setApps] = useState<CommunityArcadeApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('cards');
  const [tags, setTags] = useState('');
  const [playUrl, setPlayUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [cloudflareOption, setCloudflareOption] = useState<CloudflareBuildOption>('workers');
  const [votingId, setVotingId] = useState('');
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [selectedAppId, setSelectedAppId] = useState('');
  const [recentActivities, setRecentActivities] = useState<CommunityActivity[]>([]);
  const [recentComments, setRecentComments] = useState<CommunityComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [membership, setMembership] = useState<CommunityMembership | null>(null);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [membershipError, setMembershipError] = useState('');

  const refreshActivityPanels = async (appId?: string) => {
    try {
      const activityRes = await communityApi.recentActivities(20, 'all');
      setRecentActivities((activityRes.activities || []) as CommunityActivity[]);
    } catch {
      setRecentActivities([]);
    }
    const targetAppId = appId || selectedAppId;
    if (targetAppId) {
      try {
        const commentsRes = await communityApi.comments(targetAppId, 12);
        setRecentComments((commentsRes.comments || []) as CommunityComment[]);
      } catch {
        setRecentComments([]);
      }
    }
  };

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const data = await communityApi.list('published', 30);
        const list = (data.apps || []) as CommunityArcadeApp[];
        const normalized = list.length ? list : FALLBACK_APPS;
        if (alive) {
          setApps(normalized);
          if (!selectedAppId && normalized.length > 0) setSelectedAppId(normalized[0].id);
          for (const app of normalized) {
            communityApi.trackEngagement(app.id, 'view', username).catch(() => {});
          }
          await refreshActivityPanels(normalized[0]?.id);
        }
      } catch {
        if (alive) setApps(FALLBACK_APPS);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedAppId) return;
    refreshActivityPanels(selectedAppId);
  }, [selectedAppId]);

  useEffect(() => {
    if (membershipOverride) {
      setMembership(membershipOverride);
      setMembershipError('');
      setMembershipLoading(false);
      return;
    }
    const identity = email?.trim() ? email.trim() : username;
    if (!identity) {
      setMembership(null);
      setMembershipError('');
      setMembershipLoading(false);
      return;
    }

    let alive = true;
    setMembershipLoading(true);
    setMembershipError('');

    communityApi
      .membership(identity)
      .then(async (res) => {
        if (!alive) return;
        if (res.exists && res.membership) {
          setMembership(res.membership);
          return;
        }
        if (email && username && identity !== username) {
          try {
            const fallback = await communityApi.membership(username);
            if (!alive) return;
            if (fallback.exists && fallback.membership) {
              setMembership(fallback.membership);
              return;
            }
          } catch {
            // ignore
          }
        }
        setMembership(null);
      })
      .catch(() => {
        if (!alive) return;
        setMembership(null);
        setMembershipError('Unable to verify membership right now.');
      })
      .finally(() => {
        if (!alive) return;
        setMembershipLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [username, email, membershipOverride]);

  const topApps = useMemo(() => {
    return [...apps].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  }, [apps]);
  const isActiveMember = membership?.status === 'active';

  const handleUpvote = async (appId: string) => {
    if (!isActiveMember) {
      setError('Active membership is required to vote.');
      return;
    }
    if (votedIds.has(appId)) return;
    setVotingId(appId);
    try {
      const res = await communityApi.upvote(appId, username);
      setApps((prev) =>
        prev.map((app) =>
          app.id === appId
            ? {
                ...app,
                votes: typeof res.votes === 'number' ? res.votes : (app.votes || 0) + 1,
                trendSummary7d: {
                  views: app.trendSummary7d?.views || 0,
                  launches: app.trendSummary7d?.launches || 0,
                  votes: (app.trendSummary7d?.votes || 0) + 1,
                },
              }
            : app
        )
      );
      setVotedIds((prev) => new Set(prev).add(appId));
      refreshActivityPanels(appId).catch(() => {});
    } catch {
      setError('Vote failed. Try again.');
    } finally {
      setVotingId('');
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!name.trim() || !summary.trim()) {
      setError('App name and summary are required.');
      return;
    }
    if (!membership?.status || membership.status !== 'active') {
      setError('Only active members can submit new apps.');
      return;
    }
    setSubmitting(true);
    try {
      await communityApi.submit({
        name: name.trim(),
        summary: summary.trim(),
        creator: username,
        category: category.trim() || 'cards',
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        playUrl: playUrl.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        cloudflareOption,
      });
      setName('');
      setSummary('');
      setTags('');
      setPlayUrl('');
      setSourceUrl('');
      await refreshActivityPanels();
    } catch {
      setError('Submission failed. Try again in a minute.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!isActiveMember) {
      setError('Active membership is required to comment.');
      return;
    }
    if (!selectedAppId || !newComment.trim()) return;
    setCommenting(true);
    setError('');
    try {
      const res = await communityApi.addComment(selectedAppId, newComment.trim(), username);
      setNewComment('');
      const comment = res.comment as CommunityComment;
      setRecentComments((prev) => [comment, ...prev].slice(0, 12));
      await refreshActivityPanels(selectedAppId);
    } catch {
      setError('Comment failed. Try again.');
    } finally {
      setCommenting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020308] text-slate-300 font-sans p-6 sm:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-black">
              Community Build Hub
            </p>
            <h1 className="text-3xl sm:text-4xl font-black italic uppercase text-white">
              AI<span className="text-cyan-400">ARCADE</span> Community Apps
            </h1>
          </div>
          <button
            onClick={onBack}
            className="px-5 py-2 rounded-xl border border-white/10 text-sm font-black uppercase hover:border-cyan-500/70 hover:text-cyan-400 transition-all"
          >
            Back to Lobby
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="h-48 flex items-center justify-center border border-white/10 rounded-2xl bg-black/30">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              </div>
            ) : (
              topApps.map((app) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-white/10 bg-[#0a0c1a]/80 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black text-white uppercase">{app.name}</h2>
                      <p className="text-xs text-cyan-400 font-mono uppercase">
                        by {app.creator} · {app.cloudflare.option}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleUpvote(app.id)}
                        disabled={!isActiveMember || votingId === app.id || votedIds.has(app.id)}
                        className="px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/40 disabled:opacity-50"
                      >
                        {votedIds.has(app.id)
                          ? 'Voted'
                          : votingId === app.id
                            ? 'Voting...'
                            : 'Upvote'}
                      </button>
                      <div className="text-xs font-mono text-slate-400">
                        {(app.votes || 0).toLocaleString()} votes
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{app.summary}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                      <p className="text-[9px] uppercase text-slate-500 font-black">Views 7d</p>
                      <p className="text-sm font-mono text-white">
                        {(app.trendSummary7d?.views || app.totalViews || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                      <p className="text-[9px] uppercase text-slate-500 font-black">Launches 7d</p>
                      <p className="text-sm font-mono text-white">
                        {(app.trendSummary7d?.launches || app.totalLaunches || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                      <p className="text-[9px] uppercase text-slate-500 font-black">Votes 7d</p>
                      <p className="text-sm font-mono text-cyan-300">
                        {(app.trendSummary7d?.votes || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {(app.trend7d || []).length > 0 && (
                    <div className="mt-3">
                      <p className="text-[10px] uppercase font-black text-slate-500 mb-1">
                        Engagement Trend
                      </p>
                      <div className="h-12 flex items-end gap-1 rounded-lg border border-white/10 bg-black/30 p-2">
                        {(app.trend7d || []).map((d) => {
                          const value = d.views + d.launches * 2 + d.votes * 3;
                          const max = Math.max(
                            1,
                            ...(app.trend7d || []).map(
                              (x) => x.views + x.launches * 2 + x.votes * 3
                            )
                          );
                          const h = Math.max(8, Math.round((value / max) * 34));
                          return (
                            <div
                              key={`${app.id}-${d.date}`}
                              className="flex-1 rounded-sm bg-cyan-500/60"
                              style={{ height: `${h}px` }}
                              title={`${d.date}: v${d.views} l${d.launches} up${d.votes}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(app.tags || []).slice(0, 5).map((tag) => (
                      <span
                        key={`${app.id}-${tag}`}
                        className="text-[10px] px-2 py-1 rounded-full bg-cyan-900/30 border border-cyan-500/30 text-cyan-300 uppercase font-black"
                      >
                        {tag}
                      </span>
                    ))}
                    {(app.badges || []).map((badge) => (
                      <span
                        key={`${app.id}-${badge.id}`}
                        title={badge.description}
                        className="text-[10px] px-2 py-1 rounded-full bg-amber-900/30 border border-amber-500/40 text-amber-300 uppercase font-black"
                      >
                        {badge.name}
                      </span>
                    ))}
                  </div>
                  {app.playUrl && (
                    <a
                      href={app.playUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        communityApi.trackEngagement(app.id, 'launch', username).catch(() => {});
                      }}
                      className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase text-cyan-300 hover:text-cyan-200"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      Launch
                    </a>
                  )}
                </motion.div>
              ))
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0a0c1a]/90 p-5 h-fit">
            <h3 className="text-lg font-black text-white uppercase mb-4">Submit Your Build</h3>
            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="App Name"
                className="w-full bg-black/60 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-500"
              />
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="What makes it arcade-worthy?"
                className="w-full min-h-20 bg-black/60 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-500"
              />
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category"
                className="w-full bg-black/60 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-500"
              />
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags (comma-separated)"
                className="w-full bg-black/60 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-500"
              />
              <input
                value={playUrl}
                onChange={(e) => setPlayUrl(e.target.value)}
                placeholder="Play URL (optional)"
                className="w-full bg-black/60 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-500"
              />
              <input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="Source URL (optional)"
                className="w-full bg-black/60 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-500"
              />
              <select
                value={cloudflareOption}
                onChange={(e) => setCloudflareOption(e.target.value as CloudflareBuildOption)}
                className="w-full bg-black/60 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-500"
              >
                {CLOUDFLARE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    Cloudflare {opt.label}
                  </option>
                ))}
              </select>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="text-xs uppercase tracking-[0.3em] font-black">
                {membershipLoading ? (
                  <span className="text-slate-400">Verifying membership…</span>
                ) : membership?.status === 'active' ? (
                  <span className="text-emerald-400">Membership verified (active member).</span>
                ) : (
                  <span className="text-amber-400">
                    Access restricted — active membership required.
                    {membershipError ? ` (${membershipError})` : ''}
                  </span>
                )}
              </div>
              <button
                disabled={submitting || !isActiveMember}
                onClick={handleSubmit}
                className="w-full py-3 rounded-xl bg-cyan-600 hover:brightness-110 text-white font-black uppercase text-xs tracking-wider disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit for Review
              </button>
            </div>

            <div className="mt-6 pt-5 border-t border-white/10">
              <h4 className="text-sm font-black uppercase text-white mb-3">Recent Actions</h4>
              <div className="space-y-2 max-h-40 overflow-auto pr-1">
                {recentActivities.length === 0 ? (
                  <p className="text-xs text-slate-500">No recent actions yet.</p>
                ) : (
                  recentActivities.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-white/10 bg-black/30 p-2"
                    >
                      <p className="text-[11px] text-slate-300">{item.text}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-white/10">
              <h4 className="text-sm font-black uppercase text-white mb-3">Recent Comments</h4>
              <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="w-full mb-3 bg-black/60 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-500"
              >
                {apps.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name}
                  </option>
                ))}
              </select>
              <div className="space-y-2 max-h-40 overflow-auto pr-1 mb-3">
                {recentComments.length === 0 ? (
                  <p className="text-xs text-slate-500">No comments yet.</p>
                ) : (
                  recentComments.slice(0, 8).map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-lg border border-white/10 bg-black/30 p-2"
                    >
                      <p className="text-[11px] text-slate-200">{comment.text}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {comment.userId} · {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-black/60 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleAddComment}
                  disabled={commenting || !selectedAppId || !isActiveMember}
                  className="px-3 py-2 rounded-xl bg-cyan-700 text-white text-xs font-black uppercase disabled:opacity-50"
                >
                  {commenting ? '...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
