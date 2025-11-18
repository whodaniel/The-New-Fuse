import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { resourcesService } from '../../services/resources.service';
import { AgentTemplate } from '../../types/resources';
import { FiStar, FiDownload, FiCpu, FiExternalLink, FiHeart, FiShare2, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { BaseBrowser, FilterField, SortOption } from '../../components/browsers';

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

  const handleItemAction = async (template: AgentTemplate, action: string) => {
    switch (action) {
      case 'create':
        try {
          const result = await resourcesService.createAgentFromTemplate(template.id);
          toast.success(`Agent created from template "${template.name}"!`);
          navigate(`/agents/${result.agentId}`);
        } catch (error) {
          toast.error('Failed to create agent');
        }
        break;
      case 'favorite':
        try {
          await resourcesService.toggleFavorite(template.id, 'current-user-id');
          toast.success('Added to favorites!');
        } catch (error) {
          toast.error('Failed to add to favorites');
        }
        break;
      case 'share':
        toast.success('Share link copied to clipboard!');
        navigator.clipboard.writeText(`${window.location.origin}/resources/templates/${template.id}`);
        break;
      case 'view-details':
        setSelectedTemplate(template);
        break;
    }
  };

  const renderCard = (template: AgentTemplate, index: number, onAction: (item: AgentTemplate, action: string) => void) => (
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

        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(template.templateType)}`}>
            {template.templateType} agent
          </span>
          <div className="flex items-center text-gray-600 text-sm">
            <FiCpu className="mr-1" />
            {template.model}
          </div>
        </div>

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
          onClick={() => onAction(template, 'create')}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all font-medium"
        >
          Create Agent
        </button>
        <div className="flex space-x-2 w-full">
          <button
            onClick={() => onAction(template, 'favorite')}
            className="flex-1 flex items-center justify-center space-x-1 text-sm text-gray-600 hover:text-red-600 py-1 border border-gray-300 rounded-lg hover:border-red-600 transition-colors"
          >
            <FiHeart />
            <span>Favorite</span>
          </button>
          <button
            onClick={() => onAction(template, 'share')}
            className="flex-1 flex items-center justify-center space-x-1 text-sm text-gray-600 hover:text-orange-600 py-1 border border-gray-300 rounded-lg hover:border-orange-600 transition-colors"
          >
            <FiShare2 />
            <span>Share</span>
          </button>
          <button
            onClick={() => onAction(template, 'view-details')}
            className="flex items-center justify-center text-sm text-gray-600 hover:text-red-600 py-1 px-3 border border-gray-300 rounded-lg hover:border-red-600 transition-colors"
          >
            <FiExternalLink />
          </button>
        </div>
      </CardFooter>
    </Card>
  );

  const renderModal = (template: AgentTemplate | null, onClose: () => void) => {
    if (!template) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
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
                <div className="text-4xl">{getTypeIcon(template.templateType)}</div>
                <div>
                  <h2 className="text-2xl font-bold">{template.name}</h2>
                  <p className="text-sm text-gray-600">by {template.author}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">{template.description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Type</p>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getTypeColor(template.templateType)}`}>
                    {template.templateType}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Model</p>
                  <p className="text-lg font-semibold">{template.model}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Capabilities</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  {template.capabilities.map((cap, i) => (
                    <li key={i}>{cap}</li>
                  ))}
                </ul>
              </div>

              {template.requiredSkills.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {template.requiredSkills.map(skill => (
                      <span key={skill} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {template.optionalSkills.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Optional Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {template.optionalSkills.map(skill => (
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
                    {template.systemPrompt}
                  </code>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    handleItemAction(template, 'create');
                    onClose();
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
    );
  };

  return (
    <BaseBrowser<AgentTemplate>
      items={templates}
      isLoading={isLoading}
      renderCard={renderCard}
      renderModal={renderModal}
      filterFields={filterFields}
      sortOptions={sortOptions}
      searchPlaceholder="Search agent templates by name, description, or tags..."
      emptyStateIcon="🔍"
      emptyStateMessage="No templates found"
      onItemAction={handleItemAction}
    />
  );
}
