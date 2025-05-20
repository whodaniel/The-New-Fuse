import React, { useEffect, useState, useMemo } from 'react';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { ScrollArea } from './ui/scroll-area.js';
import { Card, CardHeader, CardContent } from './ui/card.js';
import { Badge } from './ui/badge.js';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from './ui/button.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.js';
import { ChevronDown, ChevronUp, Filter, RefreshCw } from 'lucide-react';

interface Activity {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: string;
  category?: string;
  source?: string;
  metadata?: Record<string, any>;
  read?: boolean;
}

const ActivityItem: React.React.FC<Activity & { onToggleExpand?: () => void, expanded?: boolean }> = ({
  type,
  message,
  timestamp,
  metadata,
  category,
  source,
  read,
  onToggleExpand,
  expanded
}) => {
  const variants = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    success: 'bg-green-100 text-green-800'
  };

  return (
    <div className={`flex flex-col p-3 hover:bg-gray-50 rounded-md transition-colors ${!read ? 'border-l-2 border-blue-500' : ''}`}>
      <div className="flex items-start space-x-4 w-full">
        <Badge className={variants[type]}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Badge>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-gray-900">{message}</p>
            {onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 mt-1">
            {category && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                {category}
              </span>
            )}
            {source && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                {source}
              </span>
            )}
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>

      {expanded && metadata && (
        <div className="mt-2 ml-10 p-3 bg-gray-50 rounded-md border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Details:</p>
          <pre className="text-xs text-gray-700 overflow-x-auto">
            {JSON.stringify(metadata, null, 2)}
          </pre>
          <p className="text-xs text-gray-500 mt-2">
            {format(new Date(timestamp), 'PPpp')}
          </p>
        </div>
      )}
    </div>
  );
};

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const handlers = [
      subscribe('activity', (activity: Activity) => {
        setActivities((prev: any) => [activity, ...prev].slice(0, 50));
      }),

      subscribe('system_event', (event: any) => {
        const activity: Activity = {
          id: crypto.randomUUID(),
          type: event.severity || 'info',
          message: event.message,
          timestamp: new Date().toISOString(),
          category: event.category || 'System',
          source: event.source || 'System',
          metadata: event.data
        };
        setActivities((prev: any) => [activity, ...prev].slice(0, 50));
      }),

      subscribe('error', (error: Error) => {
        const activity: Activity = {
          id: crypto.randomUUID(),
          type: 'error',
          message: error.message,
          timestamp: new Date().toISOString(),
          category: 'Error',
          source: 'Application'
        };
        setActivities((prev: any) => [activity, ...prev].slice(0, 50));
      })
    ];

    return () => {
      handlers.forEach(unsubscrib(e: any) => unsubscribe());
    };
  }, [subscribe]);

  // Filter activities based on selected filters
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];

    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(activity => activity.type === filter);
    }

    // Filter by time range
    if (timeRange !== 'all') {
      const now = new Date();
      let cutoff = new Date();

      switch (timeRange) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'yesterday':
          cutoff.setDate(now.getDate() - 1);
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(activity => new Date(activity.timestamp) >= cutoff);
    }

    return filtered;
  }, [activities, filter, timeRange]);

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activity[]> = {};

    filteredActivities.forEach(activity => {
      const date = new Date(activity.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });

    return groups;
  }, [filteredActivities]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev: any) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
        // Mark as read when expanded
        setReadIds(readIds => new Set([...readIds, id]));
      }
      return newSet;
    });
  };

  const markAllAsRead = () => {
    setReadIds(new Set(activities.map(a => a.id)));
  };

  const clearActivities = () => {
    if (window.confirm('Are you sure you want to clear all activities?')) {
      setActivities([]);
      setExpandedIds(new Set());
      setReadIds(new Set());
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Activity Feed</h3>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="ml-2">
              {filteredActivities.length} events
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <div className="flex items-center space-x-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="success">Success</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-grow"></div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={clearActivities}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-2">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="grouped">Grouped View</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <ScrollArea className="h-[400px]">
              {filteredActivities.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No activity to display
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredActivities.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      {...activity}
                      expanded={expandedIds.has(activity.id)}
                      onToggleExpand={() => toggleExpand(activity.id)}
                      read={readIds.has(activity.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="grouped">
            <ScrollArea className="h-[400px]">
              {Object.keys(groupedActivities).length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No activity to display
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedActivities).map(([date, dateActivities]) => (
                    <div key={date} className="space-y-1">
                      <div className="sticky top-0 bg-gray-100 p-2 rounded-md z-10">
                        <h4 className="text-sm font-medium">{date}</h4>
                      </div>
                      {dateActivities.map((activity) => (
                        <ActivityItem
                          key={activity.id}
                          {...activity}
                          expanded={expandedIds.has(activity.id)}
                          onToggleExpand={() => toggleExpand(activity.id)}
                          read={readIds.has(activity.id)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function ActivityFeedControls({ setActivities, clearActivities }: { setActivities: (fn: (prev: Activity[]) => Activity[]) => void, clearActivities: () => void }) {
  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        onClick={() => setActivities((prev: any) => [...prev])}
      >
        <RefreshCw size={14} className="mr-1" />
        Refresh
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        onClick={clearActivities}
      >
        Clear
      </Button>
    </div>
  );
}