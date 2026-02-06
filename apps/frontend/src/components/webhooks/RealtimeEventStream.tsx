import { BusinessEventType, EventPriority, IntegrationSource } from '@the-new-fuse/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
} from '@the-new-fuse/ui-consolidated';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Pause,
  Play,
  RefreshCw,
  Search,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSSEConnection } from './hooks/useSSEConnection';

export interface RealtimeEventStreamProps {
  maxEvents?: number;
  showFilters?: boolean;
  showMetrics?: boolean;
  autoScroll?: boolean;
  className?: string;
}

const EVENT_ICONS: Record<BusinessEventType, JSX.Element> = {
  [BusinessEventType.PAYMENT_COMPLETED]: <DollarSign className="w-4 h-4 text-green-600" />,
  [BusinessEventType.PAYMENT_FAILED]: <AlertCircle className="w-4 h-4 text-red-600" />,
  [BusinessEventType.SUBSCRIPTION_CREATED]: <CheckCircle className="w-4 h-4 text-blue-600" />,
  [BusinessEventType.SUBSCRIPTION_CANCELLED]: <AlertCircle className="w-4 h-4 text-orange-600" />,
  [BusinessEventType.CUSTOMER_CREATED]: <Users className="w-4 h-4 text-purple-600" />,
  [BusinessEventType.CUSTOMER_UPDATED]: <Users className="w-4 h-4 text-blue-600" />,
  [BusinessEventType.ORDER_PLACED]: <ShoppingCart className="w-4 h-4 text-green-600" />,
  [BusinessEventType.ORDER_CANCELLED]: <ShoppingCart className="w-4 h-4 text-red-600" />,
  [BusinessEventType.INVENTORY_LOW]: <AlertCircle className="w-4 h-4 text-yellow-600" />,
  [BusinessEventType.LEAD_CREATED]: <Users className="w-4 h-4 text-indigo-600" />,
  [BusinessEventType.DEAL_WON]: <DollarSign className="w-4 h-4 text-green-600" />,
  [BusinessEventType.DEAL_LOST]: <AlertCircle className="w-4 h-4 text-red-600" />,
  [BusinessEventType.CONTACT_CREATED]: <Users className="w-4 h-4 text-blue-600" />,
  [BusinessEventType.INVOICE_PAID]: <DollarSign className="w-4 h-4 text-green-600" />,
  [BusinessEventType.REFUND_PROCESSED]: <DollarSign className="w-4 h-4 text-orange-600" />,
};

const PRIORITY_COLORS: Record<EventPriority, string> = {
  [EventPriority.LOW]: 'bg-gray-100 text-gray-800',
  [EventPriority.MEDIUM]: 'bg-blue-100 text-blue-800',
  [EventPriority.HIGH]: 'bg-orange-100 text-orange-800',
  [EventPriority.CRITICAL]: 'bg-red-100 text-red-800',
};

