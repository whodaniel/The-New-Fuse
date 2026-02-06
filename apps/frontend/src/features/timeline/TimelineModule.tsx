import React from 'react';
import { EnhancedTimelineView } from './components/EnhancedTimelineView';
import { TimelineSlider } from './components/TimelineSlider'; // Fixed import
import { useTimeline } from './hooks/useTimeline';
import { TimelineService } from './services/timeline.service';

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
    handleMergeBranch,
  } = useTimeline({
    timelineService: new TimelineService(),
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
