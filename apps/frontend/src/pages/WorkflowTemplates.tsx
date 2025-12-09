import {
  ActionCard,
  GlassCard,
  PremiumButton,
  PremiumInput,
  PremiumSelect,
} from '@/components/ui/premium';
import { Filter, Search, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

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
      isPopular: true,
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
      isPopular: true,
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
      isPopular: false,
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
      isPopular: true,
    },
  ];

  const categories = ['all', 'Analytics', 'Customer Service', 'Content', 'Development'];

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header Section */}
        <div className="flex items-center justify-between animate-slide-in-down">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Workflow Templates
            </h1>
            <p className="text-slate-300 mt-2">
              Pre-built intelligence patterns for rapid deployment
            </p>
          </div>
          <PremiumButton size="lg" variant="gradient">
            <Sparkles className="w-4 h-4 mr-2" />
            Create Custom Template
          </PremiumButton>
        </div>

        {/* Search and Filter */}
        <GlassCard className="animate-slide-in-up">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <PremiumInput
                icon={<Search className="w-4 h-4" />}
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="sm:w-64">
              <PremiumSelect
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                icon={<Filter className="w-4 h-4" />}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </PremiumSelect>
            </div>
          </div>
        </GlassCard>

        {/* Popular Templates */}
        {selectedCategory === 'all' && (
          <div className="space-y-4 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              Popular Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates
                .filter((t) => t.isPopular)
                .map((template) => (
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
        <div className="space-y-4 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-bold text-white">
            {selectedCategory === 'all' ? 'All Templates' : `${selectedCategory} Templates`}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} onUse={handleUseTemplate} />
            ))}
          </div>
        </div>

        {filteredTemplates.length === 0 && (
          <GlassCard className="text-center py-12">
            <p className="text-slate-400">No templates found matching your criteria.</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: WorkflowTemplate;
  onUse: (templateId: string) => void;
  isPopular?: boolean;
}

function TemplateCard({ template, onUse, isPopular = false }: TemplateCardProps) {
  const complexityConfig = {
    Simple: { gradient: 'from-green-500 to-emerald-500', text: 'text-green-300' },
    Intermediate: { gradient: 'from-yellow-500 to-orange-500', text: 'text-yellow-300' },
    Advanced: { gradient: 'from-red-500 to-pink-500', text: 'text-red-300' },
  };

  const config = complexityConfig[template.complexity];

  return (
    <ActionCard
      title={template.name}
      description={template.description}
      icon={<Sparkles className="w-5 h-5" />}
      gradient={config.gradient}
      className="relative"
    >
      {isPopular && (
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full">
            Popular
          </span>
        </div>
      )}

      <div className="space-y-4 mt-4">
        <div className="flex flex-wrap gap-2">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-white/10 text-slate-300 rounded border border-white/20"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r ${config.gradient}/20 ${config.text} border border-${config.gradient.split(' ')[0].replace('from-', '')}/30`}
          >
            {template.complexity}
          </span>
          <span className="text-slate-400">{template.agentCount} agents</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Est. time: {template.estimatedTime}</span>
        </div>

        <div className="flex gap-2 pt-2">
          <PremiumButton
            onClick={() => onUse(template.id)}
            variant="gradient"
            size="sm"
            className="flex-1"
          >
            Use Template
          </PremiumButton>
          <PremiumButton variant="secondary" size="sm">
            Preview
          </PremiumButton>
        </div>
      </div>
    </ActionCard>
  );
}
