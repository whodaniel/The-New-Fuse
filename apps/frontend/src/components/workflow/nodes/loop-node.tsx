import React, { memo, useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node.js';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Repeat, Play, ChevronDown, ChevronUp } from 'lucide-react';

const LoopNode: React.React.FC<NodeProps> = memo(({ id, data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  
  const config = data.config || {};
  
  // Handle loop type change
  const handleLoopTypeChange = (loopType: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          loopType
        }
      });
    }
  };
  
  // Handle iteration count change
  const handleIterationCountChange = (count: string) => {
    const iterationCount = parseInt(count, 10);
    
    if (!isNaN(iterationCount) && iterationCount > 0) {
      if (data.onUpdate) {
        data.onUpdate({
          config: {
            ...config,
            iterationCount
          }
        });
      }
    }
  };
  
  // Handle collection path change
  const handleCollectionPathChange = (path: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          collectionPath: path
        }
      });
    }
  };
  
  // Handle condition code change
  const handleConditionCodeChange = (code: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          conditionCode: code
        }
      });
    }
  };
  
  // Handle item variable name change
  const handleItemVariableChange = (name: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          itemVariable: name
        }
      });
    }
  };
  
  // Handle index variable name change
  const handleIndexVariableChange = (name: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          indexVariable: name
        }
      });
    }
  };
  
  // Test loop condition
  const testLoopCondition = () => {
    try {
      if (config.loopType === 'condition') {
        // Test condition code
        const conditionFn = new Function('input', 'index', config.conditionCode || 'return false;');
        const result = conditionFn({}, 0);
        
        setTestResult({
          success: true,
          result,
          message: `Condition evaluated to: ${result}`
        });
      } else if (config.loopType === 'collection') {
        // Test collection path
        const mockInput = { items: [1, 2, 3] };
        const path = config.collectionPath || 'items';
        const parts = path.split('.');
        
        let collection = mockInput;
        for (const part of parts) {
          if (collection && typeof collection === 'object' && part in collection) {
            collection = collection[part];
          } else {
            collection = undefined;
            break;
          }
        }
        
        if (Array.isArray(collection)) {
          setTestResult({
            success: true,
            result: collection,
            message: `Found collection with ${collection.length} items`
          });
        } else {
          setTestResult({
            success: false,
            message: `Path "${path}" does not resolve to an array`
          });
        }
      } else {
        // Test iteration count
        const count = config.iterationCount || 0;
        
        setTestResult({
          success: true,
          result: count,
          message: `Will iterate ${count} times`
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
  
  // Input and output handles
  const inputHandles = [
    { id: 'input', label: 'Input' }
  ];
  
  const outputHandles = [
    { id: 'body', label: 'Body' },
    { id: 'completed', label: 'Completed' }
  ];
  
  // Render node content
  const renderContent = () => (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor={`loop-type-${id}`} className="text-xs">Loop Type</Label>
        <Select
          value={config.loopType || 'count'}
          onValueChange={handleLoopTypeChange}
        >
          <SelectTrigger id={`loop-type-${id}`} className="text-xs h-7">
            <SelectValue placeholder="Select loop type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="count" className="text-xs">Count (For Loop)</SelectItem>
            <SelectItem value="collection" className="text-xs">Collection (ForEach)</SelectItem>
            <SelectItem value="condition" className="text-xs">Condition (While)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 px-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="h-3 w-3 mr-1" />
          ) : (
            <ChevronDown className="h-3 w-3 mr-1" />
          )}
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={testLoopCondition}
        >
          <Play className="h-3 w-3 mr-1" />
          Test
        </Button>
      </div>
      
      {isExpanded && (
        <Tabs defaultValue={config.loopType || 'count'} onValueChange={handleLoopTypeChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="count">Count</TabsTrigger>
            <TabsTrigger value="collection">Collection</TabsTrigger>
            <TabsTrigger value="condition">Condition</TabsTrigger>
          </TabsList>
          
          <TabsContent value="count" className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor={`iteration-count-${id}`} className="text-xs">Iteration Count</Label>
              <Input
                id={`iteration-count-${id}`}
                type="number"
                min="1"
                className="text-xs h-7"
                value={config.iterationCount || 1}
                onChange={(e: any) => handleIterationCountChange(e.target.value)}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor={`index-variable-${id}`} className="text-xs">Index Variable Name</Label>
              <Input
                id={`index-variable-${id}`}
                className="text-xs h-7"
                value={config.indexVariable || 'index'}
                onChange={(e: any) => handleIndexVariableChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Variable name for the current iteration index.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="collection" className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor={`collection-path-${id}`} className="text-xs">Collection Path</Label>
              <Input
                id={`collection-path-${id}`}
                className="text-xs h-7"
                value={config.collectionPath || 'items'}
                onChange={(e: any) => handleCollectionPathChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Path to the collection in the input object (e.g., "data.items").
              </p>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor={`item-variable-${id}`} className="text-xs">Item Variable Name</Label>
              <Input
                id={`item-variable-${id}`}
                className="text-xs h-7"
                value={config.itemVariable || 'item'}
                onChange={(e: any) => handleItemVariableChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Variable name for the current collection item.
              </p>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor={`index-variable-collection-${id}`} className="text-xs">Index Variable Name</Label>
              <Input
                id={`index-variable-collection-${id}`}
                className="text-xs h-7"
                value={config.indexVariable || 'index'}
                onChange={(e: any) => handleIndexVariableChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Variable name for the current iteration index.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="condition" className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor={`condition-code-${id}`} className="text-xs">Condition Code</Label>
              <Textarea
                id={`condition-code-${id}`}
                className="font-mono text-xs h-20"
                placeholder="return index < 10;"
                value={config.conditionCode || 'return index < 10;'}
                onChange={(e: any) => handleConditionCodeChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                JavaScript code that returns a boolean. The loop continues while this condition is true.
              </p>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor={`index-variable-condition-${id}`} className="text-xs">Index Variable Name</Label>
              <Input
                id={`index-variable-condition-${id}`}
                className="text-xs h-7"
                value={config.indexVariable || 'index'}
                onChange={(e: any) => handleIndexVariableChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Variable name for the current iteration index.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      )}
      
      {testResult && (
        <div className={`text-xs p-2 rounded-md ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {testResult.message}
        </div>
      )}
    </div>
  );
  
  return (
    <BaseNode
      id={id}
      data={{
        ...data,
        name: data.name || 'Loop',
        type: 'loop',
        renderContent
      }}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
    />
  );
});

LoopNode.displayName = 'LoopNode';

export { LoopNode };
