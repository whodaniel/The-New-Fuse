/**
 * Enhanced Timeline Orchestrator
 *
 * Advanced timeline modality that integrates all discovered framework capabilities:
 * - Redis pub/sub for real-time updates
 * - Agent communication bridges
 * - Multi-protocol coordination
 * - Workflow orchestration patterns
 * - File-based protocols
 * - Handoff management
 *
 * This component provides a unified timeline interface that visualizes and manages
 * all framework activities across time dimensions.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { EventEmitter } from 'events';
import { Card } from '../Card';
import { Button } from '../Button';
import { Input } from '../Input';
import { Badge } from '../Badge';
export const EnhancedTimelineOrchestrator = ({ integrationService, eventStreamService, onEventSelect, onBranchCreate, onEventAnalyze, height = 600, enableRealTime = true, enableBranching = true, enableAnalytics = true, }) => {
    // State management
    const [events, setEvents] = useState([]);
    const [branches, setBranches] = useState([]);
    const [activeBranchId, setActiveBranchId] = useState('main');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [filter, setFilter] = useState({
        eventTypes: [],
        sourceTypes: [],
        timeRange: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            end: new Date(),
        },
        priorities: [],
        statuses: [],
        searchQuery: '',
        correlationIds: [],
    });
    const [visualConfig, setVisualConfig] = useState({
        layout: 'horizontal',
        density: 'normal',
        grouping: 'by_type',
        realTimeUpdates: enableRealTime,
        showMinimap: true,
        enableZoom: true,
        showConnections: true,
        animationSpeed: 300,
    });
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [analytics, setAnalytics] = useState({});
    // Refs
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const tooltipRef = useRef(null);
    const eventEmitterRef = useRef(new EventEmitter());
    // Timeline dimensions and scales
    const margin = { top: 50, right: 50, bottom: 50, left: 80 };
    const width = 1200;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    // Filtered and processed events
    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            // Apply all filters
            if (filter.eventTypes.length > 0 && !filter.eventTypes.includes(event.type))
                return false;
            if (filter.sourceTypes.length > 0 && !filter.sourceTypes.includes(event.source.type))
                return false;
            if (filter.priorities.length > 0 && (!event.metadata.priority || !filter.priorities.includes(event.metadata.priority)))
                return false;
            if (filter.statuses.length > 0 && (!event.metadata.status || !filter.statuses.includes(event.metadata.status)))
                return false;
            if (filter.searchQuery && !event.title.toLowerCase().includes(filter.searchQuery.toLowerCase()) &&
                !event.description.toLowerCase().includes(filter.searchQuery.toLowerCase()))
                return false;
            if (event.timestamp < filter.timeRange.start || event.timestamp > filter.timeRange.end)
                return false;
            if (filter.correlationIds.length > 0 && (!event.metadata.correlationId ||
                !filter.correlationIds.includes(event.metadata.correlationId)))
                return false;
            return true;
        }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }, [events, filter]);
    // Initialize event streams
    useEffect(() => {
        if (!enableRealTime || !eventStreamService)
            return;
        const handleEvent = (event) => {
            const enhancedEvent = enhanceTimelineEvent(event);
            setEvents(prev => {
                const exists = prev.find(e => e.id === enhancedEvent.id);
                if (exists)
                    return prev;
                return [...prev, enhancedEvent].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            });
        };
        // Subscribe to various event types
        eventStreamService.on('agent.message.sent', handleEvent);
        eventStreamService.on('agent.message.received', handleEvent);
        eventStreamService.on('workflow.started', handleEvent);
        eventStreamService.on('workflow.completed', handleEvent);
        eventStreamService.on('workflow.failed', handleEvent);
        eventStreamService.on('agent.handoff', handleEvent);
        eventStreamService.on('file.protocol.message', handleEvent);
        eventStreamService.on('redis.message', handleEvent);
        eventStreamService.on('bridge.event', handleEvent);
        return () => {
            eventStreamService.removeListener('agent.message.sent', handleEvent);
            eventStreamService.removeListener('agent.message.received', handleEvent);
            eventStreamService.removeListener('workflow.started', handleEvent);
            eventStreamService.removeListener('workflow.completed', handleEvent);
            eventStreamService.removeListener('workflow.failed', handleEvent);
            eventStreamService.removeListener('agent.handoff', handleEvent);
            eventStreamService.removeListener('file.protocol.message', handleEvent);
            eventStreamService.removeListener('redis.message', handleEvent);
            eventStreamService.removeListener('bridge.event', handleEvent);
        };
    }, [enableRealTime, eventStreamService]);
    // Load initial timeline data
    useEffect(() => {
        loadTimelineData();
    }, []);
    // Render timeline visualization
    useEffect(() => {
        if (!svgRef.current || filteredEvents.length === 0)
            return;
        renderTimeline();
    }, [filteredEvents, visualConfig]);
    const loadTimelineData = async () => {
        setIsLoading(true);
        try {
            // Load historical events from integration service
            const response = await integrationService.processRequest({
                id: `timeline-load-${Date.now()},
        userType: 'human',
        interfaceMode: 'visual',
        intent: 'load_timeline_history',
        context: { timeRange: filter.timeRange },
        payload: { includeAll: true },
        metadata: {
          timestamp: new Date(),
          priority: 'medium',
          source: 'timeline-orchestrator',
        },
      });

      if (response.success && response.data.events) {
        const enhancedEvents = response.data.events.map(enhanceTimelineEvent);
        setEvents(enhancedEvents);
      }

      if (response.data.branches) {
        setBranches(response.data.branches);
      }
    } catch (error) {
      console.error('Failed to load timeline data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const enhanceTimelineEvent = (rawEvent: any): EnhancedTimelineEvent => {
    const eventType = determineEventType(rawEvent);
    const visualization = getVisualizationConfig(eventType, rawEvent);

    return {`,
                id: rawEvent.id || `evt_${Date.now()}`, _$
            }, { Math, : .random().toString(36).substr(2, 9) }, timestamp, new Date(rawEvent.timestamp || Date.now()), type, eventType, title, rawEvent.title || generateEventTitle(rawEvent), description, rawEvent.description || generateEventDescription(rawEvent), source, {
                type: rawEvent.source?.type || 'system',
                id: rawEvent.source?.id || 'unknown',
                name: rawEvent.source?.name || 'Unknown Source',
            }, target, rawEvent.target ? {
                type: rawEvent.target.type,
                id: rawEvent.target.id,
                name: rawEvent.target.name,
            } : undefined, data, rawEvent.data || rawEvent.payload || {}, metadata, {
                protocol: rawEvent.protocol,
                priority: rawEvent.priority || 'medium',
                duration: rawEvent.duration,
                status: rawEvent.status || 'completed',
                correlationId: rawEvent.correlationId,
                parentEventId: rawEvent.parentEventId,
                childEventIds: rawEvent.childEventIds || [],
            }, visualization);
        }
        finally { }
        ;
    };
    const determineEventType = (rawEvent) => {
        if (rawEvent.type)
            return rawEvent.type;
        if (rawEvent.protocol === 'redis')
            return 'redis_message';
        if (rawEvent.protocol === 'file')
            return 'file_protocol';
        if (rawEvent.messageType === 'handoff')
            return 'handoff';
        if (rawEvent.workflowId)
            return 'workflow_execution';
        if (rawEvent.agentId)
            return 'agent_communication';
        if (rawEvent.bridgeId)
            return 'bridge_event';
        return 'orchestration';
    };
    const getVisualizationConfig = (eventType, rawEvent) => {
        const configs = {
            agent_communication: { color: '#4CAF50', icon: '🤖', category: 'Agent' },
            workflow_execution: { color: '#2196F3', icon: '⚡', category: 'Workflow' },
            handoff: { color: '#FF9800', icon: '🔄', category: 'Handoff' },
            file_protocol: { color: '#9C27B0', icon: '📁', category: 'File' },
            redis_message: { color: '#F44336', icon: '💬', category: 'Message' },
            bridge_event: { color: '#607D8B', icon: '🌉', category: 'Bridge' },
            orchestration: { color: '#795548', icon: '🎭', category: 'System' },
        };
        const config = configs[eventType] || configs.orchestration;
        const size = rawEvent.priority === 'critical' ? 'large' :
            rawEvent.priority === 'high' ? 'medium' : 'small';
        return { ...config, size };
    };
    const generateEventTitle = (rawEvent) => {
        `
    if (rawEvent.agentId) return `;
        Agent;
        $;
        {
            rawEvent.agentId;
        }
        ` Activity;
    if (rawEvent.workflowId) return Workflow ${rawEvent.workflowId};`;
        if (rawEvent.messageType)
            return $;
        {
            rawEvent.messageType;
        }
        Message `;
    return 'System Event';
  };

  const generateEventDescription = (rawEvent: any): string => {
    if (rawEvent.action) return rawEvent.action;
    if (rawEvent.status) return Status: ${rawEvent.status};
    if (rawEvent.content) return rawEvent.content;
    return 'Event occurred in the system';
  };

  const renderTimeline = () => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create scales
    const timeScale = d3.scaleTime()
      .domain(d3.extent(filteredEvents, d => d.timestamp) as [Date, Date])
      .range([0, innerWidth]);

    // Group events based on configuration
    const groupedEvents = groupEventsByConfig(filteredEvents, visualConfig.grouping);` `
    // Create main group
    const mainGroup = svg.append('g')
      .attr('transform', `;
        translate($, { margin, : .left }, $, { margin, : .top });
        ;
        // Add background grid
        addBackgroundGrid(mainGroup, timeScale, innerHeight);
        // Add time axis
        const xAxis = d3.axisBottom(timeScale)
            .tickFormat(d3.timeFormat('%H:%M'))
            .ticks(10);
        `
`;
        mainGroup.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${innerHeight}))
      .call(xAxis);

    // Render grouped events
    Object.entries(groupedEvents).forEach(([groupKey, events], groupIndex) => {
      const yPosition = (innerHeight / Object.keys(groupedEvents).length) * groupIndex + 50;

      // Add group label
      mainGroup.append('text')
        .attr('x', -10)
        .attr('y', yPosition - 10)
        .attr('text-anchor', 'end')
        .attr('class', 'group-label')
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .text(groupKey);

      // Render events in this group
      renderEventGroup(mainGroup, events, timeScale, yPosition);
    });

    // Add connections if enabled
    if (visualConfig.showConnections) {
      addEventConnections(mainGroup, filteredEvents, timeScale);
    }

    // Add zoom behavior if enabled
    if (visualConfig.enableZoom) {
      addZoomBehavior(svg, mainGroup);
    }
  };

  const groupEventsByConfig = (events: EnhancedTimelineEvent[], grouping: string) => {
    switch (grouping) {
      case 'by_type':
        return events.reduce((groups, event) => {
          const key = event.visualization.category;
          if (!groups[key]) groups[key] = [];
          groups[key].push(event);
          return groups;
        }, {} as Record<string, EnhancedTimelineEvent[]>);
`);
    };
};
'by_source';
`
        return events.reduce((groups, event) => {
          const key = ${event.source.type}:${event.source.name}`;
if (!groups[key])
    groups[key] = [];
groups[key].push(event);
return groups;
{ }
as;
Record;
;
'by_correlation';
return events.reduce((groups, event) => {
    const key = event.metadata.correlationId || 'uncorrelated';
    if (!groups[key])
        groups[key] = [];
    groups[key].push(event);
    return groups;
}, {});
return { 'All Events': events };
;
const renderEventGroup = (parent, events, timeScale, yPosition) => {
    const eventGroups = parent.selectAll(event - group - $, { yPosition } `)
      .data(events)
      .enter()
      .append('g')
      .attr('class', event-group event-group-${yPosition})`
        .attr('transform', d => translate($, { timeScale(d) { }, : .timestamp })));
}, $, { yPosition };
`));

    // Add event circles/shapes
    eventGroups.append('circle')
      .attr('r', d => d.visualization.size === 'large' ? 8 : d.visualization.size === 'medium' ? 6 : 4)
      .attr('fill', d => d.visualization.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', handleEventHover)
      .on('mouseout', handleEventHoverOut)
      .on('click', handleEventClick);

    // Add status indicators
    eventGroups.filter((d) => Boolean(d.metadata.status))
      .append('circle')
      .attr('r', 3)
      .attr('cx', 8)
      .attr('cy', -8)
      .attr('fill', d => getStatusColor(d.metadata.status!))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    // Add priority indicators
    eventGroups.filter(d => d.metadata.priority === 'critical' || d.metadata.priority === 'high')
      .append('polygon')
      .attr('points', '0,-10 5,-15 -5,-15')
      .attr('fill', d => d.metadata.priority === 'critical' ? '#F44336' : '#FF9800')
      .style('animation', 'pulse 2s infinite');

    // Add event icons (simplified)
    eventGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '10px')
      .text(d => d.visualization.icon);
  };

  const addBackgroundGrid = (
    parent: d3.Selection<any, any, any, any>,
    timeScale: d3.ScaleTime<number, number>,
    height: number
  ) => {
    const ticks = timeScale.ticks(20);

    parent.selectAll('.grid-line')
      .data(ticks)
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', d => timeScale(d))
      .attr('x2', d => timeScale(d))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#e0e0e0')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.5);
  };

  const addEventConnections = (
    parent: d3.Selection<any, any, any, any>,
    events: EnhancedTimelineEvent[],
    timeScale: d3.ScaleTime<number, number>
  ) => {
    // Find connected events based on correlation IDs
    const connections = events.filter(e => e.metadata.correlationId)
      .reduce((conns, event) => {
        const correlationId = event.metadata.correlationId!;
        if (!conns[correlationId]) conns[correlationId] = [];
        conns[correlationId].push(event);
        return conns;
      }, {} as Record<string, EnhancedTimelineEvent[]>);

    Object.values(connections).forEach(connectedEvents => {
      if (connectedEvents.length < 2) return;

      const sortedEvents = connectedEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      for (let i = 0; i < sortedEvents.length - 1; i++) {
        const source = sortedEvents[i];
        const target = sortedEvents[i + 1];

        parent.append('line')
          .attr('class', 'connection-line')
          .attr('x1', timeScale(source.timestamp))
          .attr('y1', 100) // Simplified positioning
          .attr('x2', timeScale(target.timestamp))
          .attr('y2', 100)
          .attr('stroke', '#999')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3')
          .attr('opacity', 0.6);
      }
    });
  };

  const addZoomBehavior = (
    svg: d3.Selection<any, any, any, any>,
    mainGroup: d3.Selection<any, any, any, any>
  ) => {
    const zoom = d3.zoom()
      .scaleExtent([0.5, 10])
      .on('zoom', (event) => {
        mainGroup.attr('transform',
          `;
translate($, { margin, : .left + event.transform.x }, $, { margin, : .top });
scale($, { event, : .transform.k }, 1);
;
;
svg.call(zoom);
;
const handleEventHover = (event, d) => {
    const tooltip = d3.select(tooltipRef.current);
    tooltip.style('visibility', 'visible')
        .html(<div class="p-3 bg-white shadow-lg rounded-lg border max-w-xs">
          <div class="flex items-center gap-2 mb-2">`
            <span class="text-lg">${d.visualization.icon}</span>`
            <div class="font-bold text-sm">${d.title}`</div>
          </div>
          <div class="text-xs text-gray-600 mb-2">${d.description}</div>
          <div class="flex flex-wrap gap-1 mb-2">
            <span class="px-2 py-1 bg-gray-100 rounded text-xs">${d.type}</span>`
            <span class="px-2 py-1 bg-blue-100 rounded text-xs">${d.metadata.priority}</span>`
            ${d.metadata.status ? <span class="px-2 py-1 bg-green-100 rounded text-xs">${d.metadata.status}`</span> : ''}
          </div>
          <div class="text-xs text-gray-500">
            ${d.timestamp.toLocaleTimeString()}
          </div>
        </div>) `
      .style('left', ${event.pageX + 10}px`;
};
style('top', $, { event, : .pageY - 10 } `px);
  };

  const handleEventHoverOut = () => {
    d3.select(tooltipRef.current).style('visibility', 'hidden');
  };

  const handleEventClick = (event: MouseEvent, d: EnhancedTimelineEvent) => {
    setSelectedEvent(d);
    setShowEventDetailsModal(true);
    onEventSelect?.(d);
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      pending: '#FF9800',
      in_progress: '#2196F3',
      completed: '#4CAF50',
      failed: '#F44336',
    };
    return colors[status] || '#9E9E9E';
  };

  const createBranch = async (branchName: string, description: string) => {
    if (!selectedEvent) return;

    try {
      const newBranch: TimelineBranch = {
        id: branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, name, branchName, startEventId, selectedEvent.id, parentBranchId, activeBranchId, createdAt, new Date(), events, [], mergeStatus, 'active', metadata, {
    author: 'user',
    description,
    tags: [],
});
setBranches(prev => [...prev, newBranch]);
setActiveBranchId(newBranch.id);
onBranchCreate?.(newBranch);
setShowBranchModal(false);
try { }
catch (error) {
    console.error('Failed to create branch:', error);
}
;
const generateAnalytics = () => {
    const analytics = {
        totalEvents: filteredEvents.length,
        eventsByType: filteredEvents.reduce((acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
        }, {}),
        eventsByStatus: filteredEvents.reduce((acc, event) => {
            const status = event.metadata.status || 'unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {}),
        averageDuration: filteredEvents
            .filter(e => e.metadata.duration)
            .reduce((sum, e) => sum + (e.metadata.duration || 0), 0) /
            filteredEvents.filter(e => e.metadata.duration).length || 0,
        correlationGroups: Object.keys(filteredEvents
            .filter(e => e.metadata.correlationId)
            .reduce((acc, event) => {
            acc[event.metadata.correlationId] = true;
            return acc;
        }, {})).length,
        timeRange: {
            start: Math.min(...filteredEvents.map(e => e.timestamp.getTime())),
            end: Math.max(...filteredEvents.map(e => e.timestamp.getTime())),
            duration: Math.max(...filteredEvents.map(e => e.timestamp.getTime())) -
                Math.min(...filteredEvents.map(e => e.timestamp.getTime())),
        }
    };
    setAnalytics(analytics);
    setShowAnalyticsModal(true);
};
return (<div className="enhanced-timeline-orchestrator" ref={containerRef}>
      {/* Header Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Enhanced Timeline Orchestrator</h2>
          <div className="flex gap-2">
            {enableAnalytics && (<Button onClick={generateAnalytics} variant="outline">
                📊 Analytics
              </Button>)}
            {enableBranching && (<Button onClick={() => setShowBranchModal(true)} disabled={!selectedEvent} variant="outline">
                🌿 Create Branch
              </Button>)}
            <Button onClick={loadTimelineData} disabled={isLoading}>
              {isLoading ? '⏳' : '🔄'} Refresh
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Input placeholder="Search events..." value={filter.searchQuery} onChange={(e) => setFilter(prev => ({ ...prev, searchQuery: e.target.value }))}/>

          <select className="px-3 py-2 border rounded-md" value={visualConfig.grouping} onChange={(e) => setVisualConfig(prev => ({ ...prev, grouping: e.target.value }))}>
            <option value="none">No Grouping</option>
            <option value="by_type">Group by Type</option>
            <option value="by_source">Group by Source</option>
            <option value="by_correlation">Group by Correlation</option>
          </select>

          <select className="px-3 py-2 border rounded-md" value={visualConfig.layout} onChange={(e) => setVisualConfig(prev => ({ ...prev, layout: e.target.value }))}>
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
            <option value="circular">Circular</option>
            <option value="hierarchical">Hierarchical</option>
          </select>

          <div className="flex items-center gap-2">
            <Badge variant={enableRealTime ? 'success' : 'secondary'}>
              {enableRealTime ? '🟢 Live' : '⭕ Static'}
            </Badge>
            <Badge variant="outline">
              {filteredEvents.length} Events
            </Badge>
          </div>
        </div>

        {/* Branch Selector */}
        {enableBranching && branches.length > 1 && (<div className="flex items-center gap-2">
            <span className="text-sm font-medium">Branch:</span>
            <select className="px-3 py-2 border rounded-md" value={activeBranchId} onChange={(e) => setActiveBranchId(e.target.value)}>
              {branches.map(branch => (<option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.mergeStatus})
                </option>))}
            </select>
          </div>)}
      </div>

      {/* Timeline Visualization */}
      <Card className="p-4">
        <div className="relative">
          <svg ref={svgRef} width={width} height={height} className="timeline-svg"/>
          <div ref={tooltipRef} className="absolute pointer-events-none z-10" style={{ visibility: 'hidden'
            /  >
     }}/>
        </div>
      </Card>

      {/* Event Details Modal */}
      <Modal open={showEventDetailsModal} onOpenChange={() => setShowEventDetailsModal(false)} title="Event Details">
        {selectedEvent && (<div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedEvent.visualization.icon}</span>
              <div>
                <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                <p className="text-sm text-gray-600">{selectedEvent.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <Badge>{selectedEvent.type}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Badge variant={selectedEvent.metadata.status === 'completed' ? 'success' : 'outline'}>
                  {selectedEvent.metadata.status}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Source</label>
                <p className="text-sm">{selectedEvent.source.name} ({selectedEvent.source.type})</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Timestamp</label>
                <p className="text-sm">{selectedEvent.timestamp.toLocaleString()}</p>
              </div>
            </div>

            {selectedEvent.data && (<div>
                <label className="text-sm font-medium text-gray-700">Data</label>
                <pre className="mt-1 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(selectedEvent.data, null, 2)}
                </pre>
              </div>)}

            <div className="flex gap-2 pt-4">
              <Button onClick={() => onEventAnalyze?.(selectedEvent)} variant="outline">
                🔍 Analyze
              </Button>
              <Button onClick={() => setShowEventDetailsModal(false)}>
                Close
              </Button>
            </div>
          </div>)}
      </Modal>

      {/* Branch Creation Modal */}
      <Modal open={showBranchModal} onOpenChange={() => setShowBranchModal(false)} title="Create Timeline Branch">
        <BranchCreationForm onSubmit={createBranch} onCancel={() => setShowBranchModal(false)} selectedEvent={selectedEvent}/>
      </Modal>

      {/* Analytics Modal */}
      <Modal open={showAnalyticsModal} onOpenChange={() => setShowAnalyticsModal(false)} title="Timeline Analytics">
        <TimelineAnalytics analytics={analytics}/>
      </Modal>
    </div>);
