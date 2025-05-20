import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './card.js';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './tabs.js';
import { WebhookConfigurationUI } from './WebhookConfigurationUI.js';
import { toast } from './toast.js';
import { Button } from './button.js';
import { ScrollArea } from './scroll-area.js';
import { Badge } from './badge.js';

interface MCPTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
  retryConfig?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

interface Props {
  tools: MCPTool[];
  webhooks: Record<string, WebhookConfig[]>;
  onExecuteTool: (tool: MCPTool, params: any) => Promise<void>;
  onRegisterWebhook: (toolName: string, config: WebhookConfig) => Promise<void>;
  onRemoveWebhook: (toolName: string, webhookId: string) => Promise<void>;
}

export function MCPToolsUI({
  tools,
  webhooks,
  onExecuteTool,
  onRegisterWebhook,
  onRemoveWebhook,
}: Props) {
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [params, setParams] = useState<Record<string, any>>({});

  const handleExecute = async () => {
    if (!selectedTool) return;

    try {
      await onExecuteTool(selectedTool, params);
      toast({
        title: "Success",
        description: "Tool executed successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">MCP Tools Dashboard</h1>

      <div className="grid grid-cols-12 gap-6">
        {/* Tools List */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Tools</CardTitle>
              <CardDescription>Select a tool to configure or execute</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {tools.map(tool => (
                    <Button
                      key={tool.name}
                      variant={selectedTool?.name === tool.name ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedTool(tool)}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{tool.name}</span>
                        <span className="text-sm text-muted-foreground">{tool.description}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Tool Configuration and Execution */}
        <div className="col-span-8">
          {selectedTool ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedTool.name}</CardTitle>
                <CardDescription>{selectedTool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="execute">
                  <TabsList className="mb-4">
                    <TabsTrigger value="execute">Execute Tool</TabsTrigger>
                    <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                  </TabsList>

                  <TabsContent value="execute">
                    <div className="space-y-4">
                      {Object.entries(selectedTool.parameters.properties).map(([key, schema]) => (
                        <div key={key} className="space-y-2">
                          <label className="text-sm font-medium">
                            {key}
                            {selectedTool.parameters.required?.includes(key) && (
                              <Badge variant="destructive" className="ml-2">Required</Badge>
                            )}
                          </label>
                          <input
                            type="text"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            placeholder={schema.description}
                            value={params[key] || ''}
                            onChange={e => setParams(prev => ({ ...prev, [key]: e.target.value }))}
                          />
                          {schema.description && (
                            <p className="text-xs text-muted-foreground">{schema.description}</p>
                          )}
                        </div>
                      ))}
                      <Button onClick={handleExecute} className="mt-4">Execute Tool</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="webhooks">
                    <WebhookConfigurationUI
                      toolName={selectedTool.name}
                      webhooks={webhooks[selectedTool.name] || []}
                      onRegisterWebhook={(config) => onRegisterWebhook(selectedTool.name, config)}
                      onRemoveWebhook={(webhookId) => onRemoveWebhook(selectedTool.name, webhookId)}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Tool Selected</CardTitle>
                <CardDescription>Select a tool from the list to get started</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}