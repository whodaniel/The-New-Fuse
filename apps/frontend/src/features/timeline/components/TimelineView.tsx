import { addDays, differenceInDays, format, isToday, startOfDay } from 'date-fns';
import React, { useEffect, useMemo, useRef, useState } from 'react';

interface TimelineProps {
  plans: any[];
  onRecordClick?: (record: any) => void;
  onRecordUpdate?: (recordId: string, data: any) => void;
}

const COLUMN_WIDTH = 100; // px per day
const SIDEBAR_WIDTH = 240;

const TimelineView: React.FC<TimelineProps> = ({ plans, onRecordClick, onRecordUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nowPosition, setNowBarPosition] = useState(0);

  // Drag State
  const [draggingRecord, setDraggingRecord] = useState<any>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragCurrentX, setDragCurrentX] = useState(0);

  // Calculate date range
  const { minDate, maxDate, days } = useMemo(() => {
    const allRecords = plans.flatMap((p) => p.records || []);
    if (allRecords.length === 0) {
      const today = startOfDay(new Date());
      return { minDate: today, maxDate: addDays(today, 14), days: 14 };
    }

    const dates = allRecords.flatMap((r) => [
      r.startTime ? new Date(r.startTime) : new Date(),
      r.endTime ? new Date(r.endTime) : addDays(new Date(), 1),
    ]);

    let min = new Date(Math.min(...dates.map((d) => d.getTime())));
    let max = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Padding
    min = startOfDay(addDays(min, -2));
    max = startOfDay(addDays(max, 10));

    return {
      minDate: min,
      maxDate: max,
      days: differenceInDays(max, min) + 1,
    };
  }, [plans]);

  // Update "Now" bar position
  useEffect(() => {
    const updateNow = () => {
      const now = new Date();
      if (now >= minDate && now <= maxDate) {
        const diff = (now.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
        setNowBarPosition(diff * COLUMN_WIDTH);
      }
    };
    updateNow();
    const interval = setInterval(updateNow, 60000);
    return () => clearInterval(interval);
  }, [minDate, maxDate]);

  const handleDragStart = (e: React.MouseEvent, record: any) => {
    setDraggingRecord(record);
    setDragStartX(e.clientX);
    setDragCurrentX(e.clientX);
    e.stopPropagation();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingRecord) {
      setDragCurrentX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    if (draggingRecord) {
      const diffPx = dragCurrentX - dragStartX;
      const diffDays = Math.round(diffPx / COLUMN_WIDTH);

      if (diffDays !== 0) {
        const currentStart = new Date(draggingRecord.startTime || new Date());
        const currentEnd = new Date(draggingRecord.endTime || addDays(currentStart, 1));

        const newStart = addDays(currentStart, diffDays);
        const newEnd = addDays(currentEnd, diffDays);

        onRecordUpdate?.(draggingRecord.id, {
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
        });
      }
    }
    setDraggingRecord(null);
  };

  const dateHeaders = useMemo(() => {
    return Array.from({ length: days }).map((_, i) => addDays(minDate, i));
  }, [minDate, days]);

  return (
    <div
      className="flex flex-col h-full bg-[#0f111a] text-slate-300 font-sans select-none overflow-hidden border border-slate-800 rounded-lg relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Timeline Header */}
      <div className="flex border-b border-slate-800 bg-[#161922] sticky top-0 z-30">
        <div
          className="flex-shrink-0 border-r border-slate-800 flex items-center px-4 font-semibold text-sm"
          style={{ width: SIDEBAR_WIDTH }}
        >
          Projects & Tasks
        </div>
        <div className="flex overflow-hidden">
          {dateHeaders.map((date, i) => (
            <div
              key={i}
              className={`flex-shrink-0 border-r border-slate-800/50 flex flex-col items-center justify-center text-[10px] uppercase tracking-wider ${isToday(date) ? 'bg-sky-500/10 text-sky-400' : ''}`}
              style={{ width: COLUMN_WIDTH }}
            >
              <span className="opacity-50">{format(date, 'MMM')}</span>
              <span className="text-sm font-bold">{format(date, 'd')}</span>
              <span className="opacity-50 text-[8px]">{format(date, 'EEE')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Body */}
      <div ref={containerRef} className="flex-grow overflow-auto custom-scrollbar relative">
        {/* The Now Bar */}
        <div
          className="absolute top-0 bottom-0 w-px bg-sky-500 z-20 pointer-events-none"
          style={{ left: SIDEBAR_WIDTH + nowPosition }}
        >
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-sky-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
        </div>

        {plans.map((plan) => (
          <div key={plan.id} className="flex flex-col border-b border-slate-800/30">
            {/* Project Header Row */}
            <div className="flex bg-slate-900/40 group">
              <div
                className="flex-shrink-0 border-r border-slate-800 p-3 sticky left-0 z-10 bg-[#0f111a]"
                style={{ width: SIDEBAR_WIDTH }}
              >
                <div className="text-xs font-bold text-sky-400 truncate uppercase tracking-widest">
                  {plan.name}
                </div>
                <div className="text-[10px] opacity-40 truncate">{plan.objective}</div>
              </div>
              <div className="flex relative">
                {dateHeaders.map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 border-r border-slate-800/20 h-10"
                    style={{ width: COLUMN_WIDTH }}
                  />
                ))}
              </div>
            </div>

            {/* Tasks Rows */}
            {(plan.records || []).map((record: any) => {
              const isDragging = draggingRecord?.id === record.id;
              const start = record.startTime ? new Date(record.startTime) : new Date();
              const end = record.endTime ? new Date(record.endTime) : addDays(start, 1);

              let offsetDays = (start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
              const durationDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

              if (isDragging) {
                const dragDiffDays = (dragCurrentX - dragStartX) / COLUMN_WIDTH;
                offsetDays += dragDiffDays;
              }

              return (
                <div
                  key={record.id}
                  className="flex group hover:bg-slate-800/20 transition-colors border-b border-slate-800/10"
                >
                  <div
                    className="flex-shrink-0 border-r border-slate-800 px-4 py-2 sticky left-0 z-10 bg-[#0f111a] flex items-center group-hover:bg-slate-800/40 cursor-pointer"
                    style={{ width: SIDEBAR_WIDTH }}
                    onClick={() => onRecordClick?.(record)}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-2`}
                      style={{ backgroundColor: record.color || '#38bdf8' }}
                    />
                    <span className="text-xs truncate">{record.title}</span>
                  </div>
                  <div className="flex relative items-center h-12">
                    {dateHeaders.map((_, i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 border-r border-slate-800/10 h-full"
                        style={{ width: COLUMN_WIDTH }}
                      />
                    ))}

                    <div
                      className={`absolute h-8 rounded-lg border border-white/10 shadow-lg flex items-center px-3 cursor-grab active:cursor-grabbing group/bar overflow-hidden ${isDragging ? 'z-50 opacity-80 scale-105' : 'z-10'}`}
                      style={{
                        left: offsetDays * COLUMN_WIDTH + 4,
                        width: Math.max(20, durationDays * COLUMN_WIDTH - 8),
                        backgroundColor: `${record.color || '#38bdf8'}33`,
                        borderColor: record.color || '#38bdf8',
                      }}
                      onMouseDown={(e) => handleDragStart(e, record)}
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1"
                        style={{ backgroundColor: record.color || '#38bdf8' }}
                      />
                      <span className="text-[10px] font-medium text-white truncate drop-shadow-md">
                        {record.title}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer / Controls */}
      <div className="p-2 border-t border-slate-800 bg-[#161922] flex justify-between items-center text-[10px]">
        <div className="flex space-x-4 ml-4">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-amber-500 mr-1" /> High Priority
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-1" /> Completed
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-sky-500 mr-1" /> In Progress
          </div>
        </div>
        <div className="mr-4 opacity-50 uppercase tracking-tighter font-bold text-sky-500">
          SIMULCOLLAB™ ACTIVE
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
