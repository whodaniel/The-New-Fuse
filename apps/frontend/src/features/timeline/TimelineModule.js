import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TimelineSlider } from './components/TimelineSlider'; // Fixed import
import { EnhancedTimelineView } from './components/EnhancedTimelineView';
import { useTimeline } from './hooks/useTimeline';
import { TimelineService } from './services/timeline.service';
export var TimelineModule = function () {
    var _a = useTimeline({
        timelineService: new TimelineService()
    }), events = _a.events, branches = _a.branches, workflows = _a.workflows, currentBranchId = _a.currentBranchId, loading = _a.loading, error = _a.error, handleBranchSelect = _a.handleBranchSelect, handleEventClick = _a.handleEventClick, handleCreateBranch = _a.handleCreateBranch, handleMergeBranch = _a.handleMergeBranch;
    if (loading)
        return _jsx("div", { children: "Loading timeline data..." });
    if (error)
        return _jsxs("div", { children: ["Error: ", error.message] });
    return (_jsxs("div", { className: "timeline-module", children: [_jsx(EnhancedTimelineView, { events: events, branches: branches, workflows: workflows, currentBranchId: currentBranchId, onBranchSelect: handleBranchSelect, onEventClick: handleEventClick, onCreateBranch: handleCreateBranch, onMergeBranch: handleMergeBranch }), _jsx(TimelineSlider, { events: events, currentEventId: currentBranchId, onEventChange: handleEventClick })] }));
};
