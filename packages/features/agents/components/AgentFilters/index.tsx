'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import React from 'react';
import { AgentFilters as AgentFiltersType } from '../types';

interface AgentFiltersProps {
  filters: AgentFiltersType;
  onFilterChange: (filters: AgentFiltersType) => void;
}

export const AgentFilters: React.FC<AgentFiltersProps> = ({ filters, onFilterChange }) => {
  const handleFilterChange = (field: keyof AgentFiltersType, value: unknown) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4 w-full">
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            handleFilterChange('status', value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="idle">Idle</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="capability">Capability</Label>
        <Select
          value={filters.capability || 'all'}
          onValueChange={(value) =>
            handleFilterChange('capability', value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger id="capability">
            <SelectValue placeholder="Select capability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Capabilities</SelectItem>
            <SelectItem value="conversation">Conversation</SelectItem>
            <SelectItem value="task_execution">Task Execution</SelectItem>
            <SelectItem value="code_generation">Code Generation</SelectItem>
            <SelectItem value="data_analysis">Data Analysis</SelectItem>
            <SelectItem value="learning">Learning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <Select
          value={filters.model || 'all'}
          onValueChange={(value) =>
            handleFilterChange('model', value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger id="model">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
            <SelectItem value="gpt-4">GPT-4</SelectItem>
            <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
            <SelectItem value="claude">Claude</SelectItem>
            <SelectItem value="claude-3">Claude 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="performance">Minimum Performance (%)</Label>
        <Input
          id="performance"
          type="number"
          min={0}
          max={100}
          value={filters.performance || ''}
          onChange={(e) =>
            handleFilterChange('performance', e.target.value ? parseInt(e.target.value) : undefined)
          }
          placeholder="Enter minimum performance"
        />
      </div>
    </div>
  );
};
