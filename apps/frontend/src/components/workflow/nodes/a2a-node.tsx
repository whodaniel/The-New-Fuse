import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node';

/**
 * A2A Node Component
 *
 * This component represents an Agent-to-Agent communication node in the workflow.
 * It allows configuring communication between agents using the A2A protocol.
 */
const A2ANode: React.FC<NodeProps> = memo(({ id, data }) => {
  // Get config from data or initialize with defaults
  const config = data.config || {};

  // Handle agent selection
  const handleAgentChange = (agentId: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          agentId,
        },
      });
    }
  };

  // Handle communication pattern change
  const handlePatternChange = (pattern: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          communicationPattern: pattern,
        },
      });
    }
  };

  // Handle message type change
  const handleMessageTypeChange = (messageType: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          messageType,
        },
      });
    }
  };

  // Handle timeout change
  const handleTimeoutChange = (timeout: number) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          timeout,
        },
      });
    }
  };

  // Handle retry count change
  const handleRetryCountChange = (retryCount: number) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          retryCount,
        },
      });
    }
  };

  // Handle priority change
  const handlePriorityChange = (priority: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          priority,
        },
      });
    }
  };

  // Handle payload template change
  const handlePayloadTemplateChange = (payloadTemplate: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...config,
          payloadTemplate,
        },
      });
    }
  };

  // Input and output handles
  const inputHandles = [
    { id: 'input', label: 'Input' },
    { id: 'context', label: 'Context' },
  ];

  const outputHandles = [
    { id: 'result', label: 'Result' },
    { id: 'error', label: 'Error' },
    { id: 'status', label: 'Status' },
  ];

  // Render node content
  const renderContent = () => (
    <div className="space-y-3">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-700 border-slate-600">
          <TabsTrigger
            value="basic"
            className="text-xs data-[state=active]:bg-slate-600 data-[state=active]:text-white"
          >
            Basic
          </TabsTrigger>
          <TabsTrigger
            value="advanced"
            className="text-xs data-[state=active]:bg-slate-600 data-[state=active]:text-white"
          >
            Advanced
          </TabsTrigger>
          <TabsTrigger
            value="payload"
            className="text-xs data-[state=active]:bg-slate-600 data-[state=active]:text-white"
          >
            Payload
          </TabsTrigger>
          <TabsTrigger
            value="protocol"
            className="text-xs data-[state=active]:bg-slate-600 data-[state=active]:text-white"
          >
            Protocol
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor={`agent-select-${id}`} className="text-xs font-medium text-slate-200">
              Target Agent
            </Label>
            <Select value={config.agentId || ''} onValueChange={handleAgentChange}>
              <SelectTrigger
                id={`agent-select-${id}`}
                className="h-9 text-xs mt-1.5 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                <SelectValue placeholder="Select Agent" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {data.agents?.map((agent: any) => (
                  <SelectItem
                    key={agent.id}
                    value={agent.id}
                    className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                  >
                    {agent.name}
                  </SelectItem>
                )) || (
                  <>
                    <SelectItem
                      value="agent-1"
                      className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                    >
                      Code Assistant
                    </SelectItem>
                    <SelectItem
                      value="agent-2"
                      className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                    >
                      Data Analyzer
                    </SelectItem>
                    <SelectItem
                      value="agent-3"
                      className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                    >
                      Content Writer
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor={`pattern-select-${id}`} className="text-xs font-medium text-slate-200">
              Communication Pattern
            </Label>
            <Select
              value={config.communicationPattern || 'direct'}
              onValueChange={handlePatternChange}
            >
              <SelectTrigger
                id={`pattern-select-${id}`}
                className="h-9 text-xs mt-1.5 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                <SelectValue placeholder="Select pattern" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem
                  value="direct"
                  className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                >
                  Direct
                </SelectItem>
                <SelectItem
                  value="broadcast"
                  className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                >
                  Broadcast
                </SelectItem>
                <SelectItem
                  value="request-response"
                  className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                >
                  Request-Response
                </SelectItem>
                <SelectItem
                  value="publish-subscribe"
                  className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                >
                  Publish-Subscribe
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor={`message-type-${id}`} className="text-xs font-medium text-slate-200">
              Message Type
            </Label>
            <Select
              value={config.messageType || 'TASK_REQUEST'}
              onValueChange={handleMessageTypeChange}
            >
              <SelectTrigger
                id={`message-type-${id}`}
                className="h-9 text-xs mt-1.5 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                <SelectValue placeholder="Select message type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem
                  value="TASK_REQUEST"
                  className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                >
                  Task Request
                </SelectItem>
                <SelectItem
                  value="QUERY"
                  className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                >
                  Query
                </SelectItem>
                <SelectItem
                  value="NOTIFICATION"
                  className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                >
                  Notification
                </SelectItem>
                <SelectItem
                  value="STATUS_UPDATE"
                  className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                >
                  Status Update
                </SelectItem>
                <SelectItem
                  value="ERROR"
                  className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                >
                  Error
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor={`timeout-${id}`} className="text-xs font-medium text-slate-200">
              Timeout (ms)
            </Label>
            <Input
              id={`timeout-${id}`}
              type="number"
              className="h-9 text-xs bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              value={config.timeout || 30000}
              onChange={(e: any) => handleTimeoutChange(parseInt(e.target.value))}
              min={0}
              step={1000}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor={`retry-count-${id}`} className="text-xs font-medium text-slate-200">
              Retry Count
            </Label>
            <Input
              id={`retry-count-${id}`}
              type="number"
              className="h-9 text-xs bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              value={config.retryCount || 3}
              onChange={(e: any) => handleRetryCountChange(parseInt(e.target.value))}
              min={0}
              max={10}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor={`priority-${id}`} className="text-xs font-medium text-slate-200">
              Priority
            </Label>
            <Select value={config.priority || 'medium'} onValueChange={handlePriorityChange}>
              <SelectTrigger
                id={`priority-${id}`}
                className="h-9 text-xs mt-1.5 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem
                  value="low"
                  className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                >
                  Low
                </SelectItem>
                <SelectItem
                  value="medium"
                  className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                >
                  Medium
                </SelectItem>
                <SelectItem
                  value="high"
                  className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                >
                  High
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="payload" className="space-y-3">
          <div className="space-y-1">
            <Label
              htmlFor={`payload-template-${id}`}
              className="text-xs font-medium text-slate-200"
            >
              Payload Template
            </Label>
            <Textarea
              id={`payload-template-${id}`}
              className="h-32 text-xs font-mono resize-none bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              placeholder="Enter payload template in JSON format. Use {{variable}} for dynamic values."
              value={
                config.payloadTemplate || '{\n  "data": {{input}},\n  "context": {{context}}\n}'
              }
              onChange={(e: any) => handlePayloadTemplateChange(e.target.value)}
            />
            <p className="text-xs text-slate-300 leading-relaxed">
              Use {'{{ input }}'} and {'{{ context }}'} to reference input values.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="protocol" className="space-y-3">
          <div className="space-y-1">
            <Label
              htmlFor={`protocol-version-${id}`}
              className="text-xs font-medium text-slate-200"
            >
              Protocol Version
            </Label>
            <Select
              value={config.protocolVersion || '1.0'}
              onValueChange={(value) => {
                if (data.onUpdate) {
                  data.onUpdate({
                    config: {
                      ...config,
                      protocolVersion: value,
                    },
                  });
                }
              }}
            >
              <SelectTrigger
                id={`protocol-version-${id}`}
                className="h-9 text-xs mt-1.5 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                <SelectValue placeholder="Select protocol version" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem
                  value="1.0"
                  className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                >
                  A2A Protocol v1.0
                </SelectItem>
                <SelectItem
                  value="2.0"
                  className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                >
                  A2A Protocol v2.0
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-300 leading-relaxed">
              {config.protocolVersion === '2.0'
                ? 'v2.0 uses a header/body structure with enhanced metadata.'
                : 'v1.0 uses a flat message structure with basic metadata.'}
            </p>
          </div>

          <div className="space-y-1">
            <Label
              htmlFor={`message-encryption-${id}`}
              className="text-xs font-medium text-slate-200"
            >
              Message Encryption
            </Label>
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
                        enableEncryption: e.target.checked,
                      },
                    });
                  }
                }}
                className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor={`message-encryption-${id}`} className="text-xs text-slate-200">
                Enable end-to-end encryption
              </label>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
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
        renderContent,
      }}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
    />
  );
});

A2ANode.displayName = 'A2ANode';

export { A2ANode };
