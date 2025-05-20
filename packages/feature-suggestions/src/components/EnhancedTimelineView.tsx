import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import * as d3 from 'd3';
import TimelineSlider from './TimelineSlider.js';
import { TimelineEvent, TimelineEventType } from '../types/timeline.js';
import { FeatureProgress, FeatureStage } from '@the-new-fuse/feature-tracker';
import './EnhancedTimelineView.css';

interface EventData {
    title: string;
    description: string;
    progress?: number;
    item: {
        id: string;
    };
}

interface _DragEvent extends Event {
    sourceEvent: MouseEvent;
    x: number;
    y: number;
}

interface _ZoomBehavior {
    transform: d3.ZoomTransform;
}

// NodeData remains the same, used for D3 hierarchy
interface NodeData {
    id: string;
    type: string;
    timestamp: Date;
    data: EventData;
    mergedFrom?: string[];
    parentId?: string; // Added parentId for stratify
}

interface GuidelineData {
    type: 'horizontal' | 'vertical';
    pos: number;
}

interface ColorValue extends ColorScheme {
    gradient?: string;
}

interface Colors {
    [key: string]: ColorValue | {
        active: string;
        merged: string;
        inactive: string;
    };
}

const colors: Colors = {
    suggestion: {
        bg: '#818CF8',
        bgHover: '#6366F1',
        text: '#FFFFFF',
        gradient: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)'
    },
    todo: {
        bg: '#34D399',
        bgHover: '#10B981',
        text: '#FFFFFF',
        gradient: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)'
    },
    feature: {
        bg: '#F59E0B',
        bgHover: '#D97706',
        text: '#FFFFFF',
        gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
    },
    workflow: {
        bg: '#8B5CF6',
        bgHover: '#7C3AED',
        text: '#FFFFFF',
        gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
    },
    agent: {
        bg: '#EC4899',
        bgHover: '#DB2777',
        text: '#FFFFFF',
        gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)'
    },
    branch: {
        active: '#10B981',
        merged: '#6366F1',
        inactive: '#9CA3AF'
    }
};

// Event interface remains the same for component props
interface Event {
    id: string;
    type: string;
    timestamp: Date | string;
    data: EventData;
    parentId?: string;
    mergedFrom?: string[];
}

interface Branch {
    id: string;
    name: string;
    startEvent: string;
    endEvent?: string;
    active: boolean;
}

interface Workflow {
    id: string;
    name: string;
    timeRange?: {
        startDate: Date | string; // Allow string dates
        endDate: Date | string;   // Allow string dates
    };
}

interface EnhancedTimelineViewProps {
    events: Event[];
    branches: Branch[];
    workflows: Workflow[];
    onEventClick?: (event: Event) => void;
    onCreateBranch?: (eventId: string, branchName: string) => void;
    onAddNote?: (eventId: string, note: Note) => void;
    onEventMove?: (eventId: string, position: { x: number; y: number }) => void;
}

interface ColorScheme {
    bg: string;
    bgHover: string;
    text: string;
    gradient?: string;
}

interface Note {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    author: string;
    color: string;
}

// Rename unused interfaces with underscore prefix
interface _TimelineRange {
    id: string;
    startDate: Date;
    endDate: Date;
    type: string;
    color: string;
    label: string;
}

// Remove unused _D3Node, _D3Event, _D3Selection, _D3Link
// interface _D3Node { ... }
// interface _D3Event { ... }
// interface _D3Selection { ... }
// interface _D3Link { ... }

// Add proper D3.js types
// Use d3.D3DragEvent directly, specifying element and datum types
type EnhancedDragEvent = d3.D3DragEvent<SVGGElement, d3.HierarchyPointNode<NodeData>, { x: number; y: number }>; // Subject is {x, y} position

interface D3ZoomEvent extends d3.D3ZoomEvent<SVGSVGElement, undefined> {
    // Inherits transform and sourceEvent from d3.D3ZoomEvent
}


// Remove custom D3HierarchyLink and D3HierarchyNode, use d3 types directly
// interface D3HierarchyLink { ... }
// interface D3HierarchyNode { ... }

// Remove D3Element, use SVGGElement directly in drag behavior
// interface D3Element extends Element { ... }

// Remove D3MouseEvent, use standard MouseEvent
// interface D3MouseEvent extends MouseEvent { ... }


