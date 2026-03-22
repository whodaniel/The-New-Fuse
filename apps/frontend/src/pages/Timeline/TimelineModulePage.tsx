import { TimelineModule } from '@/features/timeline/TimelineModule';

export default function TimelineModulePage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="space-y-2">
          <p className="text-amber-400 text-xs uppercase tracking-[0.2em] font-semibold">
            Timeline Lab
          </p>
          <h1 className="text-3xl md:text-4xl font-black">Timeline Module View</h1>
          <p className="text-slate-400 text-sm">
            Consolidated experimental timeline components (EnhancedTimelineView + TimelineSlider).
          </p>
        </header>
        <TimelineModule />
      </div>
    </div>
  );
}
