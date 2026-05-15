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
import { resourcesService } from '@/services/resources.service';
import { useQuery } from '@tanstack/react-query';
import {
  Database,
  ExternalLink,
  FileCode2,
  Files,
  FolderSearch,
  Link2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type FilesTab = 'indexed' | 'resources';

const formatDate = (value: string | null) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
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

const openInNewTab = (url: string | null | undefined) => {
  if (!url || typeof window === 'undefined') return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

export default function FilesWorkspace() {
  const [query, setQuery] = useState('');
  const [sourceId, setSourceId] = useState('all');
  const [activeTab, setActiveTab] = useState<FilesTab>('indexed');

  const countsQuery = useQuery({
    queryKey: ['files-workspace-counts'],
    queryFn: () => marketplaceService.getResearchSkillCounts(),
    staleTime: 60_000,
  });

  const sourcesQuery = useQuery({
    queryKey: ['files-workspace-sources'],
    queryFn: () => marketplaceService.getResearchSkillSources(12),
    staleTime: 60_000,
  });

  const indexedFilesQuery = useQuery({
    queryKey: ['files-workspace-indexed', query, sourceId],
    queryFn: () =>
      marketplaceService.searchResearchSkillFiles({
        q: query.trim() || undefined,
        sourceId: sourceId === 'all' ? undefined : Number(sourceId),
        limit: 36,
      }),
  });

  const resourcesQuery = useQuery({
    queryKey: ['files-workspace-resources', query],
    queryFn: () =>
      resourcesService.searchResourcesWithMeta({
        search: query.trim(),
        sortBy: 'recent',
        includeTraitMeta: false,
      }),
  });

  const sourceOptions = useMemo(() => {
    const categories = sourcesQuery.data?.categories || [];
    return categories.flatMap((category) =>
      category.sources.map((source) => ({
        value: String(source.id),
        label: `${source.name} (${category.name})`,
      }))
    );
  }, [sourcesQuery.data?.categories]);

  const indexedFiles = indexedFilesQuery.data?.items || [];
  const resources = resourcesQuery.data?.items || [];
  const counts = countsQuery.data?.counts;

  const availableNotice =
    countsQuery.data && !countsQuery.data.available
      ? countsQuery.data.error || 'Research corpus is currently unavailable.'
      : null;

  return (
    <div className="space-y-6">
      <OpsPageHeader
        eyebrow="Workspace"
        title="Files Workspace"
        subtitle="Search indexed skill files and TNF resources from one operator surface."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20">
              {indexedFilesQuery.data?.total ?? counts?.files ?? 0} indexed files
            </Badge>
            <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/20">
              {counts?.sources ?? sourceOptions.length} sources
            </Badge>
            <Badge className="bg-violet-500/10 text-violet-300 border-violet-500/20">
              {resources.length} matching resources
            </Badge>
          </div>
        }
        actions={
          <>
            <Link to="/resources">
              <PremiumButton size="sm" variant="outline">
                Resource Catalog
              </PremiumButton>
            </Link>
            <Link to="/skills">
              <PremiumButton size="sm" variant="gradient">
                Skills
              </PremiumButton>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          label="Indexed Files"
          value={counts?.files ?? indexedFilesQuery.data?.total ?? 0}
          icon={Files}
          gradient="blue"
        />
        <StatsCard label="Sources" value={counts?.sources ?? 0} icon={Link2} gradient="purple" />
        <StatsCard
          label="Categories"
          value={counts?.categories ?? 0}
          icon={Database}
          gradient="cyan"
        />
        <StatsCard
          label="Resource Matches"
          value={resources.length}
          icon={FolderSearch}
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
            placeholder="Search file path, source name, snippet, or tags..."
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
              indexedFilesQuery.refetch();
              resourcesQuery.refetch();
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </PremiumButton>
        </div>
      </GlassCard>

      <GlassCard className="p-4" hover={false}>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FilesTab)}>
          <TabsList className="grid w-full grid-cols-2 mb-5 bg-black/20 p-1">
            <TabsTrigger
              value="indexed"
              className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Indexed Files
            </TabsTrigger>
            <TabsTrigger
              value="resources"
              className="text-sm data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
            >
              Resource Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="indexed" className="space-y-4 mt-0">
            {indexedFilesQuery.isLoading ? (
              <div className="py-14 text-center text-slate-400">Loading indexed files...</div>
            ) : indexedFiles.length === 0 ? (
              <div className="py-14 text-center text-slate-400">
                No indexed files match this search.
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
                      <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/20">
                        Indexed
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge>{item.sourceName || 'Unknown source'}</Badge>
                      {item.categoryName ? (
                        <Badge variant="secondary">{item.categoryName}</Badge>
                      ) : null}
                      {item.license ? <Badge variant="outline">{item.license}</Badge> : null}
                    </div>

                    <p className="text-sm text-slate-300 line-clamp-3">
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
                          <FileCode2 className="w-3 h-3" />
                          Open
                        </PremiumButton>
                        {item.repoUrl ? (
                          <PremiumButton
                            size="sm"
                            variant="ghost"
                            onClick={() => openInNewTab(item.repoUrl)}
                          >
                            <ExternalLink className="w-3 h-3" />
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

          <TabsContent value="resources" className="space-y-4 mt-0">
            {resourcesQuery.isLoading ? (
              <div className="py-14 text-center text-slate-400">Loading resources...</div>
            ) : resources.length === 0 ? (
              <div className="py-14 text-center text-slate-400">
                No resources match this search.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {resources.slice(0, 24).map((resource) => (
                  <GlassCard
                    key={resource.id}
                    className="p-4 space-y-3 border border-white/10"
                    hover={false}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">{resource.name}</p>
                        <p className="text-xs text-slate-400 truncate mt-1">
                          {resource.description}
                        </p>
                      </div>
                      <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20">
                        {resource.type}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{resource.category}</Badge>
                      {resource.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{resource.downloads.toLocaleString()} runs</span>
                      <span>Rating {resource.rating.toFixed(1)}</span>
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
