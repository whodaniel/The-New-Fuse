import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { resourcesService } from '../../services/resources.service';
import { ClaudeSkill } from '../../types/resources';
import { FiStar, FiDownload, FiCode, FiExternalLink, FiHeart, FiShare2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { BaseBrowser, FilterField, SortOption } from '../../components/browsers';

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
        } catch (error) {
          toast.error('Failed to install skill');
        }
        break;
      case 'favorite':
        try {
          await resourcesService.toggleFavorite(skill.id, 'current-user-id');
          toast.success('Added to favorites!');
        } catch (error) {
          toast.error('Failed to add to favorites');
        }
        break;
      case 'share':
        toast.success('Share link copied to clipboard!');
        navigator.clipboard.writeText(`${window.location.origin}/resources/skills/${skill.id}`);
        break;
      case 'view-details':
        setSelectedSkill(skill);
        break;
    }
  };

  const renderCard = (skill: ClaudeSkill, index: number, onAction: (item: ClaudeSkill, action: string) => void) => (
    <Card className="h-full hover:shadow-xl transition-shadow cursor-pointer group relative overflow-hidden">
      {skill.featured && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-400 to-yellow-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
          Featured
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="text-3xl">⚡</div>
          <div className="flex items-center space-x-1 text-yellow-500">
            <FiStar className="fill-current" />
            <span className="text-sm font-medium">{skill.rating}</span>
            <span className="text-xs text-gray-500">({skill.reviews})</span>
          </div>
        </div>
        <CardTitle className="group-hover:text-blue-600 transition-colors">
          {skill.name}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {skill.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1">
          {skill.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {skill.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{skill.tags.length - 3}
            </Badge>
          )}
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1 font-medium">Key Capabilities:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            {skill.capabilities.slice(0, 3).map((cap, i) => (
              <li key={i} className="flex items-center">
                <span className="mr-1">•</span>
                {cap}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center text-gray-600">
            <FiDownload className="mr-1" />
            {skill.downloads.toLocaleString()} downloads
          </div>
          <div className="flex items-center text-gray-600">
            <FiCode className="mr-1" />
            v{skill.version}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Compatible with:</p>
          <div className="flex flex-wrap gap-1">
            {skill.modelCompatibility.slice(0, 2).map(model => (
              <span key={model} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                {model}
              </span>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        <button
          onClick={() => onAction(skill, 'install')}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
        >
          Install Skill
        </button>
        <div className="flex space-x-2 w-full">
          <button
            onClick={() => onAction(skill, 'favorite')}
            className="flex-1 flex items-center justify-center space-x-1 text-sm text-gray-600 hover:text-red-600 py-1 border border-gray-300 rounded-lg hover:border-red-600 transition-colors"
          >
            <FiHeart />
            <span>Favorite</span>
          </button>
          <button
            onClick={() => onAction(skill, 'share')}
            className="flex-1 flex items-center justify-center space-x-1 text-sm text-gray-600 hover:text-blue-600 py-1 border border-gray-300 rounded-lg hover:border-blue-600 transition-colors"
          >
            <FiShare2 />
            <span>Share</span>
          </button>
          <button
            onClick={() => onAction(skill, 'view-details')}
            className="flex items-center justify-center text-sm text-gray-600 hover:text-purple-600 py-1 px-3 border border-gray-300 rounded-lg hover:border-purple-600 transition-colors"
          >
            <FiExternalLink />
          </button>
        </div>
      </CardFooter>
    </Card>
  );

  const renderModal = (skill: ClaudeSkill | null, onClose: () => void) => {
    if (!skill) return null;

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
                <div className="text-4xl">⚡</div>
                <div>
                  <h2 className="text-2xl font-bold">{skill.name}</h2>
                  <p className="text-sm text-gray-600">by {skill.author}</p>
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
              <p className="text-gray-700 dark:text-gray-300">{skill.description}</p>

              <div>
                <h3 className="font-semibold mb-2">Capabilities</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  {skill.capabilities.map((cap, i) => (
                    <li key={i}>{cap}</li>
                  ))}
                </ul>
              </div>

              {skill.examples.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Examples</h3>
                  {skill.examples.map((example, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-2">
                      <h4 className="font-medium text-sm mb-1">{example.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{example.description}</p>
                      <div className="text-xs">
                        <p className="text-gray-500 mb-1">Input:</p>
                        <code className="block bg-white dark:bg-gray-800 p-2 rounded">{example.input}</code>
                        <p className="text-gray-500 mt-2 mb-1">Output:</p>
                        <code className="block bg-white dark:bg-gray-800 p-2 rounded">{example.output}</code>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    handleItemAction(skill, 'install');
                    onClose();
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                >
                  Install Skill
                </button>
                {skill.documentation && (
                  <a
                    href={skill.documentation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <FiExternalLink className="mr-2" />
                    Docs
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
    <BaseBrowser<ClaudeSkill>
      items={skills}
      isLoading={isLoading}
      renderCard={renderCard}
      renderModal={renderModal}
      filterFields={filterFields}
      sortOptions={sortOptions}
      searchPlaceholder="Search skills by name, description, or tags..."
      emptyStateIcon="🔍"
      emptyStateMessage="No skills found"
      onItemAction={handleItemAction}
    />
  );
}
