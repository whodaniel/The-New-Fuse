import React from 'react';
import { TimelineView } from './components/TimelineView.js';
import { TimelineSlider } from './components/TimelineSlider.js'; // Fixed import
import { EnhancedTimelineView } from './components/EnhancedTimelineView.js';
import { useTimeline } from './hooks/useTimeline.js';
import { TimelineService } from './services/timeline.service.js';

export const TimelineModule: React.FC = () => {
  const {
    events,
    branches,
    workflows,
    currentBranchId,
    loading,
    error,
    handleBranchSelect,
    handleEventClick,
    handleCreateBranch,
    handleMergeBranch
  } = useTimeline({
    timelineService: new TimelineService()
  });

  if (loading) return <div>Loading timeline data...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="timeline-module">
      <EnhancedTimelineView
        events={events}
        branches={branches}
        workflows={workflows}
        currentBranchId={currentBranchId}
        onBranchSelect={handleBranchSelect}
        onEventClick={handleEventClick}
        onCreateBranch={handleCreateBranch}
        onMergeBranch={handleMergeBranch}
      />
      <TimelineSlider
        events={events}
        currentEventId={currentBranchId}
        onEventChange={handleEventClick}
      />
    </div>
  );
};