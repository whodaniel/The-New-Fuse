import React, { useState, useEffect } from 'react';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  complexity: 'Simple' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  agentCount: number;
  isPopular: boolean;
}

export default function WorkflowTemplates() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch workflow templates from backend
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/workflows/templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        } else {
          // Fallback to mock data if API not available
          setTemplates(mockTemplates);
        }
      } catch (error) {
        console.error('Error fetching workflow templates:', error);
        setTemplates(mockTemplates);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const mockTemplates: WorkflowTemplate[] = [
    {
      id: '1',
      name: 'Data Analysis Pipeline',
      description: 'Automated data collection, cleaning, analysis, and reporting workflow',
      category: 'Analytics',
      tags: ['data', 'analysis', 'reporting'],
      complexity: 'Intermediate',
      estimatedTime: '2-4 hours',
      agentCount: 3,
      isPopular: true
    },
    {
      id: '2',
      name: 'Customer Support Automation',
      description: 'Multi-agent system for handling customer inquiries and support tickets',
      category: 'Customer Service',
      tags: ['support', 'automation', 'customer'],
      complexity: 'Advanced',
      estimatedTime: '1-2 hours',
      agentCount: 4,
      isPopular: true
    },
    {
      id: '3',
      name: 'Content Creation Workflow',
      description: 'Collaborative content creation, review, and publishing process',
      category: 'Content',
      tags: ['content', 'creation', 'publishing'],
      complexity: 'Simple',
      estimatedTime: '30 minutes',
      agentCount: 2,
      isPopular: false
    },
    {
      id: '4',
      name: 'Code Review Assistant',
      description: 'Automated code review, testing, and deployment workflow',
      category: 'Development',
      tags: ['code', 'review', 'testing'],
      complexity: 'Advanced',
      estimatedTime: '3-5 hours',
      agentCount: 5,
      isPopular: true
    }
  ];

  const categories = ['all', 'Analytics', 'Customer Service', 'Content', 'Development'];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/workflows/templates/${templateId}/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const newWorkflow = await response.json();
        // Redirect to workflow editor or show success message
        window.location.href = `/workflows/${newWorkflow.id}`;
      }
    } catch (error) {
      console.error('Error using template:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Workflow Templates</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          Create Custom Template
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          title="Filter by category"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>
      </div>

      {/* Popular Templates */}
      {selectedCategory === 'all' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Popular Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.filter(t => t.isPopular).map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={handleUseTemplate}
                isPopular={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Templates */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {selectedCategory === 'all' ? 'All Templates' : `${selectedCategory} Templates`}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={handleUseTemplate}
            />
          ))}
        </div>
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No templates found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: WorkflowTemplate;
  onUse: (templateId: string) => void;
  isPopular?: boolean;
}

function TemplateCard({ template, onUse, isPopular = false }: TemplateCardProps) {
  const complexityColors = {
    Simple: 'bg-green-100 text-green-800',
    Intermediate: 'bg-yellow-100 text-yellow-800',
    Advanced: 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow relative">
      {isPopular && (
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">
            Popular
          </span>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">{template.name}</h3>
          <p className="text-muted-foreground text-sm mt-1">{template.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {template.tags.map(tag => (
            <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className={`px-2 py-1 text-xs rounded ${complexityColors[template.complexity]}`}>
            {template.complexity}
          </span>
          <span className="text-muted-foreground">{template.agentCount} agents</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Est. time: {template.estimatedTime}</span>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onUse(template.id)}
            className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
          >
            Use Template
          </button>
          <button className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}