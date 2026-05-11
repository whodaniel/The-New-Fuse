import { ArrowLeft, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const CONCORDANCE_HTML =
  (import.meta.env.VITE_CONCORDANCE_URL as string) ||
  '/visualizations/TNF_CONCORDANCE_VISUALIZER.html';

export default function ConcordanceViewerPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link
            to="/visualizations"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Viz Hub
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-emerald-200">
            <BookOpen className="h-3.5 w-3.5" />
            Concordance
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">TNF Codebase Concordance</h1>
        <div className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur">
          <iframe
            src={CONCORDANCE_HTML}
            title="TNF Concordance Visualizer"
            width="100%"
            height="800"
            style={{ border: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}
