import React, { useState, useEffect } from 'react';
import { useReactFlow } from 'reactflow';
import { workflowExecutionService, DebugOptions } from '@/services/WorkflowExecutionService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, SkipForward, Bug, X } from 'lucide-react';

interface WorkflowDebuggerProps {
  workflowId: string;
}

export const WorkflowDebugger: React.React.FC<WorkflowDebuggerProps> = ({ workflowId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugOptions, setDebugOptions] = useState<DebugOptions>(workflowExecutionService.getDebugOptions());
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const { getNodes, setNodes } = useReactFlow();
  
  // Update debug options
  const updateDebugOptions = (options: Partial<DebugOptions>) => {
    const newOptions = {
      ...debugOptions,
      ...options
    };
    
    setDebugOptions(newOptions);
    workflowExecutionService.setDebugOptions(newOptions);
  };
  
  // Toggle debug mode
  const toggleDebugMode = () => {
    updateDebugOptions({ enabled: !debugOptions.enabled });
  };
  
  // Toggle step-by-step execution
  const toggleStepByStep = () => {
    updateDebugOptions({ stepByStep: !debugOptions.stepByStep });
  };
  
  // Continue execution
  const continueExecution = () => {
    workflowExecutionService.continueExecution();
  };
  
  // Toggle breakpoint for a node
  const toggleBreakpoint = (nodeId: string) => {
    const breakpoints = [...debugOptions.breakpoints];
    const index = breakpoints.indexOf(nodeId);
    
    if (index === -1) {
      breakpoints.push(nodeId);
    } else {
      breakpoints.splice(index, 1);
    }
    
    updateDebugOptions({ breakpoints });
    
    // Update node UI
    setNodes(nodes => 
      nodes.map(nod(e: any) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              debug: {
                ...node.data?.debug,
                breakpoint: index === -1
              }
            }
          };
        }
        return node;
      })
    );
  };
  
  // Set log level
  const setLogLevel = (level: 'error' | 'warn' | 'info' | 'debug' | 'trace') => {
    updateDebugOptions({ logLevel: level });
  };
  
  // Get nodes for breakpoint selection
  const nodes = getNodes();
  
  return (
    <>
      {/* Debug toggle button */}
      <div className="absolute bottom-4 left-4">
        <Button
          variant={isOpen ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8 p-0"
        >
          <Bug className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Debug panel */}
      {isOpen && (
        <Card className="absolute bottom-14 left-4 w-80 shadow-lg">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">Workflow Debugger</CardTitle>
              <CardDescription>Debug and step through workflow execution</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="debug-mode" className="text-sm">Debug Mode</Label>
              <Switch
                id="debug-mode"
                checked={debugOptions.enabled}
                onCheckedChange={toggleDebugMode}
              />
            </div>
            
            {debugOptions.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="step-by-step" className="text-sm">Step-by-Step Execution</Label>
                  <Switch
                    id="step-by-step"
                    checked={debugOptions.stepByStep}
                    onCheckedChange={toggleStepByStep}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Log Level</Label>
                  <div className="grid grid-cols-5 gap-1">
                    {['error', 'warn', 'info', 'debug', 'trace'].map(level => (
                      <Button
                        key={level}
                        variant={debugOptions.logLevel === level ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => setLogLevel(level as any)}
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <Tabs defaultValue="breakpoints">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="breakpoints">Breakpoints</TabsTrigger>
                    <TabsTrigger value="controls">Controls</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="breakpoints" className="space-y-2">
                    <Label className="text-sm">Set Breakpoints</Label>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {nodes.map(nod(e: any) => (
                        <div key={node.id} className="flex items-center justify-between">
                          <span className="text-xs">{node.data?.name || node.type} ({node.id})</span>
                          <Switch
                            checked={debugOptions.breakpoints.includes(node.id)}
                            onCheckedChange={() => toggleBreakpoint(node.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="controls" className="space-y-2">
                    <Label className="text-sm">Execution Controls</Label>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={continueExecution}
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Continue
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={continueExecution}
                        className="flex-1"
                      >
                        <SkipForward className="h-4 w-4 mr-1" />
                        Step
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default WorkflowDebugger;
