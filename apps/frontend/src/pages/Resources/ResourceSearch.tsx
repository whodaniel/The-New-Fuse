// @ts-nocheck
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GlassCard, PremiumButton } from '@/components/ui/premium';
import { resourcesService } from '@/services/resources.service';
import { Resource, ResourceCategory, ResourceType } from '@/types/resources';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Download,
  Filter,
  Grid,
  Heart,
  Layout,
  List,
  Package,
  PenTool,
  Plug,
  Search,
  Share2,
  Star,
  Workflow,
  Zap,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

export default function ResourceSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ResourceCategory | 'all'>('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating' | 'name'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch all resources
  const { data: allResources = [], isLoading } = useQuery({
    queryKey: ['all-resources'],
    queryFn: () => resourcesService.getAllResources(),
  });

  // Filter and sort resources
  const filteredResources = useMemo(() => {
    return allResources
      .filter((resource: Resource) => {
        const matchesSearch =
          searchTerm === '' ||
          resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.tags.some((tag: string) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          resource.author.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = typeFilter === 'all' || resource.type === typeFilter;
        const matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter;
        const matchesFeatured = !featuredOnly || resource.featured;

        return matchesSearch && matchesType && matchesCategory && matchesFeatured;
      })
      .sort((a: Resource, b: Resource) => {
        switch (sortBy) {
          case 'popular':
            return b.downloads - a.downloads;
          case 'recent':
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          case 'rating':
            return b.rating - a.rating;
          case 'name':
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
  }, [allResources, searchTerm, typeFilter, categoryFilter, featuredOnly, sortBy]);

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'skill':
        return <Zap className="w-5 h-5 text-blue-400" />;
      case 'workflow':
        return <Workflow className="w-5 h-5 text-green-400" />;
      case 'template':
        return <Layout className="w-5 h-5 text-orange-400" />;
      case 'tool':
        return <PenTool className="w-5 h-5 text-purple-400" />;
      case 'integration':
        return <Plug className="w-5 h-5 text-pink-400" />;
      default:
        return <Package className="w-5 h-5 text-gray-400" />;
    }
  };

  const getResourceColor = (type: ResourceType) => {
    switch (type) {
      case 'skill':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'workflow':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'template':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'tool':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'integration':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      default:
        return 'bg-white/5 text-gray-400 border-white/10';
    }
  };

  const handleAction = (resource: Resource) => {
    switch (resource.type) {
      case 'skill':
        toast.success(`Installing skill: ${resource.name}`);
        break;
      case 'workflow':
        toast.success(`Importing workflow: ${resource.name}`);
        break;
      case 'template':
        toast.success(`Creating agent from template: ${resource.name}`);
        break;
      default:
        toast.success(`Using resource: ${resource.name}`);
    }
  };

  const handleFavorite = async (resource: Resource) => {
    try {
      await resourcesService.toggleFavorite(resource.id, 'current-user-id');
      toast.success('Added to favorites!');
    } catch {
      toast.error('Failed to add to favorites');
    }
  };

  const handleShare = (resource: Resource) => {
    toast.success('Share link copied to clipboard!');
    navigator.clipboard.writeText(
      `${window.location.origin}/resources/${resource.type}s/${resource.id}`
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Advanced Search Bar */}
      <GlassCard className="p-6">
        <div className="flex items-center mb-4">
          <Search className="text-2xl text-primary mr-3" />
          <h3 className="text-lg font-semibold text-white">Search All Resources</h3>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search across all resources by name, description, tags, or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base bg-black/40 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full pl-10 px-4 py-2 bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-300 appearance-none cursor-pointer hover:bg-black/60 transition-colors"
            >
              <option value="all">All Types</option>
              <option value="skill">Skills</option>
              <option value="workflow">Workflows</option>
              <option value="template">Templates</option>
              <option value="tool">Tools</option>
              <option value="integration">Integrations</option>
            </select>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-300 appearance-none cursor-pointer hover:bg-black/60 transition-colors"
          >
            <option value="all">All Categories</option>
            <option value="development">Development</option>
            <option value="productivity">Productivity</option>
            <option value="communication">Communication</option>
            <option value="data">Data</option>
            <option value="automation">Automation</option>
            <option value="ai">AI</option>
            <option value="other">Other</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-300 appearance-none cursor-pointer hover:bg-black/60 transition-colors"
          >
            <option value="popular">Most Popular</option>
            <option value="recent">Recently Updated</option>
            <option value="rating">Highest Rated</option>
            <option value="name">Name (A-Z)</option>
          </select>

          <div className="flex items-center space-x-4 h-full">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => setFeaturedOnly(e.target.checked)}
                className="rounded border-gray-600 bg-black/40 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-300">Featured Only</span>
            </label>
          </div>
        </div>
      </GlassCard>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Found <span className="font-semibold text-white">{filteredResources.length}</span>{' '}
          resources
        </div>
        <div className="flex items-center space-x-2 bg-black/40 p-1 rounded-lg border border-white/5">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all ${
              viewMode === 'grid'
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all ${
              viewMode === 'list'
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Resources Grid/List */}
      <div
        className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}
      >
        <AnimatePresence mode="popLayout">
          {filteredResources.map((resource: Resource, index: number) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
              layout
            >
              <GlassCard className="h-full hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer group relative overflow-hidden flex flex-col p-5">
                {resource.featured && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-500/20 to-yellow-600/20 text-yellow-400 px-3 py-1 text-xs font-bold rounded-bl-lg border-l border-b border-yellow-500/20">
                    Featured
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                      {getResourceIcon(resource.type)}
                    </div>
                    {viewMode === 'list' && (
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                          {resource.name}
                        </h3>
                        <p className="text-xs text-gray-500">by {resource.author}</p>
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getResourceColor(resource.type)}`}
                  >
                    {resource.type}
                  </span>
                </div>

                {viewMode === 'grid' && (
                  <>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors line-clamp-1">
                      {resource.name}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-grow">
                      {resource.description}
                    </p>
                  </>
                )}

                {viewMode === 'list' && (
                  <p className="text-sm text-gray-400 line-clamp-2 mb-4">{resource.description}</p>
                )}

                <div className="space-y-4 mt-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {resource.tags.slice(0, 3).map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs bg-white/5 border-white/10 hover:bg-white/10"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {resource.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs bg-white/5 border-white/10">
                        +{resource.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 border-t border-white/5 pt-3">
                    <div className="flex items-center">
                      <Download className="w-3 h-3 mr-1.5" />
                      {resource.downloads.toLocaleString()}
                    </div>
                    <div className="flex items-center text-yellow-500">
                      <Star className="w-3 h-3 mr-1.5 fill-current" />
                      {resource.rating} ({resource.reviews})
                    </div>
                  </div>

                  {viewMode === 'list' && (
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" /> v{resource.version}
                        </span>
                        <span>Updated {new Date(resource.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <PremiumButton
                      size="sm"
                      variant="gradient"
                      className="flex-1"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleAction(resource);
                      }}
                    >
                      {resource.type === 'skill' && 'Install'}
                      {resource.type === 'workflow' && 'Import'}
                      {resource.type === 'template' && 'Use'}
                      {!['skill', 'workflow', 'template'].includes(resource.type) && 'View'}
                    </PremiumButton>
                    <div className="flex gap-1">
                      <PremiumButton
                        size="icon"
                        variant="glass"
                        className="h-9 w-9"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleFavorite(resource);
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
                          handleShare(resource);
                        }}
                      >
                        <Share2 className="w-4 h-4 text-gray-400 hover:text-blue-400 transition-colors" />
                      </PremiumButton>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* No Results */}
      {filteredResources.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-6 border border-white/10">
            <Search className="w-10 h-10 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No resources found</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
          <PremiumButton
            variant="secondary"
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('all');
              setCategoryFilter('all');
              setFeaturedOnly(false);
            }}
          >
            Clear Filters
          </PremiumButton>
        </motion.div>
      )}
    </div>
  );
}
