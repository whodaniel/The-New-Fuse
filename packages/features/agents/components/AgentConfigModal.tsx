'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Agent, AgentConfig, AgentType } from './types';

interface AgentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId?: string;
  initialData?: Agent;
}

export const AgentConfigModal: React.FC<AgentConfigModalProps> = ({
  isOpen,
  onClose,
  agentId,
  initialData,
}) => {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<AgentConfig>({
    name: initialData?.name || '',
    type: (initialData?.type as AgentType) || 'chat',
    settings: {
      temperature: initialData?.configuration?.temperature ?? 0.7,
      maxTokens: initialData?.configuration?.maxTokens ?? 1000,
      topP: initialData?.configuration?.topP ?? 1,
    },
    capabilities: initialData?.capabilities || [],
    customInstructions: initialData?.customInstructions || '',
  });

  useEffect(() => {
    if (initialData) {
      setConfig({
        name: initialData.name,
        type: (initialData.type as AgentType) || 'chat',
        settings: {
          temperature: initialData.configuration?.temperature ?? 0.7,
          maxTokens: initialData.configuration?.maxTokens ?? 1000,
          topP: initialData.configuration?.topP ?? 1,
        },
        capabilities: initialData.capabilities || [],
        customInstructions: initialData.customInstructions || '',
      });
    }
  }, [initialData]);

  const updateMutation = useMutation({
    mutationFn: async (data: AgentConfig) => {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update agent');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(config);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Agent Configuration</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="Enter agent name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Agent Type</Label>
              <Select
                value={config.type}
                onValueChange={(value: AgentType) => setConfig({ ...config, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select agent type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="data-analysis">Data Analysis</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Model Settings</h4>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature: {config.settings.temperature}</Label>
                <Input
                  id="temperature"
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={config.settings.temperature}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      settings: {
                        ...config.settings,
                        temperature: parseFloat(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={config.settings.maxTokens}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      settings: {
                        ...config.settings,
                        maxTokens: parseInt(e.target.value),
                      },
                    })
                  }
                  min={1}
                  max={8000}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
