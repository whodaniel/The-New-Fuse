import clsx from 'clsx';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';

export const Timeline: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const logs = useStore((state) => state.logs);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="pointer-events-auto relative mt-4">
      <button
        className="absolute -top-6 right-4 glass-panel px-3 py-1 rounded-t-lg border-b-0 text-xs text-slate-400 hover:text-white flex items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronUp className="w-3 h-3 mr-1" />}{' '}
        Timeline
      </button>
      <footer
        className={clsx(
          'glass-panel rounded-xl flex flex-col transition-all duration-300',
          isOpen ? 'h-32' : 'h-0 opacity-0 overflow-hidden'
        )}
      >
        <div
          ref={logContainerRef}
          className="flex-1 p-3 overflow-y-auto space-y-1 text-sm font-mono"
        >
          {logs.map((log) => {
            let colorClass = 'text-slate-300';
            if (log.type === 'system') colorClass = 'text-indigo-400';
            if (log.type === 'success') colorClass = 'text-emerald-400';
            if (log.type === 'alert') colorClass = 'text-amber-400';

            return (
              <div key={log.id} className={colorClass}>
                <span className="text-slate-500">[{log.timestamp}]</span>{' '}
                <span dangerouslySetInnerHTML={{ __html: log.message }} />
              </div>
            );
          })}
        </div>
      </footer>
    </div>
  );
};
