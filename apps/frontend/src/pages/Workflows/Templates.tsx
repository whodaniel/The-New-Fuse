import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkflow } from '@/hooks';
import { ChevronLeft, Search, Plus, Copy, ArrowRight } from 'lucide-react';

// Mock template data
const mockTemplates = [
  {
    id: 'template-1',
    name: 'Code Review',
    description: 'Automate code review process with AI agents',
    category: 'Development',
    complexity: 'Medium',
    popularity: 'High',
    nodeCount: 5,
    edgeCount: 6
  },
  {
    id: 'template-2',
    name: 'Data Analysis',
    description: 'Process and analyze data with AI agents',
    category: 'Data',
    complexity: 'High',
    popularity: 'Medium',
    nodeCount: 7,
    edgeCount: 9
  },
  {
    id: 'template-3',
    name: 'Content Generation',
    description: 'Generate content with AI agents',
    category: 'Content',
    complexity: 'Low',
    popularity: 'High',
    nodeCount: 3,
    edgeCount: 2
  },
  {
    id: 'template-4',
    name: 'Bug Triage',
    description: 'Automatically triage and categorize bugs',
    category: 'Development',
    complexity: 'Medium',
    popularity: 'Medium',
    nodeCount: 4,
    edgeCount: 5
  },
  {
    id: 'template-5',
    name: 'API Integration',
    description: 'Connect and integrate with external APIs',
    category: 'Integration',
    complexity: 'High',
    popularity: 'Medium',
    nodeCount: 6,
    edgeCount: 8
  },
  {
    id: 'template-6',
    name: 'Documentation Generator',
    description: 'Automatically generate documentation from code',
    category: 'Documentation',
    complexity: 'Medium',
    popularity: 'Low',
    nodeCount: 5,
    edgeCount: 4
  }
];

/**
 * Workflow Templates page component
 */
const WorkflowTemplates: React.FC = () => {
  const navigate = useNavigate();
  const { createWorkflow } = useWorkflow();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedComplexity, setSelectedComplexity] = useState<string | null>(null);

  // Filter templates based on search query and filters
  const filteredTemplates = mockTemplates.filter(templat(e: any) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory ? template.category === selectedCategory : true;
    const matchesComplexity = selectedComplexity ? template.complexity === selectedComplexity : true;

    return matchesSearch && matchesCategory && matchesComplexity;
  });

  // Get unique categories and complexities
  const categories = Array.from(new Set(mockTemplates.map(templat(e: any) => template.category)));
  const complexities = Array.from(new Set(mockTemplates.map(templat(e: any) => template.complexity)));

  // Handle use template
  const handleUseTemplate = (templateId: string) => {
    const template = mockTemplates.find(t => t.id === templateId);

    if (template) {
      const workflow = createWorkflow(`${template.name} Workflow`, template.description);
      navigate(`/workflows/builder?id=${workflow.id}`);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/workflows')}
                className="mr-4"
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
                        <label htmlFor="category-all" className="ml-2 text-sm text-gray-700">
                          All Categories
                        </label>
                      </div>

                      {categories.map(category => (
                        <div key={category} className="flex items-center">
                          <input
                            id={`category-${category}`}
                            type="radio"
                            name="category"
                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                            checked={selectedCategory === category}
                            onChange={() => setSelectedCategory(category)}
                          />
                          <label htmlFor={`category-${category}`} className="ml-2 text-sm text-gray-700">
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
                        <label htmlFor="complexity-all" className="ml-2 text-sm text-gray-700">
                          All Complexities
                        </label>
                      </div>

                      {complexities.map(complexity => (
                        <div key={complexity} className="flex items-center">
                          <input
                            id={`complexity-${complexity}`}
                            type="radio"
                            name="complexity"
                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                            checked={selectedComplexity === complexity}
                            onChange={() => setSelectedComplexity(complexity)}
                          />
                          <label htmlFor={`complexity-${complexity}`} className="ml-2 text-sm text-gray-700">
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
                <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
                  <p className="text-muted-foreground">No templates match your search criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map(templat(e: any) => (
                    <Card key={template.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle>{template.name}</CardTitle>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            template.complexity === 'Low' ? 'bg-green-100 text-green-700' :
                            template.complexity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {template.complexity}
                          </span>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {template.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pb-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span className="mr-4">Category: {template.category}</span>
                          <span>Popularity: {template.popularity}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <span className="mr-4">Nodes: {template.nodeCount}</span>
                          <span>Connections: {template.edgeCount}</span>
                        </div>
                      </CardContent>

                      <CardFooter className="flex justify-between">
                        <Button variant="outline" size="sm" onClick={() => handleUseTemplate(template.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Use Template
                        </Button>

                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/workflows/templates/${template.id}`}>
                            Preview
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkflowTemplates;
