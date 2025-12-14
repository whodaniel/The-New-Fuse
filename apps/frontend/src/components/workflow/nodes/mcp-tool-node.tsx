import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMcpTools } from '@/hooks/useMcpTools';
import { MCPServer, MCPTool } from '@/services/MCPService';
import React, { memo, useEffect, useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node';

const MCPToolNode: React.FC<NodeProps> = memo(({ id, data }) => {
  const { servers, tools, loading } = useMcpTools();
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null);
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, any>>({});

  // Load selected server and tool
  useEffect(() => {
    if (data.config?.mcpServer && servers.length > 0) {
      const server = servers.find((s) => s.name === data.config.mcpServer);
      if (server) {
        setSelectedServer(server);

        if (data.config?.mcpTool) {
          const tool = server.tools.find((t) => t.name === data.config.mcpTool);
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
    const server = servers.find((s) => s.name === serverName);
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
          parameters: {},
        },
      });
    }
  };

  // Handle tool selection change
  const handleToolChange = (toolName: string) => {
    if (!selectedServer) return;

    const tool = selectedServer.tools.find((t) => t.name === toolName);
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
          parameters: initialParams,
        },
      });
    }
  };

  // Handle parameter value change
  const handleParamChange = (paramName: string, value: any) => {
    const updatedParams = {
      ...paramValues,
      [paramName]: value,
    };

    setParamValues(updatedParams);

    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          parameters: updatedParams,
        },
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
            className="h-9 text-xs bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
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
            className="h-9 text-xs bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
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
              className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor={`param-${id}-${paramName}`} className="text-xs text-slate-200">
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
            className="h-24 text-xs bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 font-mono resize-none"
          />
        );
      default:
        return (
          <Input
            id={`param-${id}-${paramName}`}
            value={value || ''}
            onChange={(e: any) => handleParamChange(paramName, e.target.value)}
            placeholder={paramConfig.description || paramName}
            className="h-9 text-xs bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
          />
        );
    }
  };

  const inputHandles = [{ id: 'default', label: 'Input' }];

  const outputHandles = [
    { id: 'default', label: 'Output' },
    { id: 'error', label: 'Error' },
  ];

  const renderContent = () => (
    <div className="space-y-3">
      <div>
        <Label htmlFor={`server-${id}`} className="text-xs font-medium text-slate-200">
          MCP Server
        </Label>
        <Select
          value={data.config?.mcpServer || ''}
          onValueChange={handleServerChange}
          disabled={loading}
        >
          <SelectTrigger
            id={`server-${id}`}
            className="h-9 text-xs mt-1.5 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <SelectValue placeholder="Select server" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            {servers.map((server) => (
              <SelectItem
                key={server.id}
                value={server.name}
                className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
              >
                {server.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty state when no servers available */}
      {!loading && servers.length === 0 && (
        <div className="text-xs text-slate-400 bg-slate-700/30 p-3 rounded border border-slate-600/50 text-center">
          <div className="text-2xl mb-2">🔌</div>
          <p className="font-medium text-slate-300">No MCP Servers Connected</p>
          <p className="mt-1 text-slate-400 leading-relaxed">
            MCP (Model Context Protocol) servers provide tools for agents to interact with external
            systems.
          </p>
          <p className="mt-2 text-slate-500 text-xs">
            Configure MCP servers in your settings to enable this node.
          </p>
        </div>
      )}

      {selectedServer && (
        <div>
          <Label htmlFor={`tool-${id}`} className="text-xs font-medium text-slate-200">
            Tool
          </Label>
          <Select value={data.config?.mcpTool || ''} onValueChange={handleToolChange}>
            <SelectTrigger
              id={`tool-${id}`}
              className="h-9 text-xs mt-1.5 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              <SelectValue placeholder="Select tool" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {selectedServer.tools.map((tool) => (
                <SelectItem
                  key={tool.name}
                  value={tool.name}
                  className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                >
                  {tool.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedTool &&
        selectedTool.parameters &&
        Object.keys(selectedTool.parameters).length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-200">Parameters</Label>
            {Object.entries(selectedTool.parameters).map(([paramName, paramConfig]) => (
              <div key={paramName} className="space-y-1">
                <Label htmlFor={`param-${id}-${paramName}`} className="text-xs text-slate-200">
                  {paramName} {paramConfig.required && <span className="text-red-400">*</span>}
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
        renderContent,
      }}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
    />
  );
});

MCPToolNode.displayName = 'MCPToolNode';

export { MCPToolNode };
