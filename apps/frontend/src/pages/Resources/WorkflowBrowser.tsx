import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { resourcesService } from '../../services/resources.service';
import { N8NWorkflow } from '../../types/resources';
import { FiStar, FiDownload, FiPlay, FiExternalLink, FiHeart, FiShare2, FiGitBranch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { BaseBrowser, FilterField, SortOption } from '../../components/browsers';

export default function WorkflowBrowser() {
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'complex':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleItemAction = async (workflow: N8NWorkflow, action: string) => {
    switch (action) {
      case 'import':
        try {
          await resourcesService.importWorkflow(workflow.id);
          toast.success(`Workflow "${workflow.name}" imported to n8n successfully!`);
        } catch (error) {
          toast.error('Failed to import workflow');
        }
        break;
      case 'favorite':
        try {
          await resourcesService.toggleFavorite(workflow.id, 'current-user-id');
          toast.success('Added to favorites!');
        } catch (error) {
          toast.error('Failed to add to favorites');
        }
        break;
      case 'share':
        toast.success('Share link copied to clipboard!');
        navigator.clipboard.writeText(`${window.location.origin}/resources/workflows/${workflow.id}`);
        break;
      case 'view-details':
        setSelectedWorkflow(workflow);
        break;
    }
  };

  const renderCard = (workflow: N8NWorkflow, index: number, onAction: (item: N8NWorkflow, action: string) => void) => (
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

        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getComplexityColor(workflow.complexity)}`}>
            {workflow.complexity} workflow
          </span>
          <div className="flex items-center text-gray-600 text-sm">
            <FiGitBranch className="mr-1" />
            {workflow.nodes} nodes
          </div>
        </div>

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

        <div className="text-xs">
          <p className="text-gray-500 mb-1">
            <span className="font-medium">Triggers:</span> {workflow.triggers.slice(0, 2).join(', ')}
            {workflow.triggers.length > 2 && ` +${workflow.triggers.length - 2}`}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        <button
          onClick={() => onAction(workflow, 'import')}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium"
        >
          Import to n8n
        </button>
        <div className="flex space-x-2 w-full">
          <button
            onClick={() => onAction(workflow, 'favorite')}
            className="flex-1 flex items-center justify-center space-x-1 text-sm text-gray-600 hover:text-red-600 py-1 border border-gray-300 rounded-lg hover:border-red-600 transition-colors"
          >
            <FiHeart />
            <span>Favorite</span>
          </button>
          <button
            onClick={() => onAction(workflow, 'share')}
            className="flex-1 flex items-center justify-center space-x-1 text-sm text-gray-600 hover:text-green-600 py-1 border border-gray-300 rounded-lg hover:border-green-600 transition-colors"
          >
            <FiShare2 />
            <span>Share</span>
          </button>
          <button
            onClick={() => onAction(workflow, 'view-details')}
            className="flex items-center justify-center text-sm text-gray-600 hover:text-emerald-600 py-1 px-3 border border-gray-300 rounded-lg hover:border-emerald-600 transition-colors"
          >
            <FiExternalLink />
          </button>
        </div>
      </CardFooter>
    </Card>
  );

  const renderModal = (workflow: N8NWorkflow | null, onClose: () => void) => {
    if (!workflow) return null;

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
                <div className="text-4xl">🔄</div>
                <div>
                  <h2 className="text-2xl font-bold">{workflow.name}</h2>
                  <p className="text-sm text-gray-600">by {workflow.author}</p>
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
              <p className="text-gray-700 dark:text-gray-300">{workflow.description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Complexity</p>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getComplexityColor(workflow.complexity)}`}>
                    {workflow.complexity}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Nodes</p>
                  <p className="text-lg font-semibold">{workflow.nodes}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Triggers</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  {workflow.triggers.map((trigger, i) => (
                    <li key={i}>{trigger}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Actions</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  {workflow.actions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Integrations</h3>
                <div className="flex flex-wrap gap-2">
                  {workflow.integrations.map(integration => (
                    <span key={integration} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      {integration}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    handleItemAction(workflow, 'import');
                    onClose();
                  }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium"
                >
                  Import to n8n
                </button>
                {workflow.importUrl && (
                  <a
                    href={workflow.importUrl}
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
    );
  };

  return (
    <BaseBrowser<N8NWorkflow>
      items={workflows}
      isLoading={isLoading}
      renderCard={renderCard}
      renderModal={renderModal}
      filterFields={filterFields}
      sortOptions={sortOptions}
      searchPlaceholder="Search workflows by name, description, or tags..."
      emptyStateIcon="🔍"
      emptyStateMessage="No workflows found"
      onItemAction={handleItemAction}
    />
  );
}
