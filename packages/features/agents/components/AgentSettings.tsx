'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import React, { useState } from 'react';
import { Agent } from './types';

interface AgentSettingsProps {
  agent: Agent;
  onSave: (agent: Agent) => Promise<void>;
}

export const AgentSettings: React.FC<AgentSettingsProps> = ({ agent, onSave }) => {
  const [formData, setFormData] = useState({
    name: agent.name,
    description: agent.description || '',
    capabilities: agent.capabilities?.join(', ') || '',
    model: agent.configuration?.model || '',
    isActive: agent.status === 'active',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        ...agent,
        name: formData.name,
        description: formData.description,
        capabilities: formData.capabilities
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        configuration: {
          ...agent.configuration,
          model: formData.model,
        },
        status: formData.isActive ? 'active' : 'inactive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Agent Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter agent name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter agent description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capabilities">Capabilities</Label>
            <Input
              id="capabilities"
              value={formData.capabilities}
              onChange={(e) => setFormData({ ...formData, capabilities: e.target.value })}
              placeholder="Enter capabilities separated by commas"
            />
            <p className="text-sm text-gray-500">Separate capabilities with commas</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="e.g., gpt-4, claude-3"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="status">Active</Label>
              <p className="text-sm text-gray-500">Enable or disable this agent</p>
            </div>
            <Switch
              id="status"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>

          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
};
