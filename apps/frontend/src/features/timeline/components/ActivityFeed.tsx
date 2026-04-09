import { format, isToday, isYesterday, startOfDay } from 'date-fns';
import React, { useMemo } from 'react';

interface ActivityFeedProps {
  events: any[];
  loading?: boolean;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ events, loading }) => {
  const groupedEvents = useMemo(() => {
    const groups: Record<string, any[]> = {};

    [...events]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .forEach((event) => {
        const date = startOfDay(new Date(event.timestamp)).toISOString();
        if (!groups[date]) groups[date] = [];
        groups[date].push(event);
      });

    return Object.entries(groups).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }, [events]);

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  if (loading)
    return (
      <div className="flex flex-col gap-4 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-slate-900/50 animate-pulse rounded-xl" />
        ))}
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-[#0f111a] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-slate-800 bg-[#161922]">
        <h2 className="text-xl font-black uppercase tracking-widest text-white">Activity</h2>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-10">
        {groupedEvents.map(([date, items]) => (
          <div key={date} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-px bg-slate-800 flex-grow" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 whitespace-nowrap">
                {getDateLabel(date)}
              </span>
              <div className="h-px bg-slate-800 flex-grow" />
            </div>

            <div className="space-y-3">
              {items.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 p-4 bg-slate-900/40 border border-slate-800/50 rounded-xl hover:bg-sky-500/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-sky-400 group-hover:border-sky-500/50 transition-colors">
                    {event.actor?.charAt(0).toUpperCase() || 'S'}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-200">{event.actor}</span>
                      <span className="text-xs text-slate-500 italic">
                        {event.eventType?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-bold text-sky-400">
                        {event.payload?.title || event.payload?.message || 'Update'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-600 font-bold mt-1 uppercase tracking-wider">
                      {format(new Date(event.timestamp), 'h:mm a')}
                    </div>
                  </div>

                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      className="text-[10px] font-bold text-sky-500 hover:text-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded px-1"
                      aria-label={`View details for ${event.payload?.title || event.payload?.message || 'Update'}`}
                    >
                      VIEW
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {groupedEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-20 space-y-4">
            <div className="w-16 h-16 border-2 border-dashed border-slate-500 rounded-full" />
            <p className="text-sm font-bold uppercase tracking-widest">
              No recent activity detected
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
