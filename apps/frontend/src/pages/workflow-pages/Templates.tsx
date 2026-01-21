import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useWorkflow } from '@/hooks';
import { WorkflowTemplate } from '@/services/WorkflowService';
import { ArrowRight, ChevronLeft, Copy, Loader2, Plus, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Workflow Templates page component
 */
const WorkflowTemplates: React.FC = () => {
  const navigate = useNavigate();
  const { getTemplates, createFromTemplate } = useWorkflow();
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedComplexity, setSelectedComplexity] = useState<string | null>(null);
  const [processingTemplateId, setProcessingTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await getTemplates();
        setTemplates(data);
      } catch (error) {
        console.error('Failed to load templates:', error);
        toast.error('Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [getTemplates]);

  // Filter templates based on search query and filters
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory ? template.category === selectedCategory : true;
    const matchesComplexity = selectedComplexity
      ? template.complexity === selectedComplexity
      : true;

    return matchesSearch && matchesCategory && matchesComplexity;
  });

  // Get unique categories and complexities
  const categories = Array.from(new Set(templates.map((template) => template.category)));
  const complexities = Array.from(new Set(templates.map((template) => template.complexity)));

  // Handle use template
  const handleUseTemplate = async (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setProcessingTemplateId(templateId);
    try {
      const newWorkflow = await createFromTemplate(templateId, `${template.name} (Copy)`);
      toast.success('Workflow created from template');
      navigate(`/workflows/builder?id=${newWorkflow.id}`);
    } catch (error) {
      console.error('Failed to create workflow from template:', error);
      toast.error('Failed to use template');
    } finally {
      setProcessingTemplateId(null);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/workflows')}
                className="mr-4 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Workflow Templates</h1>
                <p className="text-muted-foreground">Start with a pre-built workflow template</p>
              </div>
            </div>

            <Button asChild>
              <Link to="/workflows/builder">
                <Plus className="h-4 w-4 mr-2" />
                Create from Scratch
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-64 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Filters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Category</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            id="category-all"
                            type="radio"
                            name="category"
                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                            checked={selectedCategory === null}
                            onChange={() => setSelectedCategory(null)}
                          />
                          <label htmlFor="category-all" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            All Categories
                          </label>
                        </div>

                        {categories.map((category) => (
                          <div key={category} className="flex items-center">
                            <input
                              id={`category-${category}`}
                              type="radio"
                              name="category"
                              className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                              checked={selectedCategory === category}
                              onChange={() => setSelectedCategory(category)}
                            />
                            <label
                              htmlFor={`category-${category}`}
                              className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                            >
                              {category}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Complexity</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            id="complexity-all"
                            type="radio"
                            name="complexity"
                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                            checked={selectedComplexity === null}
                            onChange={() => setSelectedComplexity(null)}
                          />
                          <label htmlFor="complexity-all" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            All Complexities
                          </label>
                        </div>

                        {complexities.map((complexity) => (
                          <div key={complexity} className="flex items-center">
                            <input
                              id={`complexity-${complexity}`}
                              type="radio"
                              name="complexity"
                              className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                              checked={selectedComplexity === complexity}
                              onChange={() => setSelectedComplexity(complexity)}
                            />
                            <label
                              htmlFor={`complexity-${complexity}`}
                              className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize"
                            >
                              {complexity}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex-1">
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search templates..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {filteredTemplates.length === 0 ? (
                  <div className="bg-muted/50 border border-border rounded-md p-6 text-center">
                    <p className="text-muted-foreground">No templates match your search criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => (
                      <Card key={template.id} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg line-clamp-1" title={template.name}>
                              {template.name}
                            </CardTitle>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                template.complexity === 'low'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : template.complexity === 'medium'
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}
                            >
                              {template.complexity}
                            </span>
                          </div>
                          <CardDescription className="line-clamp-2 h-10">
                            {template.description}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="pb-2 grow">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span className="mr-4">Category: {template.category}</span>
                            <span>Popularity: <span className="capitalize">{template.popularity}</span></span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <span className="mr-4">Nodes: {template.nodes.length}</span>
                            <span>Connections: {template.edges.length}</span>
                          </div>
                        </CardContent>

                        <CardFooter className="flex justify-between pt-4 border-t border-border">
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full"
                            onClick={() => handleUseTemplate(template.id)}
                            disabled={processingTemplateId === template.id}
                          >
                            {processingTemplateId === template.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Use Template
                              </>
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WorkflowTemplates;
