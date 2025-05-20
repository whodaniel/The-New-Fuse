import React, { memo, useEffect, useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node.js';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMcpTools, MCPServer, MCPTool } from '@/hooks';

const MCPToolNode: React.React.FC<NodeProps> = memo(({ id, data }) => {
  const { servers, tools, loading } = useMcpTools();
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null);
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, any>>({});

  // Load selected server and tool
  useEffect(() => {
    if (data.config?.mcpServer && servers.length > 0) {
      const server = servers.find(s => s.name === data.config.mcpServer);
      if (server) {
        setSelectedServer(server);

        if (data.config?.mcpTool) {
          const tool = server.tools.find(t => t.name === data.config.mcpTool);
          if (tool) {
            setSelectedTool(tool);
            setParamValues(data.config.parameters || {});
          }
        }
      }
    }
  }, [data.config, servers]);

  // Handle server selection change
  const handleServerChange = (serverName: string) => {
    const server = servers.find(s => s.name === serverName);
    setSelectedServer(server || null);
    setSelectedTool(null);
    setParamValues({});

    if (data.onUpdate) {
      data.onUpdate({
        name: server ? `${server.name} Tool` : 'MCP Tool',
        config: {
          ...data.config,
          mcpServer: serverName,
          mcpTool: '',
          parameters: {}
        }
      });
    }
  };

  // Handle tool selection change
  const handleToolChange = (toolName: string) => {
    if (!selectedServer) return;

    const tool = selectedServer.tools.find(t => t.name === toolName);
    setSelectedTool(tool || null);

    // Initialize default parameter values
    const initialParams: Record<string, any> = {};
    if (tool?.parameters) {
      Object.entries(tool.parameters).forEach(([key, param]) => {
        if (param.default !== undefined) {
          initialParams[key] = param.default;
        } else {
          // Initialize with empty values based on type
          switch (param.type) {
            case 'string':
              initialParams[key] = '';
              break;
            case 'number':
              initialParams[key] = 0;
              break;
            case 'boolean':
              initialParams[key] = false;
              break;
            case 'object':
              initialParams[key] = {};
              break;
            case 'array':
              initialParams[key] = [];
              break;
            default:
              initialParams[key] = '';
          }
        }
      });
    }

    setParamValues(initialParams);

    if (data.onUpdate) {
      data.onUpdate({
        name: tool ? tool.name : 'MCP Tool',
        config: {
          ...data.config,
          mcpTool: toolName,
          parameters: initialParams
        }
      });
    }
  };

  // Handle parameter value change
  const handleParamChange = (paramName: string, value: any) => {
    const updatedParams = {
      ...paramValues,
      [paramName]: value
    };

    setParamValues(updatedParams);

    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          parameters: updatedParams
        }
      });
    }
  };

  // Render parameter input based on parameter type
  const renderParamInput = (paramName: string, paramConfig: any) => {
    const value = paramValues[paramName];

    switch (paramConfig.type) {
      case 'string':
        return (
          <Input
            id={`param-${id}-${paramName}`}
            value={value || ''}
            onChange={(e: any) => handleParamChange(paramName, e.target.value)}
            placeholder={paramConfig.description || paramName}
            className="h-7 text-xs"
          />
        );
      case 'number':
        return (
          <Input
            id={`param-${id}-${paramName}`}
            type="number"
            value={value}
            onChange={(e: any) => handleParamChange(paramName, parseFloat(e.target.value))}
            placeholder={paramConfig.description || paramName}
            className="h-7 text-xs"
          />
        );
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              id={`param-${id}-${paramName}`}
              type="checkbox"
              checked={value}
              onChange={(e: any) => handleParamChange(paramName, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
            />
            <label htmlFor={`param-${id}-${paramName}`} className="text-xs">
              {paramConfig.description || paramName}
            </label>
          </div>
        );
      case 'object':
      case 'array':
        return (
          <Textarea
            id={`param-${id}-${paramName}`}
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e: any) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleParamChange(paramName, parsed);
              } catch {
                handleParamChange(paramName, e.target.value);
              }
            }}
            placeholder={paramConfig.description || paramName}
            className="h-16 text-xs"
          />
        );
      default:
        return (
          <Input
            id={`param-${id}-${paramName}`}
            value={value || ''}
            onChange={(e: any) => handleParamChange(paramName, e.target.value)}
            placeholder={paramConfig.description || paramName}
            className="h-7 text-xs"
          />
        );
    }
  };

  const inputHandles = [
    { id: 'default', label: 'Input' }
  ];

  const outputHandles = [
    { id: 'default', label: 'Output' },
    { id: 'error', label: 'Error' }
  ];

  const renderContent = () => (
    <div className="space-y-3">
      <div>
        <Label htmlFor={`server-${id}`} className="text-xs">MCP Server</Label>
        <Select
          value={data.config?.mcpServer || ''}
          onValueChange={handleServerChange}
          disabled={loading}
        >
          <SelectTrigger id={`server-${id}`} className="text-xs h-7 mt-1">
            <SelectValue placeholder="Select server" />
          </SelectTrigger>
          <SelectContent>
            {servers.map(server => (
              <SelectItem key={server.id} value={server.name} className="text-xs">
                {server.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedServer && (
        <div>
          <Label htmlFor={`tool-${id}`} className="text-xs">Tool</Label>
          <Select
            value={data.config?.mcpTool || ''}
            onValueChange={handleToolChange}
          >
            <SelectTrigger id={`tool-${id}`} className="text-xs h-7 mt-1">
              <SelectValue placeholder="Select tool" />
            </SelectTrigger>
            <SelectContent>
              {selectedServer.tools.map(tool => (
                <SelectItem key={tool.name} value={tool.name} className="text-xs">
                  {tool.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedTool && selectedTool.parameters && Object.keys(selectedTool.parameters).length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs">Parameters</Label>
          {Object.entries(selectedTool.parameters).map(([paramName, paramConfig]) => (
            <div key={paramName} className="space-y-1">
              <Label htmlFor={`param-${id}-${paramName}`} className="text-xs">
                {paramName} {paramConfig.required && <span className="text-red-500">*</span>}
              </Label>
              {renderParamInput(paramName, paramConfig)}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <BaseNode
      id={id}
      data={{
        ...data,
        name: selectedTool?.name || selectedServer?.name || data.name || 'MCP Tool',
        type: 'mcp-tool',
        renderContent
      }}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
    />
  );
});

MCPToolNode.displayName = 'MCPToolNode';

export { MCPToolNode };