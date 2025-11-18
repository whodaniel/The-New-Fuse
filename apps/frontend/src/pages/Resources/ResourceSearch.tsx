import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { resourcesService } from '../../services/resources.service';
import { Resource, ResourceType, ResourceCategory } from '../../types/resources';
import { FiSearch, FiStar, FiDownload, FiFilter, FiHeart, FiShare2, FiPackage } from 'react-icons/fi';
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
      .filter(resource => {
        const matchesSearch = searchTerm === '' ||
          resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
          resource.author.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = typeFilter === 'all' || resource.type === typeFilter;
        const matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter;
        const matchesFeatured = !featuredOnly || resource.featured;

        return matchesSearch && matchesType && matchesCategory && matchesFeatured;
      })
      .sort((a, b) => {
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

  // Get unique tags from all resources
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allResources.forEach(resource => {
      resource.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [allResources]);

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'skill': return '⚡';
      case 'workflow': return '🔄';
      case 'template': return '🤖';
      case 'tool': return '🔧';
      case 'integration': return '🔌';
      default: return '📦';
    }
  };

  const getResourceColor = (type: ResourceType) => {
    switch (type) {
      case 'skill':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'workflow':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'template':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'tool':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'integration':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
    } catch (error) {
      toast.error('Failed to add to favorites');
    }
  };

  const handleShare = (resource: Resource) => {
    toast.success('Share link copied to clipboard!');
    navigator.clipboard.writeText(`${window.location.origin}/resources/${resource.type}s/${resource.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Advanced Search Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-center mb-4">
          <FiSearch className="text-2xl text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold">Search All Resources</h3>
        </div>

        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search across all resources by name, description, tags, or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="skill">Skills</option>
            <option value="workflow">Workflows</option>
            <option value="template">Templates</option>
            <option value="tool">Tools</option>
            <option value="integration">Integrations</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="popular">Most Popular</option>
            <option value="recent">Recently Updated</option>
            <option value="rating">Highest Rated</option>
            <option value="name">Name (A-Z)</option>
          </select>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => setFeaturedOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">Featured Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Found <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredResources.length}</span> resources
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">View:</span>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Resources Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredResources.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                layout
              >
                <Card className="h-full hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
                  {resource.featured && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-400 to-yellow-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg z-10">
                      Featured
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="text-3xl">{getResourceIcon(resource.type)}</div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getResourceColor(resource.type)}`}>
                          {resource.type}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-yellow-500">
                        <FiStar className="fill-current" />
                        <span className="text-sm font-medium">{resource.rating}</span>
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-blue-600 transition-colors line-clamp-1">
                      {resource.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {resource.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {resource.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {resource.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{resource.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div className="flex items-center">
                        <FiDownload className="mr-1" />
                        {resource.downloads.toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        <FiPackage className="mr-1" />
                        v{resource.version}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      by <span className="font-medium text-gray-700">{resource.author}</span>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleAction(resource)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                    >
                      {resource.type === 'skill' && 'Install'}
                      {resource.type === 'workflow' && 'Import'}
                      {resource.type === 'template' && 'Use Template'}
                      {!['skill', 'workflow', 'template'].includes(resource.type) && 'View Details'}
                    </button>
                    <div className="flex space-x-2 w-full">
                      <button
                        onClick={() => handleFavorite(resource)}
                        className="flex-1 flex items-center justify-center space-x-1 text-sm text-gray-600 hover:text-red-600 py-1 border border-gray-300 rounded-lg hover:border-red-600 transition-colors"
                      >
                        <FiHeart />
                      </button>
                      <button
                        onClick={() => handleShare(resource)}
                        className="flex-1 flex items-center justify-center space-x-1 text-sm text-gray-600 hover:text-blue-600 py-1 border border-gray-300 rounded-lg hover:border-blue-600 transition-colors"
                      >
                        <FiShare2 />
                      </button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredResources.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
                layout
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="text-3xl">{getResourceIcon(resource.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-lg">{resource.name}</h3>
                            {resource.featured && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                Featured
                              </Badge>
                            )}
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getResourceColor(resource.type)}`}>
                              {resource.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center">
                              <FiStar className="mr-1 text-yellow-500 fill-current" />
                              {resource.rating} ({resource.reviews} reviews)
                            </div>
                            <div className="flex items-center">
                              <FiDownload className="mr-1" />
                              {resource.downloads.toLocaleString()} downloads
                            </div>
                            <span>by {resource.author}</span>
                            <span>v{resource.version}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleAction(resource)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                        >
                          {resource.type === 'skill' && 'Install'}
                          {resource.type === 'workflow' && 'Import'}
                          {resource.type === 'template' && 'Use'}
                          {!['skill', 'workflow', 'template'].includes(resource.type) && 'View'}
                        </button>
                        <button
                          onClick={() => handleFavorite(resource)}
                          className="p-2 text-gray-600 hover:text-red-600 border border-gray-300 rounded-lg hover:border-red-600 transition-colors"
                        >
                          <FiHeart />
                        </button>
                        <button
                          onClick={() => handleShare(resource)}
                          className="p-2 text-gray-600 hover:text-blue-600 border border-gray-300 rounded-lg hover:border-blue-600 transition-colors"
                        >
                          <FiShare2 />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* No Results */}
      {filteredResources.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No resources found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Try adjusting your search or filter criteria
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('all');
              setCategoryFilter('all');
              setFeaturedOnly(false);
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear Filters
          </button>
        </motion.div>
      )}
    </div>
  );
}
