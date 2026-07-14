import { useAISource } from '@/hooks/useAISource';
import type { AISourceOption } from '@/types/aiSource';
import { Bot, Cloud, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import React, { useMemo } from 'react';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';

export interface AISourceSelectorProps {
  label?: string;
  description?: string;
  compact?: boolean;
  disabled?: boolean;
  className?: string;
  value?: string;
  onChange?: (sourceId: string, source: AISourceOption) => void;
}

const groupOrder: AISourceOption['group'][] = ['Automatic', 'Local & Network', 'TNF Cloud'];

function healthBadge(source: AISourceOption, relayOnline: boolean | null) {
  if (source.kind === 'local-relay') {
    const online = source.health === 'online' || relayOnline;
    return online ? 'Local online' : 'Local offline';
  }
  if (source.kind === 'tnf-cloud') return 'Cloud';
  return 'Auto route';
}

export const AISourceSelector: React.FC<AISourceSelectorProps> = ({
  label = 'AI Source',
  description = 'Choose which model or local agent powers this chat.',
  compact = false,
  disabled = false,
  className = '',
  value,
  onChange,
}) => {
  const {
    sources,
    selectedSource,
    selectedSourceId,
    selectSource,
    refresh,
    loading,
    refreshing,
    relayOnline,
    error,
  } = useAISource();

  const activeId = value || selectedSourceId || selectedSource.id;

  const grouped = useMemo(() => {
    const buckets = new Map<AISourceOption['group'], AISourceOption[]>();
    for (const group of groupOrder) buckets.set(group, []);
    for (const source of sources) {
      const list = buckets.get(source.group) || [];
      list.push(source);
      buckets.set(source.group, list);
    }
    return buckets;
  }, [sources]);

  const handleChange = (nextId: string) => {
    selectSource(nextId);
    const source = sources.find((entry) => entry.id === nextId);
    if (source) onChange?.(nextId, source);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          {!compact && <Label className="text-sm font-medium">{label}</Label>}
          {!compact && description ? (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {relayOnline === true ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
              <Wifi className="h-3 w-3" />
              Relay
            </span>
          ) : relayOnline === false ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
              <WifiOff className="h-3 w-3" />
              Relay
            </span>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            disabled={disabled || refreshing}
            onClick={() => void refresh()}
            title="Refresh AI sources"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Select value={activeId} onValueChange={handleChange} disabled={disabled || loading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? 'Loading AI sources…' : 'Select AI source'} />
        </SelectTrigger>
        <SelectContent>
          {groupOrder.map((group) => {
            const items = grouped.get(group) || [];
            if (!items.length) return null;
            return (
              <SelectGroup key={group}>
                <SelectLabel className="flex items-center gap-1.5">
                  {group === 'Local & Network' ? (
                    <Bot className="h-3 w-3" />
                  ) : group === 'TNF Cloud' ? (
                    <Cloud className="h-3 w-3" />
                  ) : (
                    <Bot className="h-3 w-3" />
                  )}
                  {group}
                </SelectLabel>
                {items.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    <div className="flex flex-col">
                      <span>{source.label}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {healthBadge(source, relayOnline)}
                        {source.model ? ` · ${source.model}` : ''}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>

      {error ? <p className="text-xs text-amber-500">{error}</p> : null}
    </div>
  );
};

export default AISourceSelector;
