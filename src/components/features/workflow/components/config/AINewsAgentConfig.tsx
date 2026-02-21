import React, { useEffect, useState } from 'react';
import { Button } from '../../../ui/button.js';
import { Input } from '../../../ui/input.js';
import { Label } from '../../../ui/label.js';
import { Slider } from '../../../ui/slider.js';
import { Badge } from '../../../ui/badge.js';
import { X, Plus } from 'lucide-react';

interface AINewsAgentConfigProps {
  data: any;
  onChange: (data: any) => void;
}

export const AINewsAgentConfig: React.FC<AINewsAgentConfigProps> = ({ data, onChange }) => {
  const [config, setConfig] = useState({
    sources: data?.sources || ["arxiv.org", "huggingface.co", "ai.googleblog.com"],
    keywords: data?.keywords || ["LLM", "generative AI", "transformer"],
    updateFrequency: data?.updateFrequency || 24,
    maxItems: data?.maxItems || 10,
  });
  
  const [newSource, setNewSource] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  // Update parent when configuration changes
  useEffect(() => {
    onChange({
      ...data,
      ...config,
    });
  }, [config]);

  const addSource = () => {
    if (newSource.trim() && !config.sources.includes(newSource.trim())) {
      setConfig({
        ...config,
        sources: [...config.sources, newSource.trim()],
      });
      setNewSource('');
    }
  };

  const removeSource = (source: string) => {
    setConfig({
      ...config,
      sources: config.sources.filter(s => s !== source),
    });
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !config.keywords.includes(newKeyword.trim())) {
      setConfig({
        ...config,
        keywords: [...config.keywords, newKeyword.trim()],
      });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setConfig({
      ...config,
      keywords: config.keywords.filter(k => k !== keyword),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">News Sources</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {config.sources.map(source => (
            <Badge key={source} variant="secondary" className="flex items-center gap-1">
              {source}
              <button
                title="Remove source"
                type="button" 
                onClick={() => removeSource(source)}
                className="ml-1 h-4 w-4 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
            placeholder="Add news source..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSource();
              }
            }}
          />
          <Button type="button" onClick={addSource} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Keywords</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {config.keywords.map(keyword => (
            <Badge key={keyword} variant="outline" className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              {keyword}
              <button 
                type="button" 
                onClick={() => removeKeyword(keyword)}
                className="ml-1 h-4 w-4 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Add keyword..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addKeyword();
              }
            }}
          />
          <Button type="button" onClick={addKeyword} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Update Frequency: {config.updateFrequency} hours</h3>
        <Slider
          value={[config.updateFrequency]}
          min={1}
          max={168}
          step={1}
          onValueChange={(value) => setConfig({ ...config, updateFrequency: value[0] })}
          className="mb-6"
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Maximum Items: {config.maxItems}</h3>
        <Slider
          value={[config.maxItems]}
          min={5}
          max={100}
          step={5}
          onValueChange={(value) => setConfig({ ...config, maxItems: value[0] })}
        />
      </div>
    </div>
  );
};
