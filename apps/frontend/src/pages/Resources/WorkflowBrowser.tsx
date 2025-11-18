import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { resourcesService } from '../../services/resources.service';
import { N8NWorkflow } from '../../types/resources';
import { FiSearch, FiStar, FiDownload, FiPlay, FiExternalLink, FiHeart, FiShare2, FiGitBranch } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function WorkflowBrowser() {
  const [searchTerm, setSearchTerm] = useState('');
  const [complexityFilter, setComplexityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular');
  const [selectedWorkflow, setSelectedWorkflow] = useState<N8NWorkflow | null>(null);

  // Fetch workflows
  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => resourcesService.getWorkflows(),
  });

  // Filter and sort workflows
  const filteredWorkflows = workflows
    .filter(workflow => {
      const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesComplexity = complexityFilter === 'all' || workflow.complexity === complexityFilter;
      const matchesCategory = categoryFilter === 'all' || workflow.category === categoryFilter;
      return matchesSearch && matchesComplexity && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.downloads - a.downloads;
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

  const handleImportWorkflow = async (workflow: N8NWorkflow) => {
    try {
      const result = await resourcesService.importWorkflow(workflow.id);
      toast.success(`Workflow "${workflow.name}" imported to n8n successfully!`);
    } catch (error) {
      toast.error('Failed to import workflow');
    }
  };

  const handleFavorite = async (workflow: N8NWorkflow) => {
    try {
      await resourcesService.toggleFavorite(workflow.id, 'current-user-id');
      toast.success('Added to favorites!');
    } catch (error) {
      toast.error('Failed to add to favorites');
    }
  };

  const handleShare = (workflow: N8NWorkflow) => {
    toast.success('Share link copied to clipboard!');
    navigator.clipboard.writeText(`${window.location.origin}/resources/workflows/${workflow.id}`);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'complex':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search workflows by name, description, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Categories</option>
          <option value="productivity">Productivity</option>
          <option value="ai">AI</option>
          <option value="data">Data</option>
          <option value="automation">Automation</option>
        </select>
        <select
          value={complexityFilter}
          onChange={(e) => setComplexityFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Complexity</option>
          <option value="simple">Simple</option>
          <option value="medium">Medium</option>
          <option value="complex">Complex</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="popular">Most Popular</option>
          <option value="recent">Recently Updated</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredWorkflows.length} {filteredWorkflows.length === 1 ? 'workflow' : 'workflows'}
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredWorkflows.map((workflow, index) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              layout
            >
              <Card className="h-full hover:shadow-xl transition-shadow cursor-pointer group relative overflow-hidden">
                {workflow.featured && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-400 to-yellow-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                    Featured
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-3xl">🔄</div>
                    <div className="flex items-center space-x-1 text-yellow-500">
                      <FiStar className="fill-current" />
                      <span className="text-sm font-medium">{workflow.rating}</span>
                      <span className="text-xs text-gray-500">({workflow.reviews})</span>
                    </div>
                  </div>
                  <CardTitle className="group-hover:text-green-600 transition-colors">
                    {workflow.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {workflow.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {workflow.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {workflow.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{workflow.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Complexity Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getComplexityColor(workflow.complexity)}`}>
                      {workflow.complexity} workflow
                    </span>
                    <div className="flex items-center text-gray-600 text-sm">
                      <FiGitBranch className="mr-1" />
                      {workflow.nodes} nodes
                    </div>
                  </div>

                  {/* Integrations */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium">Integrations:</p>
                    <div className="flex flex-wrap gap-1">
                      {workflow.integrations.slice(0, 3).map(integration => (
                        <span key={integration} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          {integration}
                        </span>
                      ))}
                      {workflow.integrations.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          +{workflow.integrations.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center text-gray-600">
                      <FiDownload className="mr-1" />
                      {workflow.downloads.toLocaleString()} downloads
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FiPlay className="mr-1" />
                      v{workflow.version}
                    </div>
                  </div>

                  {/* Triggers & Actions Preview */}
                  <div className="text-xs">
                    <p className="text-gray-500 mb-1">
                      <span className="font-medium">Triggers:</span> {workflow.triggers.slice(0, 2).join(', ')}
                      {workflow.triggers.length > 2 && ` +${workflow.triggers.length - 2}`}
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-2">
                  <button
                    onClick={() => handleImportWorkflow(workflow)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium"
                  >
                    Import to n8n
                  </button>
                  <div className="flex space-x-2 w-full">
                    <button
                      onClick={() => handleFavorite(workflow)}
                      className="flex-1 flex items-center justify-center space-x-1 text-sm text-gray-600 hover:text-red-600 py-1 border border-gray-300 rounded-lg hover:border-red-600 transition-colors"
                    >
                      <FiHeart />
                      <span>Favorite</span>
                    </button>
                    <button
                      onClick={() => handleShare(workflow)}
                      className="flex-1 flex items-center justify-center space-x-1 text-sm text-gray-600 hover:text-green-600 py-1 border border-gray-300 rounded-lg hover:border-green-600 transition-colors"
                    >
                      <FiShare2 />
                      <span>Share</span>
                    </button>
                    <button
                      onClick={() => setSelectedWorkflow(workflow)}
                      className="flex items-center justify-center text-sm text-gray-600 hover:text-emerald-600 py-1 px-3 border border-gray-300 rounded-lg hover:border-emerald-600 transition-colors"
                    >
                      <FiExternalLink />
                    </button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* No Results */}
      {filteredWorkflows.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No workflows found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria
          </p>
        </motion.div>
      )}

      {/* Workflow Detail Modal */}
      {selectedWorkflow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedWorkflow(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-4xl">🔄</div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedWorkflow.name}</h2>
                    <p className="text-sm text-gray-600">by {selectedWorkflow.author}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWorkflow(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">{selectedWorkflow.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Complexity</p>
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getComplexityColor(selectedWorkflow.complexity)}`}>
                      {selectedWorkflow.complexity}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Nodes</p>
                    <p className="text-lg font-semibold">{selectedWorkflow.nodes}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Triggers</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    {selectedWorkflow.triggers.map((trigger, i) => (
                      <li key={i}>{trigger}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Actions</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    {selectedWorkflow.actions.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Integrations</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkflow.integrations.map(integration => (
                      <span key={integration} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {integration}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      handleImportWorkflow(selectedWorkflow);
                      setSelectedWorkflow(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium"
                  >
                    Import to n8n
                  </button>
                  {selectedWorkflow.importUrl && (
                    <a
                      href={selectedWorkflow.importUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-6 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <FiExternalLink className="mr-2" />
                      View
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
