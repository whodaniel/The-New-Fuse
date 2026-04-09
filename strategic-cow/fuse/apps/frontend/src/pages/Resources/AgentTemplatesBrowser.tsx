// @ts-nocheck
import { BaseBrowser, FilterField, SortOption } from '@/components/browsers';
import { Badge } from '@/components/ui/badge';
import { GlassCard, PremiumButton } from '@/components/ui/premium';
import { resourcesService } from '@/services/resources.service';
import { AgentTemplate } from '@/types/resources';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart,
  Bot,
  Cpu,
  Download,
  Heart,
  MessageSquare,
  Settings,
  Share2,
  Star,
  Users,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AgentTemplatesBrowser() {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => resourcesService.getTemplates(),
  });

  const filterFields: FilterField[] = [
    {
      key: 'category',
      label: 'All Categories',
      options: [
        { value: 'communication', label: 'Communication' },
        { value: 'development', label: 'Development' },
        { value: 'data', label: 'Data' },
        { value: 'productivity', label: 'Productivity' },
      ],
    },
    {
      key: 'templateType',
      label: 'All Types',
      options: [
        { value: 'chat', label: 'Chat' },
        { value: 'task', label: 'Task' },
        { value: 'analysis', label: 'Analysis' },
        { value: 'automation', label: 'Automation' },
      ],
    },
  ];

  const sortOptions: SortOption[] = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'recent', label: 'Recently Updated' },
    { value: 'rating', label: 'Highest Rated' },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquare className="w-5 h-5 text-purple-400" />;
      case 'task':
        return <Zap className="w-5 h-5 text-blue-400" />;
      case 'analysis':
        return <BarChart className="w-5 h-5 text-orange-400" />;
      case 'automation':
        return <Bot className="w-5 h-5 text-green-400" />;
      default:
        return <Settings className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'chat':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'task':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'analysis':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'automation':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      default:
        return 'bg-white/5 text-gray-400 border-white/10';
    }
  };

  const handleItemAction = async (template: AgentTemplate, action: string) => {
    switch (action) {
      case 'create':
        try {
          const result = await resourcesService.createAgentFromTemplate(template.id);
          toast.success(`Agent created from template "${template.name}"!`);
          navigate(`/agents/${result.agentId}`);
        } catch {
          toast.error('Failed to create agent');
        }
        break;
      case 'favorite':
        try {
          await resourcesService.toggleFavorite(template.id, 'current-user-id');
          toast.success('Added to favorites!');
        } catch {
          toast.error('Failed to add to favorites');
        }
        break;
      case 'share':
        toast.success('Share link copied to clipboard!');
        navigator.clipboard.writeText(
          `${window.location.origin}/resources/templates/${template.id}`
        );
        break;
      case 'view-details':
        setSelectedTemplate(template);
        break;
    }
  };

  const renderCard = (
    template: AgentTemplate,
    index: number,
    onAction: (item: AgentTemplate, action: string) => void
  ) => (
    <GlassCard
      className="h-full cursor-pointer group relative overflow-hidden flex flex-col p-5"
      onClick={() => onAction(template, 'view-details')}
    >
      {template.featured && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500/20 to-red-500/20 text-orange-400 px-3 py-1 text-xs font-bold rounded-bl-lg border-l border-b border-orange-500/20">
          Featured
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
          {getTypeIcon(template.templateType)}
        </div>
        <div className="flex items-center space-x-1 text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20">
          <Star className="w-3 h-3 fill-current" />
          <span className="text-xs font-medium">{template.rating}</span>
          <span className="text-xs text-orange-500/70">({template.reviews})</span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
        {template.name}
      </h3>
      <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-grow">{template.description}</p>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {template.tags.slice(0, 3).map((tag: string) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-xs bg-white/5 border-white/10 hover:bg-white/10"
            >
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="outline" className="text-xs bg-white/5 border-white/10">
              +{template.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span
            className={`px-2 py-0.5 rounded-full border ${getTypeColor(template.templateType)}`}
          >
            {template.templateType} agent
          </span>
          <div className="flex items-center text-gray-400">
            <Cpu className="w-3 h-3 mr-1" />
            {template.model}
          </div>
        </div>

        <div className="space-y-1 bg-white/5 p-2 rounded-lg border border-white/5">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            Key Capabilities
          </p>
          {template.capabilities.slice(0, 2).map((cap: string, i: number) => (
            <div key={i} className="flex items-center text-xs text-gray-300">
              <div className="w-1 h-1 rounded-full bg-orange-500 mr-2"></div>
              {cap}
            </div>
          ))}
          {template.capabilities.length > 2 && (
            <div className="text-[10px] text-gray-500 pl-3">
              +{template.capabilities.length - 2} more
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center text-gray-400">
            <Download className="w-3 h-3 mr-1.5" />
            {template.downloads.toLocaleString()} uses
          </div>
          <div className="flex items-center text-gray-400">
            <Zap className="w-3 h-3 mr-1.5" />v{template.version}
          </div>
        </div>

        <div className="flex gap-2">
          <PremiumButton
            size="sm"
            variant="gradient"
            className="flex-1 from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onAction(template, 'create');
            }}
          >
            Create Agent
          </PremiumButton>
          <div className="flex gap-1">
            <PremiumButton
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onAction(template, 'favorite');
              }}
            >
              <Heart className="w-4 h-4 text-gray-400 hover:text-red-500 hover:fill-current transition-colors" />
            </PremiumButton>
            <PremiumButton
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onAction(template, 'share');
              }}
            >
              <Share2 className="w-4 h-4 text-gray-400 hover:text-orange-400 transition-colors" />
            </PremiumButton>
          </div>
        </div>
      </div>
    </GlassCard>
  );

  const renderModal = () => {
    if (!selectedTemplate) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTemplate(null)}
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
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-white transition-colors bg-black/20 rounded-full p-2 hover:bg-black/40"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 pb-0">
                <div className="flex items-start gap-5 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 flex-shrink-0">
                    {getTypeIcon(selectedTemplate.templateType)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{selectedTemplate.name}</h2>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span>
                        by <span className="text-white">{selectedTemplate.author}</span>
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                      <span>v{selectedTemplate.version}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                      <span
                        className={`px-2 py-0.5 rounded-full border ${getTypeColor(selectedTemplate.templateType)} text-xs`}
                      >
                        {selectedTemplate.templateType}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  {selectedTemplate.description}
                </p>
              </div>

              <div className="px-8 pb-8 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="text-xs text-gray-500 font-bold uppercase mb-1">Model</div>
                    <div className="text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-400" /> {selectedTemplate.model}
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="text-xs text-gray-500 font-bold uppercase mb-1">Users</div>
                    <div className="text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-400" />{' '}
                      {selectedTemplate.downloads.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-orange-400" /> Capabilities
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedTemplate.capabilities.map((cap: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-gray-300 bg-white/5 p-3 rounded-lg border border-white/5"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                        {cap}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTemplate.requiredSkills.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                      <Settings className="w-4 h-4 text-blue-400" /> Required Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.requiredSkills.map((skill: string) => (
                        <span
                          key={skill}
                          className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm border border-blue-500/20"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                    <Bot className="w-4 h-4 text-purple-400" /> System Prompt Preview
                  </h3>
                  <div className="bg-black/40 p-4 rounded-lg border border-white/5 font-mono text-xs text-gray-400 overflow-x-auto">
                    {selectedTemplate.systemPrompt}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/10">
                  <PremiumButton
                    size="lg"
                    variant="gradient"
                    className="flex-1 from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    onClick={() => {
                      handleItemAction(selectedTemplate, 'create');
                      setSelectedTemplate(null);
                    }}
                  >
                    Create Agent from Template
                  </PremiumButton>
                  <PremiumButton
                    size="lg"
                    variant="secondary"
                    onClick={() => {
                      navigate(`/agents/new?templateId=${encodeURIComponent(selectedTemplate.id)}`);
                      setSelectedTemplate(null);
                    }}
                  >
                    Customize
                  </PremiumButton>
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
      <BaseBrowser<AgentTemplate>
        items={templates}
        isLoading={isLoading}
        renderCard={renderCard}
        renderModal={() => null}
        filterFields={filterFields}
        sortOptions={sortOptions}
        searchPlaceholder="Search agent templates by name, description, or tags..."
        emptyStateIcon="🔍"
        emptyStateMessage="No templates found"
        onItemAction={handleItemAction}
      />
      {renderModal()}
    </>
  );
}