export function RealtimeEventStream({
  maxEvents = 50,
  showFilters = false,
  showMetrics = false,
  autoScroll: _autoScroll = true,
  className,
}: RealtimeEventStreamProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<BusinessEventType | 'all'>('all');
  const [selectedSource, setSelectedSource] = useState<IntegrationSource | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<EventPriority | 'all'>('all');
  const [isPaused, setIsPaused] = useState(false);

  const { events, connectionState, clearEvents, connect, disconnect } = useSSEConnection({
    autoReconnect: !isPaused,
  });

  const filteredEvents = useMemo(() => {
    let filtered = events.slice(-maxEvents);

    if (searchTerm) {
      filtered = filtered.filter((event) =>
        JSON.stringify(event.data).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedEventType !== 'all') {
      filtered = filtered.filter((event) => event.data.event_type === selectedEventType);
    }

    if (selectedSource !== 'all') {
      filtered = filtered.filter((event) => event.data.source === selectedSource);
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter((event) => event.data.priority === selectedPriority);
    }

    return filtered.reverse(); // Show newest first
  }, [events, maxEvents, searchTerm, selectedEventType, selectedSource, selectedPriority]);

  const eventMetrics = useMemo(() => {
    const recentEvents = events.slice(-100); // Last 100 events for metrics

    return {
      total: recentEvents.length,
      byType: recentEvents.reduce(
        (acc, event) => {
          const type = event.data.event_type || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      byPriority: recentEvents.reduce(
        (acc, event) => {
          const priority = event.data.priority || EventPriority.LOW;
          acc[priority] = (acc[priority] || 0) + 1;
          return acc;
        },
        {} as Record<EventPriority, number>
      ),
      eventsPerMinute: Math.round(recentEvents.length / 5), // Rough estimate
    };
  }, [events]);

  const handleToggleConnection = () => {
    if (isPaused) {
      connect();
      setIsPaused(false);
    } else {
      disconnect();
      setIsPaused(true);
    }
  };

  const handleExportEvents = () => {
    const dataStr = JSON.stringify(filteredEvents, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `webhook-events-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatEventData = (data: Record<string, unknown>): string => {
    try {
      // Extract key information from the event
      const keys = ['amount', 'customer_id', 'order_id', 'status', 'email', 'name'];
      const extracted = keys.reduce(
        (acc, key) => {
          if (data[key] !== undefined) {
            acc[key] = data[key];
          }
          return acc;
        },
        {} as Record<string, unknown>
      );

      return Object.keys(extracted).length > 0
        ? JSON.stringify(extracted, null, 1)
            .replace(/[{}"\n]/g, '')
            .trim()
        : 'Event received';
    } catch {
      return 'Event received';
    }
  };

  const getEventTypeLabel = (type: BusinessEventType): string => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold">Live Event Stream</h3>
          <Badge
            className={
              connectionState.isConnected
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }
          >
            {connectionState.isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleToggleConnection}>
            {isPaused ? (
              <>
                <Play className="w-4 h-4 mr-1" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={clearEvents}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportEvents}
            disabled={filteredEvents.length === 0}
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics */}
      {showMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{eventMetrics.total}</div>
              <div className="text-xs text-muted-foreground">Total Events</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{eventMetrics.eventsPerMinute}</div>
              <div className="text-xs text-muted-foreground">Events/Min</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {eventMetrics.byPriority[EventPriority.CRITICAL] || 0}
              </div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                {eventMetrics.byPriority[EventPriority.HIGH] || 0}
              </div>
              <div className="text-xs text-muted-foreground">High Priority</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={selectedEventType}
                onValueChange={(value: BusinessEventType | 'all') => setSelectedEventType(value)}
              >
                <option value="all">All Event Types</option>
                {Object.values(BusinessEventType).map((type) => (
                  <option key={type} value={type}>
                    {getEventTypeLabel(type)}
                  </option>
                ))}
              </Select>
              <Select
                value={selectedSource}
                onValueChange={(value: IntegrationSource | 'all') => setSelectedSource(value)}
              >
                <option value="all">All Sources</option>
                {Object.values(IntegrationSource).map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </Select>
              <Select
                value={selectedPriority}
                onValueChange={(value: EventPriority | 'all') => setSelectedPriority(value)}
              >
                <option value="all">All Priorities</option>
                {Object.values(EventPriority).map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Stream */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Events ({filteredEvents.length})</span>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              {connectionState.lastEventTime && (
                <span>Last event: {connectionState.lastEventTime.toLocaleTimeString()}</span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <p>No events to display</p>
                <p className="text-sm">Events will appear here as they are received</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredEvents.map((event, index) => (
                  <div
                    key={`${event.timestamp}-${index}`}
                    className="p-3 border-b hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {EVENT_ICONS[event.data.event_type as BusinessEventType] || (
                            <AlertCircle className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="font-medium">
                            {getEventTypeLabel(event.data.event_type || 'Unknown')}
                          </span>
                        </div>
                        {event.data.priority && (
                          <Badge className={PRIORITY_COLORS[event.data.priority as EventPriority]}>
                            {event.data.priority}
                          </Badge>
                        )}
                        {event.data.source && <Badge variant="outline">{event.data.source}</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {event.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {formatEventData(event.data)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
