import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, FileTemplate, Plus, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { WorkflowApiService, WorkflowTemplate } from '@/api/workflow';

// Template categories
const TEMPLATE_CATEGORIES = [
  'Basic',
  'Agent Collaboration',
  'Data Processing',
  'Integration',
  'Custom',
];

interface WorkflowTemplatesProps {
  onApplyTemplate: (template: any) => void;
}

export const WorkflowTemplates: React.FC<WorkflowTemplatesProps> = ({ onApplyTemplate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Basic');
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workflowApi = new WorkflowApiService();

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await workflowApi.getWorkflowTemplates();
      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        setError(response.error || 'Failed to fetch templates');
      }
    } catch (err) {
      setError('An error occurred while fetching templates');
    } finally {
      setLoading(false);
    }
  };

  // Filter templates by category
  const filteredTemplates = templates.filter(
    (template) => template.category === selectedCategory
  );

  // Apply template and close dialog
  const applyTemplate = (template: WorkflowTemplate) => {
    // Transform API template structure to what the builder expects if necessary
    // Assuming the API returns a 'definition' object with nodes and edges
    const builderTemplate = {
      ...template,
      nodes: template.definition.nodes,
      edges: template.definition.edges
    };
    onApplyTemplate(builderTemplate);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <FileTemplate className="h-4 w-4 mr-2" />
          Templates
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Workflow Templates</DialogTitle>
          <DialogDescription>Choose a template to quickly create a new workflow.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-5 mb-4">
            {TEMPLATE_CATEGORIES.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {TEMPLATE_CATEGORIES.map((category) => (
            <TabsContent key={category} value={category} className="mt-0">
              <ScrollArea className="h-[400px] pr-4">
                {loading ? (
                  <div className="flex justify-center items-center h-full min-h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                   <div className="text-center text-red-500 py-8">
                    {error}
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No templates found in this category.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates.map((template) => (
                      <Card key={template.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription>{template.description}</CardDescription>
                        </CardHeader>

                        <CardContent className="pb-2">
                          <div className="bg-muted rounded-md p-2 h-32 flex items-center justify-center text-muted-foreground text-sm">
                            <div className="text-center">
                              <div className="font-mono text-xs mb-1">
                                {template.definition.nodes.length} nodes, {template.definition.edges.length} connections
                              </div>
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                  <Plus className="h-4 w-4 text-primary" />
                                </div>
                                <ArrowRight className="h-4 w-4" />
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                  {template.definition.nodes.length}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>

                        <CardFooter>
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full"
                            onClick={() => applyTemplate(template)}
                          >
                            Use Template
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkflowTemplates;
