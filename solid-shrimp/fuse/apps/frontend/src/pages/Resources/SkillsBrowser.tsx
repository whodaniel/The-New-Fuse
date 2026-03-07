// @ts-nocheck
import { BaseBrowser, FilterField, SortOption } from '@/components/browsers';
import { Badge } from '@/components/ui/badge';
import { GlassCard, PremiumButton } from '@/components/ui/premium';
import { resourcesService } from '@/services/resources.service';
import { ClaudeSkill, SkillExample } from '@/types/resources';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Code, Download, Heart, Share2, Star, Terminal, X, Zap } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function SkillsBrowser() {
  const [selectedSkill, setSelectedSkill] = useState<ClaudeSkill | null>(null);

  const { data: skills = [], isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: () => resourcesService.getSkills(),
  });

  const filterFields: FilterField[] = [
    {
      key: 'category',
      label: 'All Categories',
      options: [
        { value: 'development', label: 'Development' },
        { value: 'productivity', label: 'Productivity' },
        { value: 'communication', label: 'Communication' },
        { value: 'data', label: 'Data' },
        { value: 'automation', label: 'Automation' },
        { value: 'ai', label: 'AI' },
      ],
    },
  ];

  const sortOptions: SortOption[] = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'recent', label: 'Recently Updated' },
    { value: 'rating', label: 'Highest Rated' },
  ];

  const handleItemAction = async (skill: ClaudeSkill, action: string) => {
    switch (action) {
      case 'install':
        try {
          await resourcesService.executeSkill(skill.id);
          toast.success(`Skill "${skill.name}" installed successfully!`);
        } catch {
          toast.error('Failed to install skill');
        }
        break;
      case 'favorite':
        try {
          await resourcesService.toggleFavorite(skill.id, 'current-user-id');
          toast.success('Added to favorites!');
        } catch {
          toast.error('Failed to add to favorites');
        }
        break;
      case 'share':
        toast.success('Share link copied to clipboard!');
        navigator.clipboard.writeText(`${window.location.origin}/resources/skills/${skill.id}`);
        break;
      case 'view-details':
        setSelectedSkill(skill);
    }
  };

  const renderCard = (
    skill: ClaudeSkill,
    index: number,
    onAction: (item: ClaudeSkill, action: string) => void
  ) => (
    <GlassCard
      className="h-full cursor-pointer group relative overflow-hidden flex flex-col p-5"
      onClick={() => onAction(skill, 'view-details')}
    >
      {skill.featured && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-500/20 to-yellow-600/20 text-yellow-400 px-3 py-1 text-xs font-bold rounded-bl-lg border-l border-b border-yellow-500/20">
          Featured
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
          <Zap className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex items-center space-x-1 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20">
          <Star className="w-3 h-3 fill-current" />
          <span className="text-xs font-medium">{skill.rating}</span>
          <span className="text-xs text-yellow-500/70">({skill.reviews})</span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
        {skill.name}
      </h3>
      <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-grow">{skill.description}</p>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {skill.tags.slice(0, 3).map((tag: string) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-xs bg-white/5 border-white/10 hover:bg-white/10"
            >
              {tag}
            </Badge>
          ))}
          {skill.tags.length > 3 && (
            <Badge variant="outline" className="text-xs bg-white/5 border-white/10">
              +{skill.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center text-gray-400">
            <Download className="w-3 h-3 mr-1.5" />
            {skill.downloads.toLocaleString()}
          </div>
          <div className="flex items-center text-gray-400">
            <Code className="w-3 h-3 mr-1.5" />v{skill.version}
          </div>
        </div>

        <div className="flex gap-2">
          <PremiumButton
            size="sm"
            variant="gradient"
            className="flex-1"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onAction(skill, 'install');
            }}
          >
            Install
          </PremiumButton>
          <div className="flex gap-1">
            <PremiumButton
              size="icon"
              variant="glass"
              className="h-9 w-9"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onAction(skill, 'favorite');
              }}
            >
              <Heart className="w-4 h-4 text-gray-400 hover:text-red-500 hover:fill-current transition-colors" />
            </PremiumButton>
            <PremiumButton
              size="icon"
              variant="glass"
              className="h-9 w-9"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onAction(skill, 'share');
              }}
            >
              <Share2 className="w-4 h-4 text-gray-400 hover:text-blue-400 transition-colors" />
            </PremiumButton>
          </div>
        </div>
      </div>
    </GlassCard>
  );

  const renderModal = () => {
    if (!selectedSkill) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSkill(null)}
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
                  onClick={() => setSelectedSkill(null)}
                  className="text-gray-400 hover:text-white transition-colors bg-black/20 rounded-full p-2 hover:bg-black/40"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 pb-0">
                <div className="flex items-start gap-5 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30 flex-shrink-0">
                    <Zap className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{selectedSkill.name}</h2>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span>
                        by <span className="text-white">{selectedSkill.author}</span>
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                      <span>v{selectedSkill.version}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  {selectedSkill.description}
                </p>
              </div>

              <div className="px-8 pb-8 space-y-8">
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-blue-400" /> Capabilities
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedSkill.capabilities.map((cap: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-gray-300 bg-white/5 p-3 rounded-lg border border-white/5"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        {cap}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedSkill.examples.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                      <Terminal className="w-4 h-4 text-purple-400" /> Examples
                    </h3>
                    <div className="space-y-4">
                      {selectedSkill.examples.map((example: SkillExample, i: number) => (
                        <div key={i} className="bg-black/40 rounded-lg p-4 border border-white/5">
                          <h4 className="text-sm font-medium text-white mb-1">{example.title}</h4>
                          <p className="text-xs text-gray-500 mb-3">{example.description}</p>
                          <div className="space-y-2 font-mono text-xs">
                            <div className="bg-white/5 p-2 rounded text-gray-300">
                              <span className="text-blue-400 font-bold mr-2">Input:</span>
                              {example.input}
                            </div>
                            <div className="bg-white/5 p-2 rounded text-gray-300">
                              <span className="text-green-400 font-bold mr-2">Output:</span>
                              {example.output}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-white/10">
                  <PremiumButton
                    size="lg"
                    variant="gradient"
                    className="flex-1"
                    onClick={() => {
                      handleItemAction(selectedSkill, 'install');
                      setSelectedSkill(null);
                    }}
                  >
                    Install Skill
                  </PremiumButton>
                  {selectedSkill.documentation && (
                    <a
                      href={selectedSkill.documentation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <PremiumButton size="lg" variant="secondary">
                        <BookOpen className="w-4 h-4 mr-2" /> Docs
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
      <BaseBrowser<ClaudeSkill>
        items={skills}
        isLoading={isLoading}
        renderCard={renderCard}
        renderModal={() => null} // Using custom modal logic below
        filterFields={filterFields}
        sortOptions={sortOptions}
        searchPlaceholder="Search skills by name, description, or tags..."
        emptyStateIcon="🔍"
        emptyStateMessage="No skills found"
        onItemAction={handleItemAction}
      />
      {renderModal()}
    </>
  );
}
