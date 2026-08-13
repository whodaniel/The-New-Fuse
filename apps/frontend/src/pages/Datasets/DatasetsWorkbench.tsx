// @ts-nocheck
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import {
  Badge,
  GlassCard,
  PremiumButton,
  PremiumInput,
  PremiumSelect,
  StatsCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import {
  marketplaceService,
  type MarketplaceResearchSkillFile,
} from '@/services/marketplace.service';
import { useQuery } from '@tanstack/react-query';
import {
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Layers3,
  Link2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type DatasetsTab = 'sources' | 'indexed';

const formatDate = (value: string | null): string => {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleString();
};

const getDisplayPath = (item: MarketplaceResearchSkillFile): string => {
  if (item.filePath && item.filePath.trim().length > 0) {
    return item.filePath;
  }

  try {
    const pathname = new URL(item.fileUrl).pathname;
    return pathname.length > 1 ? pathname.slice(1) : item.fileUrl;
  } catch {
    return item.fileUrl;
  }
};

const parseTags = (value: string | null): string[] =>
  (value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const openInNewTab = (url: string | null | undefined) => {
  if (!url || typeof window === 'undefined') return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

export default function DatasetsWorkbench() {
  const [query, setQuery] = useState('');
  const [sourceId, setSourceId] = useState('all');
  const [activeTab, setActiveTab] = useState<DatasetsTab>('sources');

  const countsQuery = useQuery({
    queryKey: ['datasets-workbench-counts'],
    queryFn: () => marketplaceService.getResearchSkillCounts(),
    staleTime: 60_000,
  });

  const sourcesQuery = useQuery({
    queryKey: ['datasets-workbench-sources'],
    queryFn: () => marketplaceService.getResearchSkillSources(24),
    staleTime: 60_000,
  });

  const indexedQuery = useQuery({
    queryKey: ['datasets-workbench-files', query, sourceId],
    queryFn: () =>
      marketplaceService.searchResearchSkillFiles({
        q: query.trim() || undefined,
        sourceId: sourceId === 'all' ? undefined : Number(sourceId),
        limit: 60,
      }),
  });

  const categories = sourcesQuery.data?.categories || [];
  const indexedFiles = indexedQuery.data?.items || [];
  const counts = countsQuery.data?.counts;

  const sourceOptions = useMemo(
    () =>
      categories.flatMap((category) =>
        category.sources.map((source) => ({
          value: String(source.id),
          label: `${source.name} (${category.name})`,
        }))
      ),
    [categories]
  );

  const popularTags = useMemo(() => {
    const counter = new Map<string, number>();
    indexedFiles.forEach((item) => {
      parseTags(item.tags).forEach((tag) => {
        counter.set(tag, (counter.get(tag) || 0) + 1);
      });
    });

    return [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }, [indexedFiles]);

  const availableNotice =
    countsQuery.data && !countsQuery.data.available
      ? countsQuery.data.error || 'Dataset corpus is currently unavailable.'
      : null;

  const exportIndexedFiles = () => {
    if (typeof window === 'undefined' || indexedFiles.length === 0) return;

    const payload = indexedFiles.map((item) => ({
      id: item.id,
      sourceId: item.sourceId,
      sourceName: item.sourceName,
      categoryName: item.categoryName,
      filePath: item.filePath,
      fileUrl: item.fileUrl,
      repoUrl: item.repoUrl,
      title: item.title,
      snippet: item.snippet,
      license: item.license,
      tags: parseTags(item.tags),
      createdAt: item.createdAt,
    }));

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `tnf-datasets-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <OpsPageHeader
        eyebrow="Forge"
        title="Datasets Workbench"
        subtitle="Catalog external research sources, inspect indexed files, and export dataset slices."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/20">
              {counts?.categories ?? categories.length} categories
            </Badge>
            <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20">
              {counts?.sources ?? sourceOptions.length} sources
            </Badge>
            <Badge className="bg-violet-500/10 text-violet-300 border-violet-500/20">
              {indexedQuery.data?.total ?? counts?.files ?? 0} indexed files
            </Badge>
          </div>
        }
        actions={
          <>
            <Link to="/files">
              <PremiumButton size="sm" variant="outline">
                Files View
              </PremiumButton>
            </Link>
            <PremiumButton
              size="sm"
              variant="gradient"
              onClick={exportIndexedFiles}
              disabled={indexedFiles.length === 0}
            >
              <Download className="w-4 h-4" />
              Export JSON
            </PremiumButton>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          label="Categories"
          value={counts?.categories ?? categories.length}
          icon={Layers3}
          gradient="blue"
        />
        <StatsCard label="Sources" value={counts?.sources ?? 0} icon={Link2} gradient="purple" />
        <StatsCard
          label="Source Links"
          value={counts?.sourceLinks ?? 0}
          icon={ExternalLink}
          gradient="cyan"
        />
        <StatsCard
          label="Indexed Files"
          value={counts?.files ?? indexedQuery.data?.total ?? 0}
          icon={Database}
          gradient="green"
        />
      </div>

      {availableNotice ? (
        <GlassCard className="p-4 border border-amber-500/30 bg-amber-500/10" hover={false}>
          <p className="text-amber-200 text-sm">{availableNotice}</p>
        </GlassCard>
      ) : null}

      <GlassCard className="p-4 space-y-4" hover={false}>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px_auto] gap-3">
          <PremiumInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            icon={Search}
            iconPosition="left"
            placeholder="Search source names, paths, snippets, or tags..."
          />
          <PremiumSelect
            value={sourceId}
            onChange={(event) => setSourceId(event.target.value)}
            options={[{ value: 'all', label: 'All Sources' }, ...sourceOptions]}
          />
          <PremiumButton
            size="md"
            variant="outline"
            onClick={() => {
              countsQuery.refetch();
              sourcesQuery.refetch();
              indexedQuery.refetch();
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </PremiumButton>
        </div>
      </GlassCard>

      <GlassCard className="p-4" hover={false}>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DatasetsTab)}>
          <TabsList className="grid w-full grid-cols-2 mb-5 bg-black/20 p-1">
            <TabsTrigger
              value="sources"
              className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Source Catalog
            </TabsTrigger>
            <TabsTrigger
              value="indexed"
              className="text-sm data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
            >
              Indexed Entries
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="space-y-4 mt-0">
            {sourcesQuery.isLoading ? (
              <div className="py-14 text-center text-slate-400">Loading source catalog...</div>
            ) : categories.length === 0 ? (
              <div className="py-14 text-center text-slate-400">
                No source catalog entries found.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <GlassCard
                    key={category.id}
                    className="p-4 space-y-3 border border-white/10"
                    hover={false}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold">{category.name}</h3>
                      <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/20">
                        {category.sources.length} sources
                      </Badge>
                    </div>

                    <ul className="space-y-2">
                      {category.sources.map((source) => (
                        <li
                          key={source.id}
                          className="rounded-md border border-white/10 bg-black/20 px-3 py-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm text-white font-medium truncate">
                                {source.name}
                              </p>
                              {source.brief ? (
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                  {source.brief}
                                </p>
                              ) : null}
                            </div>
                            <PremiumButton
                              size="sm"
                              variant="ghost"
                              onClick={() => openInNewTab(source.url)}
                            >
                              <ExternalLink className="w-3 h-3" />
                              Open
                            </PremiumButton>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="indexed" className="space-y-4 mt-0">
            {popularTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {popularTags.map((entry) => (
                  <Badge key={entry.tag} variant="outline">
                    {entry.tag} ({entry.count})
                  </Badge>
                ))}
              </div>
            ) : null}

            {indexedQuery.isLoading ? (
              <div className="py-14 text-center text-slate-400">Loading indexed entries...</div>
            ) : indexedFiles.length === 0 ? (
              <div className="py-14 text-center text-slate-400">
                No indexed entries match this search.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {indexedFiles.map((item) => (
                  <GlassCard
                    key={item.id}
                    className="p-4 space-y-3 border border-white/10"
                    hover={false}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">
                          {item.title || getDisplayPath(item)}
                        </p>
                        <p className="text-xs text-slate-400 truncate mt-1">
                          {getDisplayPath(item)}
                        </p>
                      </div>
                      <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20">
                        <FileSpreadsheet className="w-3 h-3 mr-1" />
                        Data
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge>{item.sourceName || 'Unknown source'}</Badge>
                      {item.categoryName ? (
                        <Badge variant="secondary">{item.categoryName}</Badge>
                      ) : null}
                      {item.license ? <Badge variant="outline">{item.license}</Badge> : null}
                      {parseTags(item.tags)
                        .slice(0, 2)
                        .map((tag) => (
                          <Badge key={`${item.id}-${tag}`} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                    </div>

                    <p className="text-sm text-slate-300 line-clamp-4">
                      {item.snippet || item.content}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Updated: {formatDate(item.createdAt)}</span>
                      <div className="flex items-center gap-2">
                        <PremiumButton
                          size="sm"
                          variant="outline"
                          onClick={() => openInNewTab(item.fileUrl)}
                        >
                          Open
                        </PremiumButton>
                        {item.repoUrl ? (
                          <PremiumButton
                            size="sm"
                            variant="ghost"
                            onClick={() => openInNewTab(item.repoUrl)}
                          >
                            Repo
                          </PremiumButton>
                        ) : null}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </GlassCard>
    </div>
  );
}
