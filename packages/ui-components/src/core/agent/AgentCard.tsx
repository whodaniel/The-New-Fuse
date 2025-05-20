import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../card/ConsolidatedCard.js';
import { Button } from '../button/Button.js';
import { Badge } from '../badge/Badge.js';
import {
  PlayCircle,
  PauseCircle,
  Edit,
  Trash,
  Info,
  ExternalLink,
  Settings
} from 'lucide-react';

// Comprehensive Agent type that supports all protocol features
export interface Agent {
  id: string;
  name: string;
  description?: string;
  type: AgentType;
  role?: AgentRole;
  status: AgentStatus;
  capabilities: string[];
  protocols?: string[];
  endpoints?: {
    discovery?: string;
    messaging?: string;
    metrics?: string;
  };
  security?: {
    authentication?: 'none' | 'api_key' | 'oauth2' | 'jwt';
    encryption?: boolean;
    rateLimit?: number;
  };
  metadata?: {
    version?: string;
    lastActive?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    config?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

export type AgentType =
  | 'CONVERSATIONAL'
  | 'IDE_EXTENSION'
  | 'API'
  | 'HUMAN'
  | 'AI'
  | 'assistant'
  | 'worker'
  | 'supervisor'
  | 'specialist';

export type AgentRole =
  | 'ASSISTANT'
  | 'DEVELOPER'
  | 'REVIEWER'
  | 'ARCHITECT'
  | 'TESTER'
  | 'DOCUMENTER'
  | 'assistant'
  | 'developer'
  | 'reviewer';

export type AgentStatus =
  | 'IDLE'
  | 'BUSY'
  | 'ERROR'
  | 'OFFLINE'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PENDING'
  | 'DELETED'
  | 'INITIALIZING'
  | 'READY'
  | 'TERMINATED'
  | 'LEARNING'
  | 'idle'
  | 'busy'
  | 'error'
  | 'offline'
  | 'active';

export interface AgentCardProps {
  agent: Agent;
  onSelect?: (agent: Agent) => void;
  onStart?: (agent: Agent) => void;
  onStop?: (agent: Agent) => void;
  onEdit?: (agent: Agent) => void;
  onDelete?: (agent: Agent) => void;
  onViewDetails?: (agent: Agent) => void;
  onConfigureEndpoints?: (agent: Agent) => void;
  className?: string;
  compact?: boolean;
  showProtocols?: boolean;
  showEndpoints?: boolean;
  showSecurity?: boolean;
}

const statusColors: Record<string, string> = {
  // Uppercase status values
  'IDLE': 'bg-green-100 text-green-800',
  'BUSY': 'bg-yellow-100 text-yellow-800',
  'ERROR': 'bg-red-100 text-red-800',
  'OFFLINE': 'bg-gray-100 text-gray-800',
  'ACTIVE': 'bg-green-100 text-green-800',
  'INACTIVE': 'bg-gray-100 text-gray-800',
  'PENDING': 'bg-blue-100 text-blue-800',
  'DELETED': 'bg-red-100 text-red-800',
  'INITIALIZING': 'bg-blue-100 text-blue-800',
  'READY': 'bg-green-100 text-green-800',
  'TERMINATED': 'bg-red-100 text-red-800',
  'LEARNING': 'bg-purple-100 text-purple-800',

  // Lowercase status values
  'idle': 'bg-green-100 text-green-800',
  'busy': 'bg-yellow-100 text-yellow-800',
  'error': 'bg-red-100 text-red-800',
  'offline': 'bg-gray-100 text-gray-800',
  'active': 'bg-green-100 text-green-800',
};

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onSelect,
  onStart,
  onStop,
  onEdit,
  onDelete,
  onViewDetails,
  onConfigureEndpoints,
  className = '',
  compact = false,
  showProtocols = false,
  showEndpoints = false,
  showSecurity = false,
}) => {
  // Normalize status to handle both uppercase and lowercase values
  const normalizedStatus = agent.status.toString().toUpperCase();
  const isActive = normalizedStatus === 'ACTIVE' || normalizedStatus === 'IDLE';

  // Get status color with fallback
  const statusColor = statusColors[agent.status] || 'bg-gray-100 text-gray-800';

  return (
    <Card
      className={className}
      variant="default"
      size={compact ? "sm" : "default"}
      hover={true}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">{agent.name}</CardTitle>
          <Badge className={statusColor}>
            {agent.status}
          </Badge>
        </div>

        {!compact && (
          <div className="mt-1">
            <CardDescription className="text-sm text-gray-500">{agent.description}</CardDescription>
            <p className="text-xs text-gray-400 mt-1">Type: {agent.type}</p>
            {agent.role && <p className="text-xs text-gray-400">Role: {agent.role}</p>}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {!compact && (
          <div>
            <h4 className="text-sm font-medium text-gray-700">Capabilities</h4>
            <div className="mt-1 flex flex-wrap gap-1">
              {agent.capabilities.map((capability) => (
                <Badge
                  key={capability}
                  className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs"
                >
                  {capability}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {showProtocols && agent.protocols && agent.protocols.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700">Protocols</h4>
            <div className="mt-1 flex flex-wrap gap-1">
              {agent.protocols.map((protocol) => (
                <Badge
                  key={protocol}
                  className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs"
                >
                  {protocol}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {showEndpoints && agent.endpoints && (
          <div>
            <h4 className="text-sm font-medium text-gray-700">Endpoints</h4>
            <div className="mt-1 space-y-1 text-xs text-gray-500">
              {agent.endpoints.discovery && (
                <div className="flex items-center">
                  <span className="font-medium mr-1">Discovery:</span>
                  <span className="truncate">{agent.endpoints.discovery}</span>
                  <ExternalLink className="h-3 w-3 ml-1 cursor-pointer" onClick={() => window.open(agent.endpoints.discovery, '_blank')} />
                </div>
              )}
              {agent.endpoints.messaging && (
                <div className="flex items-center">
                  <span className="font-medium mr-1">Messaging:</span>
                  <span className="truncate">{agent.endpoints.messaging}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {showSecurity && agent.security && (
          <div>
            <h4 className="text-sm font-medium text-gray-700">Security</h4>
            <div className="mt-1 space-y-1 text-xs text-gray-500">
              <div>Authentication: {agent.security.authentication || 'none'}</div>
              <div>Encryption: {agent.security.encryption ? 'Enabled' : 'Disabled'}</div>
              {agent.security.rateLimit && <div>Rate Limit: {agent.security.rateLimit} req/min</div>}
            </div>
          </div>
        )}

        {!compact && agent.metadata && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            {agent.metadata.version && <span>Version: {agent.metadata.version}</span>}
            {agent.metadata.lastActive && (
              <span>
                Last active: {new Date(agent.metadata.lastActive).toLocaleString()}
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end space-x-2">
        {onSelect && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(agent)}
          >
            Select
          </Button>
        )}

        {onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(agent)}
            icon={<Info className="h-4 w-4" />}
          >
            Details
          </Button>
        )}

        {onConfigureEndpoints && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onConfigureEndpoints(agent)}
            icon={<Settings className="h-4 w-4" />}
          >
            Configure
          </Button>
        )}

        {isActive && onStop && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStop(agent)}
            icon={<PauseCircle className="h-4 w-4" />}
          >
            Stop
          </Button>
        )}

        {!isActive && onStart && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStart(agent)}
            icon={<PlayCircle className="h-4 w-4" />}
          >
            Start
          </Button>
        )}

        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(agent)}
            icon={<Edit className="h-4 w-4" />}
          >
            Edit
          </Button>
        )}

        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(agent)}
            icon={<Trash className="h-4 w-4" />}
          >
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
