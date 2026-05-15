// @ts-nocheck
import { Badge, GlassCard, PremiumButton } from '@/components/ui';
import { BaseBrowser, FilterField, SortOption } from '@/components/browsers';
import { useAuth } from '@/providers/AuthProvider';
import { resourcesService } from '@/services/resources.service';
import { N8NWorkflow } from '@/types/resources';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Download,
  ExternalLink,
  GitBranch,
  Heart,
  Play,
  Share2,
  Star,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function WorkflowBrowser() {
  const { user } = useAuth();
  const [selectedWorkflow, setSelectedWorkflow] = useState<N8NWorkflow | null>(null);

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => resourcesService.getWorkflows(),
  });

  const filterFields: FilterField[] = [
    {
      key: 'category',
      label: 'All Categories',
      options: [
        { value: 'productivity', label: 'Productivity' },
        { value: 'ai', label: 'AI' },
        { value: 'data', label: 'Data' },
        { value: 'automation', label: 'Automation' },
      ],
    },
    {
      key: 'complexity',
      label: 'All Complexity',
      options: [
        { value: 'simple', label: 'Simple' },
        { value: 'medium', label: 'Medium' },
        { value: 'complex', label: 'Complex' },
      ],
    },
  ];

  const sortOptions: SortOption[] = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'recent', label: 'Recently Updated' },
    { value: 'rating', label: 'Highest Rated' },
  ];

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'complex':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-transparent0/10 text-gray-400 border-gray-500/20';
    }
  };

  const handleItemAction = async (workflow: N8NWorkflow, action: string) => {
    switch (action) {
      case 'import':
        try {
          await resourcesService.importWorkflow(workflow.id);
          toast.success(`Workflow "${workflow.name}" imported to n8n successfully!`);
        } catch {
          toast.error('Failed to import workflow');
        }
        break;
      case 'favorite':
        try {
          const result = await resourcesService.toggleFavorite(workflow.id, user?.id);
          toast.success(result.favorite ? 'Added to favorites!' : 'Removed from favorites');
        } catch {
          toast.error('Failed to add to favorites');
        }
        break;
      case 'share':
        try {
          const toAgentId = window.prompt('Share to agent id');
          if (!toAgentId) return;
          const notes = window.prompt('Optional note (leave blank to skip)') || undefined;
          await resourcesService.shareResource({
            resourceId: workflow.id,
            toAgentId,
            fromUserId: user?.id,
            notes,
          });
          toast.success('Resource shared');
        } catch {
          toast.error('Failed to share resource');
        }
        break;
      case 'view-details':
        setSelectedWorkflow(workflow);
        break;
    }
  };

  const renderCard = (
    workflow: N8NWorkflow,
    index: number,
    onAction: (item: N8NWorkflow, action: string) => void
  ) => (
    <GlassCard
      className="h-full cursor-pointer group relative overflow-hidden flex flex-col p-4"
      onClick={() => onAction(workflow, 'view-details')}
    >
      {workflow.featured && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-500/20 to-yellow-600/20 text-yellow-400 px-3 py-1 text-xs font-bold rounded-bl-lg border-l border-b border-yellow-500/20">
          Featured
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30">
          <Workflow className="w-5 h-5 text-green-400" />
        </div>
        <div className="flex items-center space-x-1 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20">
          <Star className="w-3 h-3 fill-current" />
          <span className="text-xs font-medium">{workflow.rating}</span>
          <span className="text-xs text-yellow-500/70">({workflow.reviews})</span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-400 transition-colors">
        {workflow.name}
      </h3>
      <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-grow">{workflow.description}</p>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {workflow.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-xs bg-transparent/5 border-white/10 hover:bg-transparent/10"
            >
              {tag}
            </Badge>
          ))}
          {workflow.tags.length > 3 && (
            <Badge variant="outline" className="text-xs bg-transparent/5 border-white/10">
              +{workflow.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full border ${getComplexityColor(workflow.complexity)}`}
          >
            {workflow.complexity}
          </span>
          <div className="flex items-center text-muted-foreground text-xs">
            <GitBranch className="w-3 h-3 mr-1" />
            {workflow.nodes} nodes
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center text-gray-400">
            <Download className="w-3 h-3 mr-1.5" />
            {workflow.downloads.toLocaleString()}
          </div>
          <div className="flex items-center text-gray-400">
            <Activity className="w-3 h-3 mr-1.5" />v{workflow.version}
          </div>
        </div>

        <div className="flex gap-2">
          <PremiumButton
            size="sm"
            variant="gradient"
            className="flex-1 from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
            onClick={(e) => {
              e.stopPropagation();
              onAction(workflow, 'import');
            }}
          >
            Import
          </PremiumButton>
          <div className="flex gap-1">
            <PremiumButton
              size="icon"
              variant="glass"
              className="h-9 w-9"
              onClick={(e) => {
                e.stopPropagation();
                onAction(workflow, 'favorite');
              }}
            >
              <Heart className="w-4 h-4 text-gray-400 hover:text-red-500 hover:fill-current transition-colors" />
            </PremiumButton>
            <PremiumButton
              size="icon"
              variant="glass"
              className="h-9 w-9"
              onClick={(e) => {
                e.stopPropagation();
                onAction(workflow, 'share');
              }}
            >
              <Share2 className="w-4 h-4 text-gray-400 hover:text-green-400 transition-colors" />
            </PremiumButton>
          </div>
        </div>
      </div>
    </GlassCard>
  );

  const renderModal = () => {
    if (!selectedWorkflow) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedWorkflow(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className="p-0 overflow-hidden relative border-white/10">
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setSelectedWorkflow(null)}
                  className="text-gray-400 hover:text-white transition-colors bg-black/20 rounded-full p-2 hover:bg-black/40"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 pb-0">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-md bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30 flex-shrink-0">
                    <Workflow className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{selectedWorkflow.name}</h2>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span>
                        by <span className="text-white">{selectedWorkflow.author}</span>
                      </span>
                      <span className="w-1 h-1 rounded-full bg-transparent0"></span>
                      <span>v{selectedWorkflow.version}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  {selectedWorkflow.description}
                </p>
              </div>

              <div className="px-8 pb-8 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-transparent/5 p-4 rounded-md border border-white/10">
                    <p className="text-sm text-muted-foreground mb-1">Complexity</p>
                    <span
                      className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getComplexityColor(selectedWorkflow.complexity)}`}
                    >
                      {selectedWorkflow.complexity}
                    </span>
                  </div>
                  <div className="bg-transparent/5 p-4 rounded-md border border-white/10">
                    <p className="text-sm text-muted-foreground mb-1">Nodes</p>
                    <p className="text-lg font-semibold text-white flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-green-400" /> {selectedWorkflow.nodes}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-yellow-400" /> Triggers
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkflow.triggers.map((trigger, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-gray-300 bg-transparent/5 p-2 px-3 rounded-md border border-white/10"
                      >
                        {trigger}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                    <Play className="w-4 h-4 text-blue-400" /> Actions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkflow.actions.map((action, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-gray-300 bg-transparent/5 p-2 px-3 rounded-md border border-white/10"
                      >
                        {action}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-purple-400" /> Integrations
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkflow.integrations.map((integration) => (
                      <Badge
                        key={integration}
                        variant="secondary"
                        className="bg-green-500/10 text-green-400 border-green-500/20"
                      >
                        {integration}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/10">
                  <PremiumButton
                    size="lg"
                    variant="gradient"
                    className="flex-1 from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                    onClick={() => {
                      handleItemAction(selectedWorkflow, 'import');
                      setSelectedWorkflow(null);
                    }}
                  >
                    Import to n8n
                  </PremiumButton>
                  {selectedWorkflow.importUrl && (
                    <a
                      href={selectedWorkflow.importUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <PremiumButton size="lg" variant="secondary">
                        <ExternalLink className="w-4 h-4 mr-2" /> View
                      </PremiumButton>
                    </a>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <>
      <BaseBrowser<N8NWorkflow>
        items={workflows}
        isLoading={isLoading}
        renderCard={renderCard}
        renderModal={() => null}
        filterFields={filterFields}
        sortOptions={sortOptions}
        searchPlaceholder="Search workflows by name, description, or tags..."
        emptyStateIcon="🔍"
        emptyStateMessage="No workflows found"
        onItemAction={handleItemAction}
      />
      {renderModal()}
    </>
  );
}
