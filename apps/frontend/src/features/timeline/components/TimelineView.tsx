import {
  addDays,
  addHours,
  differenceInDays,
  differenceInHours,
  format,
  isToday,
  startOfDay,
} from 'date-fns';
import { Plus, ZoomIn, ZoomOut } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

interface TimelineProps {
  plans: any[];
  onRecordClick?: (record: any) => void;
  onRecordUpdate?: (recordId: string, data: any) => void;
}

const SIDEBAR_WIDTH = 240;

const TimelineView: React.FC<TimelineProps> = ({ plans, onRecordClick, onRecordUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1); // 1 = 100px per day
  const columnWidth = useMemo(() => 100 * zoom, [zoom]);
  const [nowPosition, setNowBarPosition] = useState(0);

  // Drag State
  const [draggingRecord, setDraggingRecord] = useState<any>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragCurrentX, setDragCurrentX] = useState(0);

  // Calculate date range
  const { minDate, maxDate, days, hours } = useMemo(() => {
    const allRecords = plans.flatMap((p) => p.records || []);
    if (allRecords.length === 0) {
      const today = startOfDay(new Date());
      return { minDate: today, maxDate: addDays(today, 14), days: 14, hours: 14 * 24 };
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
      hours: differenceInHours(max, min) + 24,
    };
  }, [plans]);

  // Update "Now" bar position
  useEffect(() => {
    const updateNow = () => {
      const now = new Date();
      if (now >= minDate && now <= maxDate) {
        const diffDays = (now.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
        setNowBarPosition(diffDays * columnWidth);
      }
    };
    updateNow();
    const interval = setInterval(updateNow, 60000);
    return () => clearInterval(interval);
  }, [minDate, maxDate, columnWidth]);

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
      const diffDays = diffPx / columnWidth;

      if (Math.abs(diffDays) > 0.05) {
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

  const timeHeaders = useMemo(() => {
    // If zoomed in deep, show hours
    if (zoom > 5) {
      return Array.from({ length: hours }).map((_, i) => addHours(minDate, i));
    }
    return Array.from({ length: days }).map((_, i) => addDays(minDate, i));
  }, [minDate, days, hours, zoom]);

  const headerUnitWidth = useMemo(() => {
    if (zoom > 5) return columnWidth / 24;
    return columnWidth;
  }, [columnWidth, zoom]);

  return (
    <div
      className="flex flex-col h-full bg-[#0f111a] text-slate-300 font-sans select-none overflow-hidden border border-slate-800 rounded-xl relative shadow-inner"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Timeline Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#161922] border-b border-slate-800 z-40">
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.5))}
              className="p-1.5 hover:bg-slate-800 rounded-md transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-px bg-slate-800 mx-1 my-1" />
            <button
              onClick={() => setZoom(Math.min(10, zoom + 0.5))}
              className="p-1.5 hover:bg-slate-800 rounded-md transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {zoom * 100}% Scale
          </span>
        </div>

        <button className="flex items-center gap-2 px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-sky-500/20 uppercase tracking-wider">
          <Plus className="w-3 h-3" />
          Add Timeline Bar
        </button>
      </div>

      {/* Date/Time Ruler */}
      <div className="flex border-b border-slate-800/50 bg-[#161922] sticky top-0 z-30">
        <div
          className="flex-shrink-0 border-r border-slate-800 flex items-center px-6 font-bold text-[10px] uppercase tracking-[0.2em] text-slate-500"
          style={{ width: SIDEBAR_WIDTH }}
        >
          Timeline
        </div>
        <div className="flex overflow-hidden">
          {timeHeaders.map((date, i) => (
            <div
              key={i}
              className={`flex-shrink-0 border-r border-slate-800/30 flex flex-col items-center justify-center py-2 transition-colors ${zoom > 5 ? 'px-1' : ''} ${isToday(date) ? 'bg-sky-500/5 text-sky-400' : ''}`}
              style={{ width: headerUnitWidth }}
            >
              {zoom > 5 ? (
                <span className="text-[9px] font-bold opacity-60">{format(date, 'HH:mm')}</span>
              ) : (
                <>
                  <span className="text-[9px] font-bold opacity-40 uppercase">
                    {format(date, 'MMM')}
                  </span>
                  <span className="text-xs font-black">{format(date, 'd')}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Body */}
      <div
        ref={containerRef}
        className="flex-grow overflow-auto custom-scrollbar relative bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed opacity-95"
      >
        {/* The Now Bar */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-sky-500 z-20 pointer-events-none shadow-[0_0_15px_rgba(14,165,233,0.5)]"
          style={{ left: SIDEBAR_WIDTH + nowPosition }}
        >
          <div className="sticky top-0 -left-[5px] w-[12px] h-[12px] bg-sky-500 rounded-full border-2 border-white shadow-lg" />
        </div>

        {plans.map((plan) => (
          <div key={plan.id} className="flex flex-col">
            {/* Project Header Row */}
            <div className="flex bg-slate-900/60 group sticky top-0 z-20 backdrop-blur-sm border-b border-slate-800/50">
              <div
                className="flex-shrink-0 border-r border-slate-800 p-4 sticky left-0 z-10 bg-[#0f111a]/95"
                style={{ width: SIDEBAR_WIDTH }}
              >
                <div className="text-[10px] font-black text-sky-400 truncate uppercase tracking-[0.2em]">
                  {plan.name}
                </div>
              </div>
              <div className="flex relative">
                {timeHeaders.map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 border-r border-slate-800/10 h-12"
                    style={{ width: headerUnitWidth }}
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
                const dragDiffDays = (dragCurrentX - dragStartX) / columnWidth;
                offsetDays += dragDiffDays;
              }

              return (
                <div
                  key={record.id}
                  className="flex group hover:bg-sky-500/5 transition-colors border-b border-slate-800/20"
                >
                  <div
                    className="flex-shrink-0 border-r border-slate-800 px-6 py-3 sticky left-0 z-10 bg-[#0f111a]/95 flex items-center group-hover:bg-slate-800/60 cursor-pointer transition-all"
                    style={{ width: SIDEBAR_WIDTH }}
                    onClick={() => onRecordClick?.(record)}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-3 shadow-lg`}
                      style={{ backgroundColor: record.color || '#38bdf8' }}
                    />
                    <span className="text-[11px] font-bold truncate tracking-wide text-slate-400 group-hover:text-slate-100">
                      {record.title}
                    </span>
                  </div>
                  <div className="flex relative items-center h-14">
                    {timeHeaders.map((_, i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 border-r border-slate-800/5 h-full"
                        style={{ width: headerUnitWidth }}
                      />
                    ))}

                    <div
                      className={`absolute h-9 rounded-xl border-2 shadow-2xl flex items-center px-4 cursor-grab active:cursor-grabbing group/bar overflow-hidden transition-all ${isDragging ? 'z-50 opacity-90 scale-105 rotate-1' : 'z-10 hover:scale-[1.02]'}`}
                      style={{
                        left: offsetDays * columnWidth + 4,
                        width: Math.max(40, durationDays * columnWidth - 8),
                        backgroundColor: `${record.color || '#38bdf8'}22`,
                        borderColor: record.color || '#38bdf8',
                        boxShadow: `0 4px 20px -2px ${record.color || '#38bdf8'}33`,
                      }}
                      onMouseDown={(e) => handleDragStart(e, record)}
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1.5"
                        style={{ backgroundColor: record.color || '#38bdf8' }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-black text-white truncate uppercase tracking-wider">
                          {record.title}
                        </span>
                        {zoom > 2 && (
                          <span className="text-[8px] text-white/40 font-bold">
                            {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                          </span>
                        )}
                      </div>

                      {/* Avatar Overlay like in screenshots */}
                      <div className="ml-auto flex -space-x-2">
                        <div className="w-5 h-5 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-[8px] font-bold">
                          {record.assignee?.charAt(0).toUpperCase() || 'M'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer / Controls */}
      <div className="px-6 py-3 border-t border-slate-800 bg-[#161922] flex justify-between items-center text-[9px] font-bold tracking-[0.2em] text-slate-500 uppercase">
        <div className="flex space-x-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            High Priority
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Completed
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
            In Progress
          </div>
        </div>
        <div className="flex items-center gap-2 text-sky-500">
          <div className="animate-pulse w-1.5 h-1.5 bg-sky-500 rounded-full" />
          SIMULCOLLAB™ ENGINE ACTIVE
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
