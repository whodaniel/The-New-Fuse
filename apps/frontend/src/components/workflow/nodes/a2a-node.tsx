import React, { memo, useState, useEffect } from 'react';
import { a2aProtocolService } from '@/services/A2AProtocolService';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node.js';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * A2A Node Component
 *
 * This component represents an Agent-to-Agent communication node in the workflow.
 * It allows configuring communication between agents using the A2A protocol.
 */
const A2ANode: React.React.FC<NodeProps> = memo(({ id, data }) => {
  // Get config from data or initialize with defaults
  const config = data.config || {};

  // Handle agent selection
  const handleAgentChange = (agentId: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          agentId
        }
      });
    }
  };

  // Handle communication pattern change
  const handlePatternChange = (pattern: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          communicationPattern: pattern
        }
      });
    }
  };

  // Handle message type change
  const handleMessageTypeChange = (messageType: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          messageType
        }
      });
    }
  };

  // Handle timeout change
  const handleTimeoutChange = (timeout: number) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          timeout
        }
      });
    }
  };

  // Handle retry count change
  const handleRetryCountChange = (retryCount: number) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          retryCount
        }
      });
    }
  };

  // Handle priority change
  const handlePriorityChange = (priority: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          priority
        }
      });
    }
  };

  // Handle payload template change
  const handlePayloadTemplateChange = (payloadTemplate: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          payloadTemplate
        }
      });
    }
  };

  // Input and output handles
  const inputHandles = [
    { id: 'input', label: 'Input' },
    { id: 'context', label: 'Context' }
  ];

  const outputHandles = [
    { id: 'result', label: 'Result' },
    { id: 'error', label: 'Error' },
    { id: 'status', label: 'Status' }
  ];

  // Render node content
  const renderContent = () => (
    <div className="space-y-3">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="payload">Payload</TabsTrigger>
          <TabsTrigger value="protocol">Protocol</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor={`agent-select-${id}`} className="text-xs">Target Agent</Label>
            <select
              id={`agent-select-${id}`}
              className="w-full text-xs h-8 rounded-md border border-input"
              value={config.agentId || ''}
              onChange={(e: any) => handleAgentChange(e.target.value)}
            >
              <option value="">Select Agent</option>
              {data.agents?.map((agent: any) => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              )) || (
                <>
                  <option value="agent-1">Code Assistant</option>
                  <option value="agent-2">Data Analyzer</option>
                  <option value="agent-3">Content Writer</option>
                </>
              )}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor={`pattern-select-${id}`} className="text-xs">Communication Pattern</Label>
            <select
              id={`pattern-select-${id}`}
              className="w-full text-xs h-8 rounded-md border border-input"
              value={config.communicationPattern || 'direct'}
              onChange={(e: any) => handlePatternChange(e.target.value)}
            >
              <option value="direct">Direct</option>
              <option value="broadcast">Broadcast</option>
              <option value="request-response">Request-Response</option>
              <option value="publish-subscribe">Publish-Subscribe</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor={`message-type-${id}`} className="text-xs">Message Type</Label>
            <select
              id={`message-type-${id}`}
              className="w-full text-xs h-8 rounded-md border border-input"
              value={config.messageType || 'TASK_REQUEST'}
              onChange={(e: any) => handleMessageTypeChange(e.target.value)}
            >
              <option value="TASK_REQUEST">Task Request</option>
              <option value="QUERY">Query</option>
              <option value="NOTIFICATION">Notification</option>
              <option value="STATUS_UPDATE">Status Update</option>
              <option value="ERROR">Error</option>
            </select>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor={`timeout-${id}`} className="text-xs">Timeout (ms)</Label>
            <Input
              id={`timeout-${id}`}
              type="number"
              className="h-7 text-xs"
              value={config.timeout || 30000}
              onChange={(e: any) => handleTimeoutChange(parseInt(e.target.value))}
              min={0}
              step={1000}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor={`retry-count-${id}`} className="text-xs">Retry Count</Label>
            <Input
              id={`retry-count-${id}`}
              type="number"
              className="h-7 text-xs"
              value={config.retryCount || 3}
              onChange={(e: any) => handleRetryCountChange(parseInt(e.target.value))}
              min={0}
              max={10}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor={`priority-${id}`} className="text-xs">Priority</Label>
            <select
              id={`priority-${id}`}
              className="w-full text-xs h-8 rounded-md border border-input"
              value={config.priority || 'medium'}
              onChange={(e: any) => handlePriorityChange(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </TabsContent>

        <TabsContent value="payload" className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor={`payload-template-${id}`} className="text-xs">Payload Template</Label>
            <Textarea
              id={`payload-template-${id}`}
              className="h-32 text-xs font-mono resize-none"
              placeholder="Enter payload template in JSON format. Use {{variable}} for dynamic values."
              value={config.payloadTemplate || '{\n  "data": {{input}},\n  "context": {{context}}\n}'}
              onChange={(e: any) => handlePayloadTemplateChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use {{input}} and {{context}} to reference input values.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="protocol" className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor={`protocol-version-${id}`} className="text-xs">Protocol Version</Label>
            <select
              id={`protocol-version-${id}`}
              className="w-full text-xs h-8 rounded-md border border-input"
              value={config.protocolVersion || '1.0'}
              onChange={(e: any) => {
                if (data.onUpdate) {
                  data.onUpdate({
                    config: {
                      ...config,
                      protocolVersion: e.target.value
                    }
                  });
                }
              }}
            >
              <option value="1.0">A2A Protocol v1.0</option>
              <option value="2.0">A2A Protocol v2.0</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {config.protocolVersion === '2.0' ?
                'v2.0 uses a header/body structure with enhanced metadata.' :
                'v1.0 uses a flat message structure with basic metadata.'}
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor={`message-encryption-${id}`} className="text-xs">Message Encryption</Label>
            <div className="flex items-center space-x-2">
              <input
                id={`message-encryption-${id}`}
                type="checkbox"
                checked={config.enableEncryption || false}
                onChange={(e: any) => {
                  if (data.onUpdate) {
                    data.onUpdate({
                      config: {
                        ...config,
                        enableEncryption: e.target.checked
                      }
                    });
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
              />
              <label htmlFor={`message-encryption-${id}`} className="text-xs">
                Enable end-to-end encryption
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Encrypts message content for secure agent-to-agent communication.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <BaseNode
      id={id}
      data={{
        ...data,
        name: data.name || 'A2A Communication',
        type: 'a2a',
        renderContent
      }}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
    />
  );
});

A2ANode.displayName = 'A2ANode';

export { A2ANode };
