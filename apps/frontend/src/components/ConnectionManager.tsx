import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { Card, CardHeader, CardContent } from './ui/card.js';
import { Button } from './ui/button.js';
import { Alert } from './ui/alert.js';
import { Tooltip } from './ui/tooltip.js';
import { useSession } from '@your-org/security/react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog.js';
import { Badge } from './ui/badge.js';
import { format } from 'date-fns';

interface Connection {
  id: string;
  type: string;
  status: 'active' | 'idle' | 'disconnected';
  lastActivity: string;
  metadata: Record<string, any>;
}

export function ConnectionManager() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Connection['status'] | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedConnections, setSelectedConnections] = useState<Set<string>>(new Set());
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const { session } = useSession();
  const { subscribe, send } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe('connections_update', (data: Connection[]) => {
      setConnections(data);
    });

    send('get_connections');

    return () => {
      unsubscribe();
    };
  }, [subscribe, send]);

  const handleDisconnect = async (connectionId: string) => {
    try {
      await send('terminate_connection', { connectionId });
      setSelectedConnection(null);
      setSelectedConnections(new Set());
      setShowDisconnectDialog(false);
    } catch (error) {
      console.error('Failed to terminate connection:', error);
    }
  };

  const handleBatchDisconnect = async () => {
    try {
      const promises = Array.from(selectedConnections).map(id =>
        send('terminate_connection', { connectionId: id })
      );
      await Promise.all(promises);
      setSelectedConnections(new Set());
      setShowDisconnectDialog(false);
    } catch (error) {
      console.error('Failed to terminate connections:', error);
    }
  };

  const handleReconnect = async (connectionId: string) => {
    try {
      await send('reconnect', { connectionId });
    } catch (error) {
      console.error('Failed to reconnect:', error);
    }
  };

  const getStatusColor = (status: Connection['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const toggleConnectionSelection = (connectionId: string) => {
    setSelectedConnections((prev: any) => {
      const newSet = new Set(prev);
      if (newSet.has(connectionId)) {
        newSet.delete(connectionId);
      } else {
        newSet.add(connectionId);
      }
      return newSet;
    });
  };

  const filteredConnections = connections.filter(connection => {
    const matchesStatus = statusFilter === 'all' || connection.status === statusFilter;
    const matchesType = typeFilter === 'all' || connection.type === typeFilter;
    return matchesStatus && matchesType;
  });

  const connectionTypes = Array.from(new Set(connections.map(c => c.type)));

  if (!session) {
    return (
      <Alert variant="warning">
        Please log in to manage connections
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Connection Manager</h3>
          <div className="flex space-x-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="disconnected">Disconnected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {connectionTypes.map(typ(e: any) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedConnections.size > 0 && (
              <Button
                variant="destructive"
                onClick={() => setShowDisconnectDialog(true)}
              >
                Disconnect Selected ({selectedConnections.size})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredConnections.map((connection) => (
            <div
              key={connection.id}
              className={`p-4 border rounded-lg ${selectedConnection === connection.id ? 'border-blue-500' : ''} ${selectedConnections.has(connection.id) ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input
                    aria-label="Select connection"
                    type="checkbox"
                    checked={selectedConnections.has(connection.id)}
                    onChange={() => toggleConnectionSelection(connection.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(connection.status)}`}
                  />
                  <div>
                    <span className="font-medium">{connection.type}</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary">{connection.status}</Badge>
                      <span className="text-sm text-gray-500">
                        Last activity: {format(new Date(connection.lastActivity), 'PPpp')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-x-2">
                  {connection.status === 'disconnected' ? (
                    <Tooltip content="Attempt to reconnect">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReconnect(connection.id)}
                      >
                        Reconnect
                      </Button>
                    </Tooltip>
                  ) : (
                    <Tooltip content="Force disconnect">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setShowDisconnectDialog(true)}
                      >
                        Disconnect
                      </Button>
                    </Tooltip>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedConnection(connection.id === selectedConnection ? null : connection.id)}
                  >
                    {connection.id === selectedConnection ? 'Hide Details' : 'Show Details'}
                  </Button>
                </div>
              </div>

              {selectedConnection === connection.id && (
                <div className="mt-4 bg-gray-50 p-4 rounded">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(connection.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}

          {filteredConnections.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              {connections.length === 0 ? 'No active connections' : 'No connections match the current filters'}
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Disconnect</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect {selectedConnections.size > 0 
                ? `${selectedConnections.size} selected connections` 
                : 'this connection'}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedConnections.size > 0 
                ? handleBatchDisconnect()
                : handleDisconnect(selectedConnection!)}
            >
              Disconnect
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