;
// Helper Components
const BranchCreationForm = ({ onSubmit, onCancel, selectedEvent }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    return (<div className="space-y-4">
      <p className="text-sm text-gray-600">
        Create a new timeline branch starting from event: <strong>{selectedEvent?.title}</strong>
      </p>

      <Input placeholder="Branch name" value={name} onChange={(e) => setName(e.target.value)}/>

      <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)}/>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit(name, description)} disabled={!name.trim()}>
          Create Branch
        </Button>
      </div>
    </div>);
};
const TimelineAnalytics = ({ analytics }) => (<div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <Card className="p-4">
        <h4 className="font-semibold mb-2">Total Events</h4>
        <p className="text-2xl font-bold text-blue-600">{analytics.totalEvents}</p>
      </Card>

      <Card className="p-4">
        <h4 className="font-semibold mb-2">Correlation Groups</h4>
        <p className="text-2xl font-bold text-green-600">{analytics.correlationGroups}</p>
      </Card>
    </div>

    <div>
      <h4 className="font-semibold mb-2">Events by Type</h4>
      <div className="space-y-1">
        {Object.entries(analytics.eventsByType || {}).map(([type, count]) => (<div key={type} className="flex justify-between items-center">
            <span className="text-sm">{type}</span>
            <Badge variant="outline">{String(count)}</Badge>
          </div>))}
      </div>
    </div>

    <div>
      <h4 className="font-semibold mb-2">Status Distribution</h4>
      <div className="space-y-1">
        {Object.entries(analytics.eventsByStatus || {}).map(([status, count]) => (<div key={status} className="flex justify-between items-center">
            <span className="text-sm">{status}</span>
            <Badge variant="outline">{String(count)}</Badge>
          </div>))}
      </div>
    </div>

    {analytics.averageDuration > 0 && (<Card className="p-4">
        <h4 className="font-semibold mb-2">Average Duration</h4>
        <p className="text-lg">{Math.round(analytics.averageDuration)}ms</p>
      </Card>)}
  </div>);
export default EnhancedTimelineOrchestrator;
//# sourceMappingURL=EnhancedTimelineOrchestrator.js.map