export const EnhancedTimelineView: React.FC<EnhancedTimelineViewProps> = ({
    events,
    branches,
    workflows,
    onEventClick,
    onCreateBranch,
    onAddNote,
    onEventMove
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
    const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [zoom, setZoom] = useState(1);
    const [dragState, setDragState] = useState({
        isDragging: false,
        startPosition: null as { x: number; y: number } | null,
        currentPosition: null as { x: number; y: number } | null
    });
    const [showBranchForm, setShowBranchForm] = useState(false);
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const [noteContent, setNoteContent] = useState('');

    const handleZoom = useCallback((event: D3ZoomEvent) => {
        if (!svgRef.current) return;
        const { transform } = event;
        setZoom(transform.k);
        const svg = d3.select(svgRef.current);
        svg.select('g.main-group')
            // No transition needed here, zoom is continuous
            .attr('transform', transform.toString());
    }, []);

    // Update handleDrag to use the specific EnhancedDragEvent type
    const handleDrag = useCallback((event: EnhancedDragEvent) => {
        if (!event.sourceEvent || !event.sourceEvent.target) return;
        // Select the SVGGElement being dragged ('this' context within d3.drag)
        const node = d3.select(event.sourceEvent.currentTarget as SVGGElement); // Use currentTarget

        node.raise(); // Bring to front
        const snapGrid = 20;
        // Use event.x and event.y which are relative to the container
        const x = Math.round(event.x / snapGrid) * snapGrid;
        const y = Math.round(event.y / snapGrid) * snapGrid;
        node.attr('transform', `translate(${x},${y})`);
        setDragState(prev => ({
            ...prev,
            isDragging: true,
            currentPosition: { x, y }
        }));

        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll('.guideline').remove();
        const guidelineData: GuidelineData[] = [
            { type: 'horizontal', pos: y },
            { type: 'vertical', pos: x }
        ];
        // Ensure guidelines are appended to the main group or SVG root, not the dragged node
        const mainGroup = svg.select('g.main-group');
        mainGroup.selectAll('.guideline')
            .data(guidelineData)
            .join('line')
            .attr('class', 'guideline')
            .attr('stroke', '#94A3B8')
            .attr('stroke-width', 1 / zoom) // Make guidelines thinner when zoomed out
            .attr('stroke-dasharray', '4,4')
            .attr('x1', d => d.type === 'vertical' ? d.pos : -10000) // Extend lines further
            .attr('y1', d => d.type === 'horizontal' ? d.pos : -10000)
            .attr('x2', d => d.type === 'vertical' ? d.pos : 10000)
            .attr('y2', d => d.type === 'horizontal' ? d.pos : 10000)
            .lower(); // Place guidelines behind nodes
    }, [zoom]); // Add zoom as dependency for guideline stroke width


    // Update initializeDrag with correct element and datum types
    // Use a more flexible type annotation for d3.select
    const initializeDrag = useCallback(() => {
        return d3.drag<any, d3.HierarchyPointNode<NodeData>>() // Use 'any' for element type to avoid strict typing issues
            .subject(function(d) {
                // The subject defines the coordinate system for event.x/y
                // We return the current translation coords {x, y} of the element
                const node = d3.select(this);
                const transform = node.attr('transform');
                const translate = transform ? transform.substring(transform.indexOf("(") + 1, transform.indexOf(")")).split(",") : ['0', '0'];
                return { x: parseFloat(translate[0]), y: parseFloat(translate[1]) };
            })
            .on('start', function(event) {
                const node = d3.select(this);
                node.attr('cursor', 'grabbing')
                    .raise() // Bring to front on start
                    .transition()
                    .duration(200)
                    .attr('filter', 'url(#glow)');

                // Use subject coordinates provided by d3.drag for start position
                const startPos = { x: event.subject.x, y: event.subject.y };

                setDragState({
                    isDragging: true,
                    startPosition: startPos,
                    currentPosition: startPos
                });
            })
            .on('drag', handleDrag) // handleDrag already uses EnhancedDragEvent
            .on('end', function(event) {
                const node = d3.select(this);
                node.attr('cursor', 'grab')
                    .transition()
                    .duration(200)
                    .attr('filter', null);

                d3.select(svgRef.current)
                    .selectAll('.guideline')
                    .remove();

                // Use a more aggressive type assertion for datum
                const datum = d3.select(this).datum() as any;
                if (onEventMove && datum && datum.data && datum.data.id) {
                    const eventId = datum.data.id;
                    // Pass the final position from the drag event (event.x, event.y)
                    const finalPos = { x: event.x, y: event.y };
                    onEventMove(eventId, finalPos);
                }
                setDragState({
                    isDragging: false,
                    startPosition: null,
                    currentPosition: null
                });
            });
    }, [handleDrag, onEventMove]); // Removed dragState dependency


    const initializeZoom = useCallback(() => {
        if (!svgRef.current) return;
        const svg = d3.select<SVGSVGElement, undefined>(svgRef.current);
        const zoomBehavior = d3.zoom<SVGSVGElement, undefined>()
            .scaleExtent([0.1, 4])
            .translateExtent([[-2000, -2000], [2000, 2000]]) // Adjust extent if needed
            .filter((event: WheelEvent | MouseEvent | TouchEvent) => {
                // Allow wheel zoom only without ctrlKey
                if (event.type === 'wheel') return !event.ctrlKey;
                // Allow pan (mousedown/mousemove) only with button 0 (left) and no ctrlKey
                // Also check if the target is the SVG itself or the background rect, not a node
                if (event.type === 'mousedown') {
                    const target = event.target as Element;
                    return (event as MouseEvent).button === 0 && !event.ctrlKey && (target === svg.node() || target.classList.contains('grid-background'));
                }
                // Allow touch zoom/pan
                return event.type.startsWith('touch');
            })
            .on('zoom', handleZoom);

        svg.call(zoomBehavior)
            .call(zoomBehavior.transform, d3.zoomIdentity); // Initialize zoom

        // Prevent double-click zoom
        svg.on('dblclick.zoom', null);

        // Prevent default touch behavior like scrolling when interacting with SVG background
        svg.on('touchstart.zoom', (event: TouchEvent) => {
             const target = event.target as Element;
             if (target === svg.node() || target.classList.contains('grid-background')) {
                event.preventDefault();
             }
        }, { passive: false });
        svg.on('touchmove.zoom', (event: TouchEvent) => {
             const target = event.target as Element;
             if (target === svg.node() || target.classList.contains('grid-background')) {
                event.preventDefault();
             }
        }, { passive: false });


        return () => {
            svg.on('.zoom', null); // Clean up zoom listeners
            svg.on('touchstart.zoom', null);
            svg.on('touchmove.zoom', null);
        };
    }, [handleZoom]);

    const handleEventClick = useCallback((event: Event) => {
        setSelectedEvent(event);
        onEventClick?.(event);
    }, [onEventClick]);

    const handleAddNote = useCallback((date: Date, content: string) => {
        if (!onAddNote) return;

        const note = {
            id: `note-${Date.now()}`,
            content,
            createdAt: new Date(),
            updatedAt: new Date(),
            author: 'Current User', // Replace with actual user later
            color: '#6B7280',
        };

        // Find the event closest to the clicked date on the slider
        const nearestEvent = events.reduce((nearest, event) => {
            const eventTime = new Date(event.timestamp).getTime();
            const nearestTime = new Date(nearest.timestamp).getTime();
            const dateTargetTime = date.getTime();
            const currentDiff = Math.abs(eventTime - dateTargetTime);
            const nearestDiff = Math.abs(nearestTime - dateTargetTime);
            return currentDiff < nearestDiff ? event : nearest;
        });

        onAddNote(nearestEvent.id, note); // Associate note with the nearest event
        setShowNoteForm(false);
        setNoteContent('');
    }, [events, onAddNote]);

    // Map events to TimelineEvent format expected by TimelineSlider
    const processedEvents: TimelineEvent[] = useMemo(() => {
        return events.map(event => {
            // Creating a fully compatible TimelineEvent object
            const timelineEvent: TimelineEvent = {
                id: event.id,
                parentId: event.parentId,
                // Ensure type is cast correctly and timestamp is a string
                type: event.type.toUpperCase() as TimelineEventType,
                timestamp: typeof event.timestamp === 'string' ? event.timestamp : event.timestamp.toISOString(),
                mergedFrom: event.mergedFrom,
                data: {
                    title: event.data.title,
                    description: event.data.description || '',
                    item: event.data.item,
                    // Don't include progress or other properties here to avoid overwriting
                }
            };
            
            // Conditionally add progress property
            if (typeof event.data.progress === 'number') {
                // Use a proper FeatureProgress object (mock) if progress is a number
                const featureProgress = {
                    featureId: event.id,
                    name: event.data.title,
                    description: event.data.description || '',
                    currentStage: 'IN_PROGRESS' as FeatureStage,
                    completionPercentage: event.data.progress || 0,
                    metrics: {} as any,
                    qualitativeAssessment: {} as any,
                    stageHistory: [] as any[],
                    dependencies: [] as string[],
                    startTime: new Date(),
                    lastUpdated: new Date()
                };
                timelineEvent.data.progress = featureProgress;
            }
            return timelineEvent;
        });
    }, [events]);

    // Map workflows to the format expected by TimelineSlider's 'ranges' prop
    const timelineRanges = useMemo(() => {
        return workflows.map(workflow => ({
            id: workflow.id,
            // Ensure dates are Date objects or valid date strings
            startDate: workflow.timeRange?.startDate || new Date(0), // Default to epoch if undefined
            endDate: workflow.timeRange?.endDate || new Date(),     // Default to now if undefined
            type: 'workflow', // Use a consistent type identifier
            color: (colors.workflow as ColorValue).bg, // Use ColorValue type assertion
            label: workflow.name
        }));
    }, [workflows]);


    useEffect(() => {
        if (!svgRef.current || !containerRef.current || !events.length) return;

        const container = containerRef.current;
        const boundingRect = container.getBoundingClientRect();
        const width = boundingRect.width;
        const height = boundingRect.height;
        const margin = { top: 40, right: 40, bottom: 40, left: 40 };

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous render
        svg.attr('width', width)
            .attr('height', height);

        const defs = svg.append('defs');

        // Define gradients
        Object.entries(colors).forEach(([type, colorDef]) => {
            if (typeof colorDef === 'object' && 'gradient' in colorDef) {
                const color = colorDef as ColorValue; // Type assertion
                const gradient = defs.append('linearGradient')
                    .attr('id', `gradient-${type}`)
                    .attr('x1', '0%').attr('y1', '0%')
                    .attr('x2', '100%').attr('y2', '100%');

                gradient.append('stop').attr('offset', '0%').attr('stop-color', color.bg).attr('stop-opacity', 0.9);
                gradient.append('stop').attr('offset', '50%').attr('stop-color', color.bgHover).attr('stop-opacity', 0.95);
                // Extract end color from gradient string if possible, otherwise fallback
                const endColor = color.gradient?.split(' ').pop() || color.bgHover;
                gradient.append('stop').attr('offset', '100%').attr('stop-color', endColor).attr('stop-opacity', 1);
            }
        });


        // Define glow filter
        const filter = defs.append('filter')
            .attr('id', 'glow')
            .attr('x', '-50%').attr('y', '-50%')
            .attr('width', '200%').attr('height', '200%');
        filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
        filter.append('feGaussianBlur').attr('stdDeviation', '1').attr('result', 'innerGlow');
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'innerGlow');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Define grid pattern
        const gridPattern = defs.append('pattern')
            .attr('id', 'grid')
            .attr('width', 20).attr('height', 20)
            .attr('patternUnits', 'userSpaceOnUse');
        gridPattern.append('path')
            .attr('d', 'M 20 0 L 0 0 0 20')
            .attr('fill', 'none').attr('stroke', '#E2E8F0').attr('stroke-width', '0.5');

        // Main group for zoom/pan
        const g = svg.append('g')
            .attr('class', 'main-group');
            // Initial transform is handled by initializeZoom

        // Add grid background to the main group
        g.append('rect')
            .attr('class', 'grid-background') // Add class for zoom filter
            .attr('width', width * 4) // Make grid larger to cover zoomed-out area
            .attr('height', height * 4)
            .attr('x', -width * 1.5) // Center the large grid
            .attr('y', -height * 1.5)
            .attr('fill', 'url(#grid)')
            .attr('opacity', 0.2);

        // --- D3 Hierarchy Setup ---
        const treeLayout = d3.tree<NodeData>()
            // Adjust size dynamically or set a large fixed size
            .size([height * 2, width * 2]) // Use a larger size for layout
            .separation((a, b) => (a.parent === b.parent ? 2.5 : 4));

        // Map events to NodeData structure for hierarchy, including parentId
        const nodeDataEvents: NodeData[] = events.map(e => ({
            id: e.id,
            type: e.type,
            timestamp: new Date(e.timestamp), // Ensure timestamp is Date object
            data: e.data,
            mergedFrom: e.mergedFrom,
            parentId: e.parentId, // Include parentId
        }));

        // Create hierarchy using d3.stratify or d3.hierarchy
        let rootNode: d3.HierarchyNode<NodeData>;
        try {
             // d3.stratify requires a single root with a null/undefined parentId in the input data
             // If multiple events lack parentId, or if parentIds create cycles, stratify will fail.
             // We add a virtual root *if* stratify fails or if there isn't a single natural root.

             const rootCandidates = nodeDataEvents.filter(e => !e.parentId);
             const hasParentIds = nodeDataEvents.some(e => e.parentId);
             let useStratify = false;

             if (rootCandidates.length === 1 && hasParentIds) {
                 // Check for cycles or other issues before attempting stratify
                 try {
                     // Test stratify without assigning to rootNode yet
                     d3.stratify<NodeData>()
                        .id(d => d.id)
                        .parentId(d => d.parentId)(nodeDataEvents);
                     useStratify = true; // If it doesn't throw, we can use stratify
                 } catch (stratifyError) {
                     console.warn("Stratify failed, likely due to data structure issues (e.g., cycles, multiple roots). Falling back to virtual root.", stratifyError);
                 }
             }

             if (useStratify) {
                 rootNode = d3.stratify<NodeData>()
                    .id(d => d.id)
                    .parentId(d => d.parentId)(nodeDataEvents);
             } else {
                 // If stratify isn't suitable, use hierarchy with a virtual root
                 if (!useStratify && rootCandidates.length !== 1) { // Log warning if not already logged by stratify failure
                    console.warn("Data doesn't form a single tree structure or lacks parent IDs. Creating virtual root.");
                 }
                 const virtualRootData: NodeData = {
                     id: 'virtual-root', type: 'VIRTUAL', timestamp: new Date(0),
                     data: { title: 'Root', description: '', item: { id: 'root' } }, mergedFrom: [], parentId: undefined
                 };
                 // Children of virtual root are nodes without a parent in the original data
                 const rootChildren = nodeDataEvents.filter(e => !e.parentId || !nodeDataEvents.find(p => p.id === e.parentId));
                 rootNode = d3.hierarchy<NodeData>(virtualRootData, (d) => {
                     if (d.id === 'virtual-root') return rootChildren;
                     // Find children for non-virtual nodes
                     return nodeDataEvents.filter(child => child.parentId === d.id);
                 });
             }

        } catch (error) {
            // Catch any unexpected errors during hierarchy creation
            console.error("Unexpected error creating hierarchy, falling back to basic virtual root:", error);
             const virtualRootData: NodeData = {
                 id: 'virtual-root', type: 'VIRTUAL', timestamp: new Date(0),
                 data: { title: 'Root', description: '', item: { id: 'root' } }, mergedFrom: [], parentId: undefined
             };
             const rootChildren = nodeDataEvents.filter(e => !e.parentId || !nodeDataEvents.find(p => e.parentId === p.id));
             rootNode = d3.hierarchy<NodeData>(virtualRootData, d => d.id === 'virtual-root' ? rootChildren : nodeDataEvents.filter(child => child.parentId === d.id));
        }


        const nodes = treeLayout(rootNode);

        // Use D3's HierarchyPointLink and HierarchyPointNode directly
        const linkGenerator = d3.linkHorizontal<d3.HierarchyPointLink<NodeData>, d3.HierarchyPointNode<NodeData>>()
            .x(d => d.y) // Use y for horizontal position (tree grows right)
            .y(d => d.x); // Use x for vertical position

        // --- Render Links ---
        g.append('g')
            .attr('class', 'links')
            .selectAll('path')
            // Filter out links originating from the virtual root if it exists
            .data(nodes.links().filter(link => link.source.data.id !== 'virtual-root'))
            .join('path')
            .attr('d', d => linkGenerator(d as d3.HierarchyPointLink<NodeData>)) // Cast d
            .attr('stroke', (d: d3.HierarchyPointLink<NodeData>) => { // Use D3 type
                const sourceEvent = d.source.data;
                const targetEvent = d.target.data;
                const branchColor = colors.branch as { active: string; merged: string; inactive: string }; // Type assertion
                if (sourceEvent.mergedFrom?.includes(targetEvent.id))
                    return branchColor.merged;
                // Check parent relationship using hierarchy structure
                if (d.target.parent && d.target.parent.id === d.source.id)
                    return branchColor.active;
                return branchColor.inactive; // Default link color
            })
            .attr('stroke-width', (d: d3.HierarchyPointLink<NodeData>) => // Use D3 type
                d.source.data.mergedFrom?.includes(d.target.data.id) ? 3 : 2)
            .attr('fill', 'none')
            .attr('pointer-events', 'none')
            .style('stroke-dasharray', (d: d3.HierarchyPointLink<NodeData>) => // Use D3 type
                d.source.data.mergedFrom?.includes(d.target.data.id) ? '0' : '5,5')
            .style('opacity', 0.7)
            .transition()
            .duration(500)
            .style('opacity', 1);

        // --- Render Nodes ---
        const nodeGroup = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            // Filter out the virtual root node itself
            .data(nodes.descendants().filter(d => d.data.id !== 'virtual-root'))
            .join('g')
            .attr('class', 'node')
            .attr('transform', (d: d3.HierarchyPointNode<NodeData>) => `translate(${d.y},${d.x})`) // Use D3 type, swap x/y for horizontal tree
            .attr('cursor', 'grab')
            // Fix the call method typing by using call directly with a type assertion to bypass strict typing
            .call(initializeDrag() as any); // Type assertion to avoid TypeScript errors

        const cardWidth = 160;
        const cardHeight = 90;

        // Update node group each function
        nodeGroup.each(function(this: SVGGElement, d: d3.HierarchyPointNode<NodeData>) { // Use D3 type
            const node = d3.select(this);
            const nodeData = d.data; // This is NodeData

            // Clear previous contents if re-rendering
            node.selectAll('*').remove();

            const card = node.append('g')
                .attr('class', 'card');
                // Removed style cursor grab here, applied on the main node group

            card.append('rect')
                .attr('rx', 12).attr('ry', 12)
                .attr('x', -cardWidth / 2).attr('y', -cardHeight / 2)
                .attr('width', cardWidth).attr('height', cardHeight)
                .attr('fill', `url(#gradient-${nodeData.type.toLowerCase()})`)
                .attr('filter', hoveredEvent === nodeData.id ? 'url(#glow)' : null)
                .attr('stroke', '#FFFFFF').attr('stroke-opacity', 0.1).attr('stroke-width', 1)
                .on('mouseover', function(this: SVGRectElement, event: MouseEvent) { // Use standard MouseEvent
                    if (event.buttons) return; // Ignore if dragging
                    setHoveredEvent(nodeData.id);
                    setHoveredPosition({ x: event.pageX, y: event.pageY });
                    // Select the parent 'g.card' for transform and filter
                    d3.select(this.parentNode as SVGGElement)
                        .transition().duration(200)
                        .attr('transform', 'scale(1.05)')
                        .select('rect') // Apply filter to rect specifically if needed
                        .attr('filter', 'url(#glow)');
                })
                .on('mouseout', function(this: SVGRectElement) { // Use standard MouseEvent
                    setHoveredEvent(null);
                    setHoveredPosition(null);
                    // Select the parent 'g.card' for transform and filter removal
                    d3.select(this.parentNode as SVGGElement)
                        .transition().duration(200)
                        .attr('transform', null)
                        .select('rect')
                        .attr('filter', null);
                })
                .on('click', (event: MouseEvent) => { // Use standard MouseEvent
                    event.stopPropagation(); // Prevent triggering zoom/pan on card click
                    // Map NodeData back to Event structure for the handler
                    const eventDataForHandler: Event = {
                        id: nodeData.id,
                        type: nodeData.type,
                        timestamp: nodeData.timestamp, // Pass Date object
                        data: nodeData.data,
                        // Get parentId from the hierarchy node d, avoid virtual root
                        parentId: d.parent?.data.id === 'virtual-root' ? undefined : d.parent?.data.id,
                        mergedFrom: nodeData.mergedFrom
                    };
                    handleEventClick(eventDataForHandler);
                });

            const title = card.append('text')
                .attr('dy', -cardHeight / 4)
                .attr('text-anchor', 'middle')
                .attr('fill', 'white').attr('font-size', '14px').attr('font-weight', 'bold')
                .attr('pointer-events', 'none')
                .text(nodeData.data.title); // Use nodeData

            // Text wrapping logic (ensure titleElement is not null)
            const titleElement = title.node();
            if (titleElement) {
                let text = nodeData.data.title;
                if (titleElement.getComputedTextLength() > cardWidth - 20) { // Check length
                    while (titleElement.getComputedTextLength() > cardWidth - 30 && text.length > 0) { // Adjust threshold
                        text = text.slice(0, -1);
                        title.text(text + '...'); // Update text during check
                    }
                    // Final update after loop if needed (already done inside loop)
                    // title.text(text + '...');
                }
            }

            card.append('text')
                .attr('dy', 0) // Adjust vertical position
                .attr('text-anchor', 'middle')
                .attr('fill', 'rgba(255, 255, 255, 0.9)').attr('font-size', '12px')
                .attr('pointer-events', 'none')
                .text(format(nodeData.timestamp, 'MMM d, yyyy')); // Use nodeData

            // Badge for event type
            const badge = card.append('g')
                .attr('transform', `translate(${cardWidth / 2 - 40}, ${-cardHeight / 2 + 15})`);
            badge.append('rect')
                .attr('rx', 9).attr('ry', 9)
                .attr('width', 70).attr('height', 18)
                .attr('fill', 'rgba(255, 255, 255, 0.15)');
            badge.append('text')
                .attr('x', 35).attr('y', 13) // Center text in badge
                .attr('text-anchor', 'middle')
                .attr('fill', 'white').attr('font-size', '10px').attr('font-weight', 'medium')
                .attr('pointer-events', 'none')
                .text(nodeData.type); // Use nodeData

            // Progress bar if applicable
            if (nodeData.data.progress !== undefined) { // Use nodeData
                const progressWidth = cardWidth - 40;
                const progressHeight = 4;
                const progressGroup = card.append('g')
                    .attr('class', 'progress')
                    .attr('transform', `translate(0,${cardHeight / 2 - 15})`); // Position at bottom

                progressGroup.append('rect') // Background track
                    .attr('x', -progressWidth / 2).attr('y', 0)
                    .attr('width', progressWidth).attr('height', progressHeight)
                    .attr('rx', 2).attr('fill', 'rgba(255, 255, 255, 0.2)');

                const progress = progressGroup.append('rect') // Filled progress
                    .attr('x', -progressWidth / 2).attr('y', 0)
                    .attr('width', 0) // Start at 0 width
                    .attr('height', progressHeight)
                    .attr('rx', 2).attr('fill', 'rgba(255, 255, 255, 0.9)');

                progress.transition() // Animate width
                    .duration(1000).ease(d3.easeQuadOut)
                    .attr('width', progressWidth * (nodeData.data.progress / 100)); // Use nodeData

                progressGroup.append('text') // Percentage text
                    .attr('x', progressWidth / 2 + 10) // Position text to the right
                    .attr('y', progressHeight) // Align text with bottom of bar
                    .attr('text-anchor', 'start')
                    .attr('fill', 'rgba(255, 255, 255, 0.9)').attr('font-size', '10px')
                    .text(`${nodeData.data.progress}%`); // Use nodeData
            }
        });

        // Initialize zoom behavior after rendering everything else
        const cleanupZoom = initializeZoom();

        // Cleanup function for useEffect
        return () => {
            cleanupZoom?.(); // Call the zoom cleanup function
            // Potentially remove drag listeners if necessary, though d3 might handle this
        };

    // Rerun effect if events, dimensions, or handlers change
    }, [events, branches, workflows, hoveredEvent, handleZoom, handleEventClick, initializeZoom, handleDrag, initializeDrag, onEventMove]); // Added onEventMove dependency


    return (
        <div className="relative w-full h-full bg-gray-50 rounded-xl shadow-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="h-16 bg-white shadow-sm px-6 flex items-center justify-between z-10 flex-shrink-0">
                <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-bold text-gray-800">Timeline View</h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => {
                                const svg = d3.select(svgRef.current);
                                // Create a temporary zoom behavior just for resetting the transform
                                const tempZoomBehavior = d3.zoom<SVGSVGElement, undefined>();
                                // Use a custom implementation to apply the transform directly
                                svg.transition()
                                   .duration(300)
                                   // Apply zoomIdentity directly to the transform attribute of main-group
                                   .on('end', () => {
                                       svg.select('g.main-group').attr('transform', d3.zoomIdentity.toString());
                                       setZoom(1); // Reset zoom state
                                   });
                                // Animate the transform attributes directly
                                const mainGroup = svg.select('g.main-group');
                                mainGroup.transition()
                                   .duration(300)
                                   .attr('transform', d3.zoomIdentity.toString());
                            }}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                            Reset Zoom
                        </button>
                        <span className="text-sm text-gray-500">{Math.round(zoom * 100)}%</span>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setShowBranchForm(true)}
                        disabled={!selectedEvent}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create Branch
                    </button>
                    <button
                        onClick={() => setShowNoteForm(true)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                        Add Note
                    </button>
                </div>
            </div>

            {/* Timeline Slider */}
            <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <TimelineSlider
                    events={processedEvents} // Pass the correctly typed array
                    ranges={timelineRanges} // Pass the timeline ranges
                    onAddNote={onAddNote ? handleAddNote : undefined} // Pass the add note handler
                    // Adjust onEventClick if its signature differs from TimelineSlider's expectation
                    // Cast needed if Event (from EnhancedTimelineView) != TimelineEvent (expected by Slider)
                    onEventClick={onEventClick ? (e: TimelineEvent) => {
                         // Find the original Event object to pass to the handler
                         const originalEvent = events.find(orig => orig.id === e.id);
                         if (originalEvent) {
                            // Ensure timestamp is Date object if handler expects it
                            const eventToPass = {
                                ...originalEvent,
                                timestamp: new Date(originalEvent.timestamp)
                            };
                            handleEventClick(eventToPass);
                         }
                    } : undefined}
                    onRangeSelect={(_start: Date, _end: Date) => {
                        // Handle range selection if needed
                        console.log("Range selected:", _start, _end);
                    }}
                />
            </div>

            {/* Main SVG Container */}
            <div ref={containerRef} className="flex-1 overflow-hidden relative"> {/* Added relative positioning */}
                <svg ref={svgRef} className="absolute top-0 left-0 w-full h-full"/> {/* Use absolute positioning */}
            </div>

            {/* Modals and Tooltip */}
            {showBranchForm && selectedEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-lg font-bold mb-4">Create New Branch from "{selectedEvent.data.title}"</h3>
                        <input
                            type="text"
                            value={newBranchName}
                            onChange={(e) => setNewBranchName(e.target.value)}
                            placeholder="Branch name"
                            className="w-full px-3 py-2 border rounded-lg mb-4"
                        />
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => { setShowBranchForm(false); setNewBranchName(''); }} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                            <button
                                onClick={() => {
                                    if (newBranchName.trim() && selectedEvent && onCreateBranch) {
                                        onCreateBranch(selectedEvent.id, newBranchName);
                                        setShowBranchForm(false);
                                        setNewBranchName('');
                                    }
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >Create</button>
                        </div>
                    </div>
                </div>
            )}

            {showNoteForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-lg font-bold mb-4">Add Note</h3>
                        <textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            placeholder="Enter your note..."
                            className="w-full px-3 py-2 border rounded-lg mb-4 h-32 resize-none"
                        />
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => { setShowNoteForm(false); setNoteContent(''); }} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                            <button
                                onClick={() => {
                                    if (noteContent.trim()) {
                                        // Use current date for note placement, handleAddNote will find nearest event
                                        handleAddNote(new Date(), noteContent);
                                    }
                                }}
                                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                            >Add Note</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tooltip */}
            <div
                className={`tooltip-container ${hoveredEvent && hoveredPosition ? 'visible' : 'hidden'}`}
                style={hoveredPosition ? { left: `${hoveredPosition.x + 10}px`, top: `${hoveredPosition.y + 10}px` } : {}}
            >
                <div className="tooltip-content">
                    {hoveredEvent && events.find(e => e.id === hoveredEvent)?.data.description}
                </div>
            </div>
        </div>
    );
};

export default EnhancedTimelineView;
