import { Bot, Terminal as TerminalIcon } from 'lucide-react';
import React from 'react';
import type { MirrorWindow } from '../useLocalRuntime';

// Palette aligned with TerminalGraph NODE_COLOR
export const CHIP_COLORS = {
  agent: '#34d399',
  busy: '#f59e0b',
  idle: '#60a5fa',
} as const;

export const chipColor = (window: MirrorWindow): string => {
  if (window.agentLike) return CHIP_COLORS.agent;
  if (window.busy) return CHIP_COLORS.busy;
  return CHIP_COLORS.idle;
};

export const windowLabel = (window: MirrorWindow): string =>
  window.agentId || window.title || window.tty || `window ${window.windowId ?? '?'}`;

type Props = {
  window: MirrorWindow;
  style: React.CSSProperties;
  selected?: boolean;
  onSelect?: (window: MirrorWindow) => void;
};

export const TerminalWindowCard: React.FC<Props> = ({ window, style, selected, onSelect }) => {
  const color = chipColor(window);
  const label = windowLabel(window);
  const Icon = window.agentLike ? Bot : TerminalIcon;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(window)}
      title={`${label}${window.tty ? ` · ${window.tty}` : ''}${window.busy ? ' · busy' : ' · idle'}`}
      style={{
        ...style,
        borderColor: selected ? color : `${color}66`,
        backgroundColor: `${color}1f`,
      }}
      className={`absolute flex flex-col overflow-hidden rounded border text-left transition hover:z-50 hover:brightness-125 ${
        selected ? 'ring-1 ring-white/50' : ''
      }`}
    >
      <span
        className="flex items-center gap-1 border-b px-1 py-0.5"
        style={{ borderColor: `${color}44`, backgroundColor: `${color}22` }}
      >
        <Icon className="h-2.5 w-2.5 shrink-0" style={{ color }} />
        <span className="truncate text-[9px] leading-tight text-slate-100">{label}</span>
        {window.busy && (
          <span
            className="ml-auto h-1.5 w-1.5 shrink-0 animate-pulse rounded-full"
            style={{ backgroundColor: CHIP_COLORS.busy }}
          />
        )}
      </span>
      {window.tty && (
        <span className="px-1 pt-0.5 text-[8px] leading-tight text-slate-400 truncate">
          {window.tty.replace('/dev/', '')}
        </span>
      )}
    </button>
  );
};

export default TerminalWindowCard;
