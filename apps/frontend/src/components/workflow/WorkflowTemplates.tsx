import React, { useState } from 'react';
import { useReactFlow } from 'reactflow';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileTemplate, Plus, Copy, ArrowRight } from 'lucide-react';

// Template categories
const TEMPLATE_CATEGORIES = [
  'Basic',
  'Agent Collaboration',
  'Data Processing',
  'Integration',
  'Custom'
];

// Template definitions
const WORKFLOW_TEMPLATES = [
  {
    id: 'simple-agent-task',
    name: 'Simple Agent Task',
    description: 'A simple workflow with an input, agent, and output node.',
    category: 'Basic',
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 100 },
        data: { name: 'Input', type: 'input' }
      },
      {
        id: 'agent-1',
        type: 'agent',
        position: { x: 300, y: 100 },
        data: { name: 'Agent', type: 'agent' }
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 500, y: 100 },
        data: { name: 'Output', type: 'output' }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'input-1', target: 'agent-1' },
      { id: 'e2-3', source: 'agent-1', target: 'output-1' }
    ]
  },
  {
    id: 'agent-collaboration',
    name: 'Agent Collaboration',
    description: 'A workflow with two agents collaborating via A2A communication.',
    category: 'Agent Collaboration',
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 100 },
        data: { name: 'Input', type: 'input' }
      },
      {
        id: 'agent-1',
        type: 'agent',
        position: { x: 300, y: 50 },
        data: { name: 'Agent 1', type: 'agent' }
      },
      {
        id: 'agent-2',
        type: 'agent',
        position: { x: 300, y: 150 },
        data: { name: 'Agent 2', type: 'agent' }
      },
      {
        id: 'a2a-1',
        type: 'a2a',
        position: { x: 500, y: 100 },
        data: { name: 'A2A Communication', type: 'a2a' }
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 700, y: 100 },
        data: { name: 'Output', type: 'output' }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'input-1', target: 'agent-1' },
      { id: 'e1-3', source: 'input-1', target: 'agent-2' },
      { id: 'e2-4', source: 'agent-1', target: 'a2a-1' },
      { id: 'e3-4', source: 'agent-2', target: 'a2a-1' },
      { id: 'e4-5', source: 'a2a-1', target: 'output-1' }
    ]
  },
  {
    id: 'data-processing',
    name: 'Data Processing Pipeline',
    description: 'A workflow for processing and transforming data.',
    category: 'Data Processing',
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 100 },
        data: { name: 'Data Input', type: 'input' }
      },
      {
        id: 'transform-1',
        type: 'transform',
        position: { x: 300, y: 100 },
        data: { name: 'Data Transformation', type: 'transform' }
      },
      {
        id: 'mcpTool-1',
        type: 'mcpTool',
        position: { x: 500, y: 100 },
        data: { name: 'Data Processing Tool', type: 'mcpTool' }
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 700, y: 100 },
        data: { name: 'Processed Output', type: 'output' }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'input-1', target: 'transform-1' },
      { id: 'e2-3', source: 'transform-1', target: 'mcpTool-1' },
      { id: 'e3-4', source: 'mcpTool-1', target: 'output-1' }
    ]
  },
  {
    id: 'conditional-workflow',
    name: 'Conditional Workflow',
    description: 'A workflow with conditional branching based on input data.',
    category: 'Basic',
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 100 },
        data: { name: 'Input', type: 'input' }
      },
      {
        id: 'condition-1',
        type: 'condition',
        position: { x: 300, y: 100 },
        data: { name: 'Condition', type: 'condition' }
      },
      {
        id: 'agent-1',
        type: 'agent',
        position: { x: 500, y: 50 },
        data: { name: 'Agent A', type: 'agent' }
      },
      {
        id: 'agent-2',
        type: 'agent',
        position: { x: 500, y: 150 },
        data: { name: 'Agent B', type: 'agent' }
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 700, y: 100 },
        data: { name: 'Output', type: 'output' }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'input-1', target: 'condition-1' },
      { id: 'e2-3', source: 'condition-1', target: 'agent-1', sourceHandle: 'true', targetHandle: 'default' },
      { id: 'e2-4', source: 'condition-1', target: 'agent-2', sourceHandle: 'false', targetHandle: 'default' },
      { id: 'e3-5', source: 'agent-1', target: 'output-1' },
      { id: 'e4-5', source: 'agent-2', target: 'output-1' }
    ]
  },
  {
    id: 'api-integration',
    name: 'API Integration',
    description: 'A workflow for integrating with external APIs.',
    category: 'Integration',
    nodes: [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 100 },
        data: { name: 'Request Input', type: 'input' }
      },
      {
        id: 'transform-1',
        type: 'transform',
        position: { x: 300, y: 100 },
        data: { name: 'Request Transformation', type: 'transform' }
      },
      {
        id: 'mcpTool-1',
        type: 'mcpTool',
        position: { x: 500, y: 100 },
        data: { name: 'API Client', type: 'mcpTool' }
      },
      {
        id: 'transform-2',
        type: 'transform',
        position: { x: 700, y: 100 },
        data: { name: 'Response Transformation', type: 'transform' }
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 900, y: 100 },
        data: { name: 'API Response', type: 'output' }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'input-1', target: 'transform-1' },
      { id: 'e2-3', source: 'transform-1', target: 'mcpTool-1' },
      { id: 'e3-4', source: 'mcpTool-1', target: 'transform-2' },
      { id: 'e4-5', source: 'transform-2', target: 'output-1' }
    ]
  }
];

interface WorkflowTemplatesProps {
  onApplyTemplate: (template: any) => void;
}

export const WorkflowTemplates: React.React.FC<WorkflowTemplatesProps> = ({ onApplyTemplate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Basic');
  
  // Filter templates by category
  const filteredTemplates = WORKFLOW_TEMPLATES.filter(templat(e: any) => 
    template.category === selectedCategory
  );
  
  // Apply template and close dialog
  const applyTemplate = (template: any) => {
    onApplyTemplate(template);
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
          <DialogDescription>
            Choose a template to quickly create a new workflow.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-5 mb-4">
            {TEMPLATE_CATEGORIES.map(category => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {TEMPLATE_CATEGORIES.map(category => (
            <TabsContent key={category} value={category} className="mt-0">
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.map(templat(e: any) => (
                    <Card key={template.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pb-2">
                        <div className="bg-muted rounded-md p-2 h-32 flex items-center justify-center text-muted-foreground text-sm">
                          <div className="text-center">
                            <div className="font-mono text-xs mb-1">
                              {template.nodes.length} nodes, {template.edges.length} connections
                            </div>
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <Plus className="h-4 w-4 text-primary" />
                              </div>
                              <ArrowRight className="h-4 w-4" />
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                {template.nodes.length}
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
