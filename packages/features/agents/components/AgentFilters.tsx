'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SlidersHorizontal, X } from 'lucide-react';
import React from 'react';
import { AgentFilters as AgentFiltersType, AgentStatus } from './types';

interface AgentFiltersProps {
  filters: AgentFiltersType;
  onFilterChange: (filters: AgentFiltersType) => void;
  availableCapabilities?: string[];
  availableModels?: string[];
}

export const AgentFilters: React.FC<AgentFiltersProps> = ({
  filters,
  onFilterChange,
  availableCapabilities = [],
  availableModels = [],
}) => {
  const handleStatusChange = (value: AgentStatus | 'all') => {
    onFilterChange({
      ...filters,
      status: value === 'all' ? undefined : value,
    });
  };

  const handleCapabilityChange = (value: string) => {
    onFilterChange({
      ...filters,
      capability: value === 'all' ? undefined : value,
    });
  };

  const handleModelChange = (value: string) => {
    onFilterChange({
      ...filters,
      model: value === 'all' ? undefined : value,
    });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="idle">Idle</SelectItem>
          <SelectItem value="error">Error</SelectItem>
        </SelectContent>
      </Select>

      {availableCapabilities.length > 0 && (
        <Select value={filters.capability || 'all'} onValueChange={handleCapabilityChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by capability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Capabilities</SelectItem>
            {availableCapabilities.map((capability) => (
              <SelectItem key={capability} value={capability}>
                {capability}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {availableModels.length > 0 && (
        <Select value={filters.model || 'all'} onValueChange={handleModelChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
            {availableModels.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}

      <Button variant="outline" size="sm">
        <SlidersHorizontal className="h-4 w-4 mr-2" />
        More Filters
      </Button>
    </div>
  );
};
