import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { resourcesService } from '../../services/resources.service';
import { AgentTemplate } from '../../types/resources';
import { FiSearch, FiStar, FiDownload, FiCpu, FiExternalLink, FiHeart, FiShare2, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AgentTemplatesBrowser() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular');
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => resourcesService.getTemplates(),
  });

  // Filter and sort templates
  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === 'all' || template.templateType === typeFilter;
      const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
      return matchesSearch && matchesType && matchesCategory;
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

  const handleCreateAgent = async (template: AgentTemplate) => {
    try {
      const result = await resourcesService.createAgentFromTemplate(template.id);
      toast.success(`Agent created from template "${template.name}"!`);
      navigate(`/agents/${result.agentId}`);
    } catch (error) {
      toast.error('Failed to create agent');
    }
  };

  const handleFavorite = async (template: AgentTemplate) => {
    try {
      await resourcesService.toggleFavorite(template.id, 'current-user-id');
      toast.success('Added to favorites!');
    } catch (error) {
      toast.error('Failed to add to favorites');
    }
  };

  const handleShare = (template: AgentTemplate) => {
    toast.success('Share link copied to clipboard!');
    navigator.clipboard.writeText(`${window.location.origin}/resources/templates/${template.id}`);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chat': return '💬';
      case 'task': return '⚡';
      case 'analysis': return '📊';
      case 'automation': return '🤖';
      default: return '🔧';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'chat':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'task':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'analysis':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'automation':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
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
            placeholder="Search agent templates by name, description, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">All Categories</option>
          <option value="communication">Communication</option>
          <option value="development">Development</option>
          <option value="data">Data</option>
          <option value="productivity">Productivity</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">All Types</option>
          <option value="chat">Chat</option>
          <option value="task">Task</option>
          <option value="analysis">Analysis</option>
          <option value="automation">Automation</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="popular">Most Popular</option>
          <option value="recent">Recently Updated</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              layout
            >
              <Card className="h-full hover:shadow-xl transition-shadow cursor-pointer group relative overflow-hidden">
                {template.featured && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-400 to-yellow-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                    Featured
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-3xl">{getTypeIcon(template.templateType)}</div>
                    <div className="flex items-center space-x-1 text-yellow-500">
                      <FiStar className="fill-current" />
                      <span className="text-sm font-medium">{template.rating}</span>
                      <span className="text-xs text-gray-500">({template.reviews})</span>
                    </div>
                  </div>
                  <CardTitle className="group-hover:text-orange-600 transition-colors">
                    {template.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {template.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Type Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(template.templateType)}`}>
                      {template.templateType} agent
                    </span>
                    <div className="flex items-center text-gray-600 text-sm">
                      <FiCpu className="mr-1" />
                      {template.model}
                    </div>
                  </div>

                  {/* Capabilities */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium">Key Capabilities:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {template.capabilities.slice(0, 3).map((cap, i) => (
                        <li key={i} className="flex items-center">
                          <span className="mr-1">•</span>
                          {cap}
                        </li>
                      ))}
                      {template.capabilities.length > 3 && (
                        <li className="text-gray-500">+{template.capabilities.length - 3} more</li>
                      )}
                    </ul>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center text-gray-600">
                      <FiDownload className="mr-1" />
                      {template.downloads.toLocaleString()} uses
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FiZap className="mr-1" />
                      v{template.version}
                    </div>
                  </div>

                  {/* Required Skills */}
                  {template.requiredSkills.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Required Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.requiredSkills.slice(0, 2).map(skill => (
                          <span key={skill} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                            {skill}
                          </span>
                        ))}
                        {template.requiredSkills.length > 2 && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            +{template.requiredSkills.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex flex-col space-y-2">
                  <button
                    onClick={() => handleCreateAgent(template)}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all font-medium"
                  >
                    Create Agent
                  </button>
                  <div className="flex space-x-2 w-full">
                    <button
                      onClick={() => handleFavorite(template)}
                      className="flex-1 flex items-center justify-center space-x-1 text-sm text-gray-600 hover:text-red-600 py-1 border border-gray-300 rounded-lg hover:border-red-600 transition-colors"
                    >
                      <FiHeart />
                      <span>Favorite</span>
                    </button>
                    <button
                      onClick={() => handleShare(template)}
                      className="flex-1 flex items-center justify-center space-x-1 text-sm text-gray-600 hover:text-orange-600 py-1 border border-gray-300 rounded-lg hover:border-orange-600 transition-colors"
                    >
                      <FiShare2 />
                      <span>Share</span>
                    </button>
                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className="flex items-center justify-center text-sm text-gray-600 hover:text-red-600 py-1 px-3 border border-gray-300 rounded-lg hover:border-red-600 transition-colors"
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
      {filteredTemplates.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No templates found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria
          </p>
        </motion.div>
      )}

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTemplate(null)}
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
                  <div className="text-4xl">{getTypeIcon(selectedTemplate.templateType)}</div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedTemplate.name}</h2>
                    <p className="text-sm text-gray-600">by {selectedTemplate.author}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">{selectedTemplate.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Type</p>
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getTypeColor(selectedTemplate.templateType)}`}>
                      {selectedTemplate.templateType}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Model</p>
                    <p className="text-lg font-semibold">{selectedTemplate.model}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Capabilities</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    {selectedTemplate.capabilities.map((cap, i) => (
                      <li key={i}>{cap}</li>
                    ))}
                  </ul>
                </div>

                {selectedTemplate.requiredSkills.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.requiredSkills.map(skill => (
                        <span key={skill} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTemplate.optionalSkills.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Optional Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.optionalSkills.map(skill => (
                        <span key={skill} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">System Prompt Preview</h3>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <code className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedTemplate.systemPrompt}
                    </code>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      handleCreateAgent(selectedTemplate);
                      setSelectedTemplate(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all font-medium"
                  >
                    Create Agent
                  </button>
                  <button
                    onClick={() => {
                      toast.success('Template customization coming soon!');
                    }}
                    className="px-6 py-3 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    Customize
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
