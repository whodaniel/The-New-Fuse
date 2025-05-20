import React, { useState, useEffect } from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Agent, useAgents } from '@/hooks/useAgents';

interface AgentSelectorProps {
  onSelect: (agent: Agent) => void;
  selectedAgent?: Agent | null;
}

export const AgentSelector: React.React.FC<AgentSelectorProps> = ({ onSelect, selectedAgent }) => {
  const { agents, loading, error, fetchAgents } = useAgents();
  
  // Retry loading if there was an error
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        fetchAgents();
      }, 5000); // Retry after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [error, fetchAgents]);

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };
  
  if (loading) {
    return (
      <ScrollArea.Root className="h-[400px]">
        <ScrollArea.Viewport className="h-full w-full">
          <div className="space-y-2 p-2">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="cursor-pointer">
                <CardHeader className="p-4">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical">
          <ScrollArea.Thumb />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load agents. Retrying...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ScrollArea.Root className="h-[400px]">
      <ScrollArea.Viewport className="h-full w-full">
        <div className="space-y-2 p-2">
          {agents.map((agent) => (
            <Card 
              key={agent.id} 
              className={`cursor-pointer transition-colors ${
                selectedAgent?.id === agent.id
                  ? 'bg-primary/10'
                  : 'hover:bg-accent'
              }`} 
              onClick={() => onSelect(agent)}
            >
              <CardHeader className="p-4">
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusVariant(agent.status)}>
                    {agent.status || 'unknown'}
                  </Badge>
                  <CardTitle className="text-sm font-medium">
                    {agent.name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  {agent.description || `${agent.type} agent`}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {agent.capabilities ? 
                    agent.capabilities.map((capability) => (
                      <Badge key={capability} variant="outline">
                        {capability}
                      </Badge>
                    )) : 
                    <Badge variant="outline">{agent.type}</Badge>
                  }
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="vertical">
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
};
//# sourceMappingURL=agent-selector.js.map