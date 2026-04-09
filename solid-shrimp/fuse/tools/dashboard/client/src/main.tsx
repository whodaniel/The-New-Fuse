import {
  Box,
  Cpu,
  Layout,
  Play,
  Search,
  Settings,
  Square,
  Terminal as TerminalIcon,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { io } from 'socket.io-client';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './index.css';

const socket = io();

interface Command {
  id: string;
  name: string;
  command: string;
  category: string;
  source: string;
  cwd: string;
}

const CommandCard = ({
  cmd,
  status,
  onRun,
  onStop,
  isSelected,
}: {
  cmd: Command;
  status: string;
  onRun: any;
  onStop: any;
  isSelected: boolean;
}) => {
  return (
    <div
      className={`p-4 rounded-lg border transition-all ${isSelected ? 'border-blue-500 bg-slate-800' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-sm text-slate-200">{cmd.name}</h3>
          <p className="text-xs text-slate-500 mt-1 truncate max-w-[200px]" title={cmd.source}>
            {cmd.source}
          </p>
        </div>
        <div
          className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`}
        />
      </div>
      <p className="text-xs text-slate-400 font-mono mb-4 truncate" title={cmd.command}>
        $ {cmd.command}
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => (status === 'running' ? onStop(cmd) : onRun(cmd))}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            status === 'running'
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
              : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
          }`}
        >
          {status === 'running' ? (
            <>
              <Square size={12} /> Stop
            </>
          ) : (
            <>
              <Play size={12} /> Run
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const TerminalView = ({ output, title }: { output: string[]; title: string }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    if (!xtermRef.current) {
      const term = new Terminal({
        theme: {
          background: '#0F172A', // slate-900
          foreground: '#E2E8F0', // slate-200
        },
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 12,
        lineHeight: 1.4,
        cursorBlink: true,
        convertEol: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;
      fitAddon.fit();

      window.addEventListener('resize', () => fitAddon.fit());
    }

    return () => {
      // Cleanup?
    };
  }, []);

  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      output.forEach((line) => xtermRef.current?.write(line));
    }
  }, [output]); // Naive refresh, better to append

  // Actually, better to just stream writes.
  // For now, let's just stick to a simple pre text area if xterm is too complex for this one-shot
  // But let's try the simple div scroll first, xterm is nice but overhead.

  return (
    <div className="h-full flex flex-col bg-slate-950 border-l border-slate-800">
      <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <TerminalIcon size={14} /> {title || 'Output'}
        </h2>
        <button className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
      </div>
      <div
        className="flex-1 overflow-auto p-4 font-mono text-xs whitespace-pre-wrap text-slate-300 scroll-smooth"
        id="terminal-scroll"
      >
        {output.map((line, i) => (
          <span key={i}>{line}</span>
        ))}
        <div id="scroll-anchor" />
      </div>
    </div>
  );
};

const App = () => {
  const [commands, setCommands] = useState<Command[]>([]);
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCmd, setSelectedCmd] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [outputs, setOutputs] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetch('/api/commands')
      .then((res) => res.json())
      .then(setCommands);

    socket.on('status', ({ id, status }) => {
      setStatuses((prev) => ({ ...prev, [id]: status }));
    });

    socket.on('output', ({ id, data }) => {
      setOutputs((prev) => {
        const lines = (prev[id] || []).concat(data); // Append
        // Keep buffer size reasonable
        if (lines.length > 1000) return { ...prev, [id]: lines.slice(-1000) };
        return { ...prev, [id]: lines };
      });
      // Scroll to bottom
      const el = document.getElementById('scroll-anchor');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });

    return () => {
      socket.off('status');
      socket.off('output');
    };
  }, []);

  const runCommand = (cmd: Command) => {
    setSelectedCmd(cmd.id);
    socket.emit('execute', cmd);
  };

  const stopCommand = (cmd: Command) => {
    socket.emit('stop', { id: cmd.id });
  };

  const filtered = commands.filter(
    (c) =>
      (activeTab === 'all' || c.category === activeTab) &&
      (c.name.toLowerCase().includes(filter.toLowerCase()) ||
        c.command.toLowerCase().includes(filter.toLowerCase()))
  );

  const categories = ['all', 'dev', 'build', 'test', 'deploy', 'utility', 'quality'];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Flux Control
          </h1>
          <p className="text-xs text-slate-500">The New Fuse Operations</p>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm capitalize flex items-center gap-2 ${activeTab === cat ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              {cat === 'all' ? <Layout size={14} /> : <Box size={14} />}
              {cat}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Cpu size={12} />
            <span>System Ready</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        <div className="p-4 border-b border-slate-800 flex items-center gap-4 bg-slate-900/50 backdrop-blur">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search commands..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-full pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
              <Settings size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((cmd) => (
              <CommandCard
                key={cmd.id}
                cmd={cmd}
                status={statuses[cmd.id] || 'idle'}
                onRun={runCommand}
                onStop={stopCommand}
                isSelected={selectedCmd === cmd.id}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Terminal Drawer (Right Side) */}
      <div
        className={`w-1/3 min-w-[400px] border-l border-slate-800 transition-all duration-300 ease-in-out ${selectedCmd ? 'translate-x-0' : 'translate-x-full hidden'}`}
      >
        {selectedCmd && (
          <TerminalView
            output={outputs[selectedCmd] || []}
            title={commands.find((c) => c.id === selectedCmd)?.name || 'Terminal'}
          />
        )}
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
