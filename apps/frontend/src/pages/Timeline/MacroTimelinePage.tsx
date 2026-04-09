import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TimelineView from '../../features/timeline/components/TimelineView';
import { useTimeline } from '../../features/timeline/hooks/useTimeline';

const MacroTimelinePage: React.FC = () => {
  const { data, loading, error, updateRecord } = useTimeline();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'board'>('timeline');

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-sky-400">
        Loading Global Timeline...
      </div>
    );
  if (error) return <div className="p-4 text-red-500">Error loading timeline: {error.message}</div>;

  const allRecords = data?.plans?.flatMap((p: any) => p.records) || [];
  const tasks = allRecords.filter((r: any) => r.kind === 'task');
  const suggestions = allRecords.filter((r: any) => r.kind === 'suggestion');

  const handleConvertToTask = async (record: any) => {
    await updateRecord(record.id, {
      kind: 'task',
      status: 'in_progress',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 86400000 * 3).toISOString(), // Default 3 days
    });
    setSelectedRecord(null);
  };

  return (
    <div className="flex h-screen bg-[#0a0c14] overflow-hidden">
      <div className="flex-grow flex flex-col p-4 space-y-6 overflow-hidden">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Macro Workspace</h1>
            <div className="flex space-x-4 mt-2">
              <button
                onClick={() => setViewMode('timeline')}
                className={`text-xs uppercase tracking-widest font-bold ${viewMode === 'timeline' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-500'}`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`text-xs uppercase tracking-widest font-bold ${viewMode === 'board' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-500'}`}
              >
                Kanban Board
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2">
              <Link
                to="/timeline"
                className="px-3 py-1 border border-amber-500/40 bg-amber-500/10 text-amber-200 text-xs font-semibold rounded"
              >
                Personal
              </Link>
              <Link
                to="/timeline/module"
                className="px-3 py-1 border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-xs font-semibold rounded"
              >
                Module
              </Link>
              <Link
                to="/timeline-demo"
                className="px-3 py-1 border border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-200 text-xs font-semibold rounded"
              >
                Demo
              </Link>
            </div>
            <div className="text-[10px] text-slate-500 text-right">
              <span className="text-white font-bold">{tasks.length}</span> Active Tasks
              <br />
              <span className="text-white font-bold">{suggestions.length}</span> Suggestions
            </div>
            <button className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-sm font-medium transition-colors">
              + New Plan
            </button>
          </div>
        </header>

        <main className="flex-grow overflow-hidden">
          {viewMode === 'timeline' ? (
            <TimelineView
              plans={data?.plans || []}
              onRecordClick={(record) => setSelectedRecord(record)}
              onRecordUpdate={(id, patch) => updateRecord(id, patch)}
            />
          ) : (
            <div className="grid grid-cols-4 gap-4 h-full overflow-auto pb-10">
              {['submitted', 'in_progress', 'under_review', 'completed'].map((status) => (
                <div
                  key={status}
                  className="flex flex-col space-y-4 bg-slate-900/20 p-4 rounded-md border border-slate-800/50"
                >
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter flex justify-between">
                    {status.replace('_', ' ')}
                    <span>{tasks.filter((t: any) => t.status === status).length}</span>
                  </h3>
                  <div className="space-y-3">
                    {tasks
                      .filter((t: any) => t.status === status)
                      .map((task: any) => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedRecord(task)}
                          className="p-3 bg-[#161922] border border-slate-800 rounded shadow-none hover:border-sky-500/50 cursor-pointer transition-all group"
                        >
                          <div className="text-xs font-medium text-slate-200 mb-2">
                            {task.title}
                          </div>
                          <div className="flex justify-between items-center">
                            <div
                              className={`text-[8px] px-1.5 py-0.5 rounded border ${
                                task.priority === 'high' || task.priority === 'critical'
                                  ? 'border-red-500/30 text-red-400 bg-red-500/5'
                                  : 'border-slate-700 text-slate-500'
                              }`}
                            >
                              {task.priority}
                            </div>
                            {task.assignee && (
                              <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-[8px] font-bold text-sky-400">
                                {task.assignee.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Right Sidebar: Task Intel / Conversion */}
      {selectedRecord && (
        <div className="w-96 bg-[#161922] border-l border-slate-800 p-4 flex flex-col space-y-6 overflow-y-auto">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span
                className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full w-fit mb-1 ${
                  selectedRecord.kind === 'suggestion'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                }`}
              >
                {selectedRecord.kind}
              </span>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Intel Core</h2>
            </div>
            <button
              onClick={() => setSelectedRecord(null)}
              className="text-slate-500 hover:text-white"
            >
              ✕
            </button>
          </div>

          {selectedRecord.kind === 'suggestion' && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-md space-y-3">
              <p className="text-xs text-amber-200/70 italic">
                This is currently a suggestion from the community.
              </p>
              <div className="flex items-center justify-between text-xs text-amber-400">
                <span>👍 {selectedRecord.votes?.up || 0} Upvotes</span>
                <button
                  onClick={() => handleConvertToTask(selectedRecord)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-[10px] transition-all"
                >
                  CONVERT TO TASK
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* ... keep inputs same ... */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Title</label>
              <input
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-sky-500 outline-none"
                value={selectedRecord.title}
                onChange={(e) => setSelectedRecord({ ...selectedRecord, title: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
              <select
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-2 text-xs text-white"
                value={selectedRecord.status}
                onChange={(e) => updateRecord(selectedRecord.id, { status: e.target.value })}
              >
                <option value="submitted">Submitted</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                Color Identity
              </label>
              <div className="flex space-x-2">
                {['#38bdf8', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'].map((c) => (
                  <button
                    key={c}
                    onClick={() => updateRecord(selectedRecord.id, { color: c })}
                    className={`w-6 h-6 rounded-full border-2 ${selectedRecord.color === c ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Assignment & Tracking */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Assignee</label>
                <input
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-sky-500 outline-none"
                  placeholder="Enter username..."
                  value={selectedRecord.assignee || ''}
                  onChange={(e) =>
                    setSelectedRecord({ ...selectedRecord, assignee: e.target.value })
                  }
                />
              </div>
              <button
                onClick={() => updateRecord(selectedRecord.id, selectedRecord)}
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold text-xs uppercase tracking-widest transition-all"
              >
                Update Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MacroTimelinePage;
