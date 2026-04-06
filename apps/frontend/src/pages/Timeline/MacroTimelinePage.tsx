import { format } from 'date-fns';
import { Clock, Layout, List, Plus } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ActivityFeed from '../../features/timeline/components/ActivityFeed';
import TimelineView from '../../features/timeline/components/TimelineView';
import { useTimeline } from '../../features/timeline/hooks/useTimeline';

const MacroTimelinePage: React.FC = () => {
  const { events: timelineEvents, loading, error } = useTimeline();
  const data: any = { plans: [], events: timelineEvents };
  const updateRecord = async (id: string, patch: any) => console.log('updateRecord', id, patch);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'board' | 'activity'>('timeline');
  const [newTodo, setNewTodo] = useState('');
  const [newComment, setNewComment] = useState('');

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-sky-400 bg-[#0a0c14]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">
            Synchronizing Global Timeline...
          </span>
        </div>
      </div>
    );
  if (error) return <div className="p-4 text-red-500">Error loading timeline: {error.message}</div>;

  const allRecords = data?.plans?.flatMap((p: any) => p.records) || [];
  const tasks = allRecords.filter((r: any) => r.kind === 'task');
  const suggestions = allRecords.filter((r: any) => r.kind === 'suggestion');
  const allEvents = data?.events || [];

  const handleUpdateRecord = async (recordId: string, patch: any) => {
    try {
      await updateRecord(recordId, patch);
      if (selectedRecord?.id === recordId) {
        setSelectedRecord((prev: any) => ({ ...prev, ...patch }));
      }
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const handleConvertToTask = async (record: any) => {
    await handleUpdateRecord(record.id, {
      kind: 'task',
      status: 'in_progress',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 86400000 * 3).toISOString(),
    });
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim() || !selectedRecord) return;
    const todo = { id: Math.random().toString(36).slice(2, 9), text: newTodo, completed: false };
    const todos = [...(selectedRecord.todos || []), todo];
    await handleUpdateRecord(selectedRecord.id, { todos });
    setNewTodo('');
  };

  const handleToggleTodo = async (todoId: string) => {
    const todos = selectedRecord.todos.map((t: any) =>
      t.id === todoId ? { ...t, completed: !t.completed } : t
    );
    await handleUpdateRecord(selectedRecord.id, { todos });
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedRecord) return;
    const comment = {
      id: Math.random().toString(36).slice(2, 9),
      actor: 'Me',
      text: newComment,
      timestamp: new Date().toISOString(),
    };
    const comments = [...(selectedRecord.comments || []), comment];
    await handleUpdateRecord(selectedRecord.id, { comments });
    setNewComment('');
  };

  return (
    <div className="flex h-screen bg-[#0a0c14] overflow-hidden text-slate-200">
      <div className="flex-grow flex flex-col p-6 space-y-6 overflow-hidden">
        <header className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 backdrop-blur-md">
          <div className="flex items-center gap-8">
            <div className="space-y-0.5">
              <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">
                The New Fuse <span className="text-sky-500">Macro</span>
              </h1>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                Universal Orchestration Interface
              </p>
            </div>

            <nav className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800/50">
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Clock className="w-3.5 h-3.5" />
                Timeline
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'board' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Layout className="w-3.5 h-3.5" />
                Board
              </button>
              <button
                onClick={() => setViewMode('activity')}
                className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'activity' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <List className="w-3.5 h-3.5" />
                Activity
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Link
                to="/timeline"
                className="px-3 py-1.5 border border-amber-500/30 bg-amber-500/5 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-500/10 transition-all"
              >
                Personal
              </Link>
              <Link
                to="/timeline/module"
                className="px-3 py-1.5 border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-500/10 transition-all"
              >
                Module
              </Link>
            </div>

            <div className="h-8 w-px bg-slate-800" />

            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-white">
                {tasks.length} <span className="text-slate-500">TASKS</span>
              </span>
              <span className="text-[10px] font-black text-white">
                {suggestions.length} <span className="text-slate-500">SUGGESTIONS</span>
              </span>
            </div>

            <button className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-sky-600/20 active:scale-95">
              + New Plan
            </button>
          </div>
        </header>

        <main className="flex-grow overflow-hidden relative">
          {viewMode === 'timeline' && (
            <TimelineView
              plans={data?.plans || []}
              onRecordClick={(record) => setSelectedRecord(record)}
              onRecordUpdate={(id, patch) => handleUpdateRecord(id, patch)}
            />
          )}

          {viewMode === 'board' && (
            <div className="grid grid-cols-4 gap-6 h-full overflow-auto pb-10 custom-scrollbar">
              {['submitted', 'in_progress', 'under_review', 'completed'].map((status) => (
                <div
                  key={status}
                  className="flex flex-col space-y-4 bg-slate-900/20 p-5 rounded-2xl border border-slate-800/50 backdrop-blur-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      {status.replace('_', ' ')}
                    </h3>
                    <span className="text-[10px] font-black bg-slate-800 px-2 py-0.5 rounded-lg text-slate-400">
                      {tasks.filter((t: any) => t.status === status).length}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {tasks
                      .filter((t: any) => t.status === status)
                      .map((task: any) => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedRecord(task)}
                          className="p-4 bg-[#161922] border-2 border-slate-800/50 rounded-2xl shadow-xl hover:border-sky-500/50 cursor-pointer transition-all group relative overflow-hidden"
                        >
                          <div
                            className="absolute top-0 left-0 bottom-0 w-1"
                            style={{ backgroundColor: task.color || '#38bdf8' }}
                          />
                          <div className="text-xs font-black text-slate-200 mb-3 uppercase tracking-wide leading-relaxed">
                            {task.title}
                          </div>
                          <div className="flex justify-between items-center">
                            <div
                              className={`text-[8px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-widest ${
                                task.priority === 'high' || task.priority === 'critical'
                                  ? 'border-red-500/30 text-red-400 bg-red-500/5'
                                  : 'border-slate-700 text-slate-500'
                              }`}
                            >
                              {task.priority}
                            </div>
                            <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[8px] font-black text-sky-400 shadow-inner">
                              {task.assignee?.charAt(0).toUpperCase() || 'M'}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'activity' && <ActivityFeed events={allEvents} loading={loading} />}
        </main>
      </div>

      {/* Timelinr-inspired Detailed Sidebar */}
      <div
        className={`w-[450px] flex-shrink-0 flex flex-col bg-[#0f111a] border-l border-slate-800 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) transform shadow-[0_0_50px_rgba(0,0,0,0.5)] z-50 ${selectedRecord ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {selectedRecord && (
          <>
            <div className="p-8 border-b border-slate-800/50 flex justify-between items-start bg-slate-900/30 backdrop-blur-xl">
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest ${
                      selectedRecord.kind === 'suggestion'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-[0_0_10px_rgba(14,165,233,0.1)]'
                    }`}
                  >
                    {selectedRecord.kind}
                  </span>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                    Viewing Record
                  </p>
                </div>
                <h2 className="text-2xl font-black truncate leading-tight text-white tracking-tight">
                  {selectedRecord.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 hover:bg-slate-800 rounded-xl transition-all active:scale-90 group"
              >
                <Plus className="w-6 h-6 rotate-45 opacity-40 group-hover:opacity-100 transition-opacity text-white" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar p-8 space-y-10">
              {selectedRecord.kind === 'suggestion' && (
                <div className="bg-amber-500/10 border-2 border-amber-500/20 p-5 rounded-2xl space-y-4 shadow-inner">
                  <p className="text-xs text-amber-200/70 italic leading-relaxed">
                    This is a community suggestion. Convert it to a task to begin orchestration.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
                      👍 {selectedRecord.votes?.up || 0} UPVOTES
                    </span>
                    <button
                      onClick={() => handleConvertToTask(selectedRecord)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-[10px] transition-all shadow-lg shadow-amber-500/20 uppercase tracking-widest active:scale-95"
                    >
                      CONVERT TO TASK
                    </button>
                  </div>
                </div>
              )}

              {/* Date Range & Team */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Start Date
                  </label>
                  <div className="text-sm font-black text-slate-200 bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
                    {selectedRecord.startTime
                      ? format(new Date(selectedRecord.startTime), 'MMM d, yyyy')
                      : 'Not set'}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Finish Date
                  </label>
                  <div className="text-sm font-black text-slate-200 bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
                    {selectedRecord.endTime
                      ? format(new Date(selectedRecord.endTime), 'MMM d, yyyy')
                      : 'Not set'}
                  </div>
                </div>
                <div className="col-span-2 space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Assigned Team
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-xs font-black text-white border-2 border-[#0f111a] shadow-xl">
                      {selectedRecord.assignee?.slice(0, 2).toUpperCase() || 'ME'}
                    </div>
                    <button className="w-10 h-10 rounded-full bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center cursor-pointer hover:border-sky-500/50 hover:bg-sky-500/5 transition-all active:scale-90 group">
                      <Plus className="w-5 h-5 opacity-40 text-white group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Mission Parameters
                </label>
                <textarea
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-sm text-slate-300 focus:border-sky-500 outline-none resize-none h-40 transition-all font-medium leading-relaxed"
                  value={selectedRecord.description}
                  onChange={(e) =>
                    handleUpdateRecord(selectedRecord.id, { description: e.target.value })
                  }
                  placeholder="Define mission objectives..."
                />
              </div>

              {/* Todo List */}
              <div className="space-y-5 bg-slate-900/20 p-6 rounded-3xl border border-slate-800/50 shadow-inner">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex justify-between items-center">
                  Checklist
                  <span className="bg-slate-800 px-2 py-0.5 rounded-lg text-sky-400">
                    {selectedRecord.todos?.filter((t: any) => t.completed).length || 0}/
                    {selectedRecord.todos?.length || 0}
                  </span>
                </label>
                <div className="space-y-3">
                  {selectedRecord.todos?.map((todo: any) => (
                    <div
                      key={todo.id}
                      className="flex items-center gap-4 group cursor-pointer"
                      onClick={() => handleToggleTodo(todo.id)}
                    >
                      <div
                        className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${todo.completed ? 'bg-sky-500 border-sky-500 shadow-lg shadow-sky-500/30' : 'border-slate-700 group-hover:border-slate-500'}`}
                      >
                        {todo.completed && (
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={4}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className={`text-sm font-bold transition-all ${todo.completed ? 'text-slate-600 line-through' : 'text-slate-300'}`}
                      >
                        {todo.text}
                      </span>
                    </div>
                  ))}
                  <div className="flex gap-3 pt-4">
                    <input
                      type="text"
                      value={newTodo}
                      onChange={(e) => setNewTodo(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                      placeholder="Add directive..."
                      className="flex-grow bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:border-sky-500 outline-none transition-all font-bold"
                    />
                    <button
                      onClick={handleAddTodo}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-6">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                  Intelligence Feed
                </label>
                <div className="space-y-6">
                  {selectedRecord.comments?.map((comment: any) => (
                    <div key={comment.id} className="flex gap-4">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-sky-400 shadow-lg">
                        {comment.actor.slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-black text-slate-200 uppercase tracking-tighter">
                            {comment.actor}
                          </span>
                          <span className="text-[9px] font-bold opacity-30 text-slate-500 uppercase tracking-widest">
                            {format(new Date(comment.timestamp), 'h:mm a')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium bg-slate-900/40 p-3 rounded-2xl rounded-tl-none border border-slate-800/50">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="space-y-3 pt-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Transmit message... (Shift + Enter to post)"
                      onKeyDown={(e) =>
                        e.key === 'Enter' && e.shiftKey && (e.preventDefault(), handleAddComment())
                      }
                      className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-xs text-slate-300 focus:border-sky-500 outline-none transition-all resize-none h-24 font-bold"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleAddComment}
                        className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-sky-500/30 active:scale-95"
                      >
                        Transmit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MacroTimelinePage;
