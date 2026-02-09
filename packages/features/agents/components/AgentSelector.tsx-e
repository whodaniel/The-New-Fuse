import React, { FC } from "react";
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'busy';
  type: string;
  capabilities: string[];
}

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgent: Agent | null;
  onSelect: (agent: Agent) => void;
}

export const AgentSelector: FC<AgentSelectorProps> = ({
  agents,
  selectedAgent,
  onSelect,
}) => {
  const getStatusColor: Agent['status'])  = (status> {
    switch(status: unknown) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-500';
      case 'busy': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-2">
        {agents.map((agent) => (
          <Card
            key={agent.id}
            className={`cursor-pointer transition-colors hover:bg-gray-100 ${
              selectedAgent?.id === agent.id ? 'border-primary' : ''
            }`}
            onClick={() => onSelect(agent)}
          >
            <CardContent className="flex items-center p-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={agent.avatar} />
                <AvatarFallback>{agent.name[0]}</AvatarFallback>
              </Avatar>
              <div className="ml-4 flex-1">
                <div className="flex items-center">
                  <h3 className="font-medium">{agent.name}</h3>
                  <div className={`ml-2 h-2 w-2 rounded-full ${getStatusColor(agent.status)}`} />
                </div>
                <p className="text-sm text-gray-500">{agent.type}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {agent.capabilities.map((capability) => (
                  <Badge key={capability} variant="secondary">
                    {capability}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};