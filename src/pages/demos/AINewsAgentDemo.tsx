import React, { useState, useCallback } from 'react';
import { WorkflowCanvasProvider } from '../../components/features/workflow/components/WorkflowCanvas.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs.js';
import { Button } from '../../components/ui/button.js';
import { createAINewsAgentNode } from '../../components/nodes/AINewsAgentNode.js';
import { newsService } from '../../components/nodes/AINewsAgentNode/newsService.js';

/**
 * Example page that demonstrates integrating the AI News Agent
 * into a workflow with other nodes
 */
export const AINewsAgentDemo = () => {
  // Sample initial workflow with our AI News Agent node
  const [nodes, setNodes] = useState([
    // AI News Agent Node
    createAINewsAgentNode(300, 100),
    
    // Example: AI Processing Node that summarizes the latest news
    {
      id: 'summarizer-node',
      type: 'aiProcessingNode',
      position: { x: 300, y: 350 },
      data: {
        label: 'News Summarizer',
        config: {
          model: 'gpt-4',
          systemPrompt: 'You are an expert at summarizing AI news with clarity and insight.',
          promptTemplate: 'Please summarize the following AI news in a concise paragraph highlighting the most impactful developments:\n\n{{news}}',
        }
      }
    },
    
    // Example: Data Transform Node to format the output
    {
      id: 'formatter-node',
      type: 'dataTransformNode',
      position: { x: 300, y: 550 },
      data: {
        label: 'Newsletter Formatter',
        config: {
          transformation: 'function formatNewsletter(data) {\n  return {\n    title: "AI Weekly Roundup",\n    date: new Date().toLocaleDateString(),\n    content: data.summary,\n    sources: data.sources\n  };\n}'
        }
      }
    }
  ]);
  
  // Sample edges connecting the nodes
  const [edges, setEdges] = useState([
    {
      id: 'edge-news-to-summarizer',
      source: nodes[0].id,
      target: 'summarizer-node',
      animated: true,
    },
    {
      id: 'edge-summarizer-to-formatter',
      source: 'summarizer-node',
      target: 'formatter-node',
      animated: true,
    }
  ]);
  
  // Track which node is selected
  const [selectedNode, setSelectedNode] = useState(null);
  
  // Handle node selection
  const handleNodeSelect = useCallback((node) => {
    setSelectedNode(node);
    
    // If the AI News Agent node is selected, we can load its latest data
    if (node && node.type === 'aiNewsAgent') {
      // In a real app, we would load the latest data here
      console.log('AI News Agent node selected:', node);
    }
  }, []);
  
  // Handle manual refresh of the AI News Agent
  const handleRefresh = useCallback(async () => {
    if (selectedNode && selectedNode.type === 'aiNewsAgent') {
      const updatedNodes = nodes.map(node => {
        if (node.id === selectedNode.id) {
          // Set the node to busy state
          return {
            ...node,
            data: {
              ...node.data,
              status: 'busy'
            }
          };
        }
        return node;
      });
      
      setNodes(updatedNodes);
      
      try {
        // Fetch fresh news
        const newItems = await newsService.fetchLatestNews({
          sources: selectedNode.data.sources,
          keywords: selectedNode.data.keywords,
          maxItems: selectedNode.data.maxItems,
          since: selectedNode.data.lastUpdated
        });
        
        // Update the node with new data
        const refreshedNodes = updatedNodes.map(node => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                status: 'idle',
                newsItems: [...newItems, ...node.data.newsItems].slice(0, node.data.maxItems),
                lastUpdated: new Date().toISOString()
              }
            };
          }
          return node;
        });
        
        setNodes(refreshedNodes);
        setSelectedNode(refreshedNodes.find(n => n.id === selectedNode.id));
        
      } catch (error) {
        console.error('Error refreshing news:', error);
        
        // Set error state
        const errorNodes = updatedNodes.map(node => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                status: 'error'
              }
            };
          }
          return node;
        });
        
        setNodes(errorNodes);
      }
    }
  }, [selectedNode, nodes]);
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI News Agent Workflow Demo</CardTitle>
          <CardDescription>
            This demo showcases how the AI News Agent can be integrated into a workflow
            to automatically collect, process, and summarize the latest AI news.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="workflow">
            <TabsList className="mb-4">
              <TabsTrigger value="workflow">Workflow Builder</TabsTrigger>
              <TabsTrigger value="about">About This Demo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="workflow" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 border rounded-lg overflow-hidden" style={{ height: '600px' }}>
                  <WorkflowCanvasProvider
                    initialNodes={nodes}
                    initialEdges={edges}
                    onNodesChange={setNodes}
                    onEdgesChange={setEdges}
                    onNodeSelect={handleNodeSelect}
                  />
                </div>
                
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Selected Node</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedNode ? (
                        <div>
                          <h3 className="font-medium">{selectedNode.data.name || selectedNode.data.label}</h3>
                          <p className="text-sm text-gray-500">Type: {selectedNode.type}</p>
                          
                          {selectedNode.type === 'aiNewsAgent' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={handleRefresh}
                              disabled={selectedNode.data.status === 'busy'}
                              className="mt-2"
                            >
                              {selectedNode.data.status === 'busy' ? 'Updating...' : 'Refresh News'}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No node selected. Click on a node to view its details.</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Workflow Output</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        In a real application, the output of this workflow would be a formatted AI news newsletter.
                      </p>
                      <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-xs font-mono">
                        {
                          selectedNode?.data?.newsItems?.length > 0 
                            ? `AI Weekly Roundup\n${new Date().toLocaleDateString()}\n\n${
                                selectedNode.data.newsItems.slice(0, 3).map(item => `• ${item.title}`).join('\n')
                              }\n\n...and more`
                            : '// News output will appear here'
                        }
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="about">
              <div className="prose dark:prose-invert max-w-none">
                <h3>About the AI News Agent Workflow</h3>
                <p>
                  This demo showcases a workflow that automatically collects, processes, and formats the latest AI news.
                  The workflow consists of three nodes:
                </p>
                
                <ol>
                  <li>
                    <strong>AI News Agent</strong> - Collects and processes the latest AI news from various sources.
                    This agent runs on a scheduled basis and can also be manually triggered.
                  </li>
                  <li>
                    <strong>News Summarizer</strong> - An AI processing node that takes the collected news and
                    generates a concise summary highlighting the most important developments.
                  </li>
                  <li>
                    <strong>Newsletter Formatter</strong> - A data transformation node that formats the summary
                    into a structured newsletter format that can be shared or published.
                  </li>
                </ol>
                
                <h4>How It Works</h4>
                <p>
                  The AI News Agent is a specialized agent node that can be configured to monitor specific sources
                  and track specific keywords. It automatically collects and processes news on a scheduled basis,
                  and the collected news is passed to downstream nodes for further processing.
                </p>
                
                <p>
                  This demonstrates how The New Fuse platform enables the creation of sophisticated automated workflows
                  by combining different types of nodes, including specialized agent nodes that can perform complex tasks.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};