import { MonitorOff } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  useTerminalMirror,
  type MirrorDisplay,
  type MirrorWindow,
  type TerminalMirrorResult,
} from '../useLocalRuntime';
import { TerminalWindowCard, chipColor, windowLabel } from './TerminalWindowCard';

type Layout = {
  minX: number;
  minY: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  displays: MirrorDisplay[];
};

const FALLBACK_DISPLAY: MirrorDisplay = { id: 0, x: 0, y: 0, width: 1440, height: 900, main: true };

function computeLayout(
  displays: MirrorDisplay[],
  containerWidth: number,
  containerHeight: number
): Layout {
  const effective = displays.length > 0 ? displays : [FALLBACK_DISPLAY];
  const minX = Math.min(...effective.map((d) => d.x));
  const minY = Math.min(...effective.map((d) => d.y));
  const maxX = Math.max(...effective.map((d) => d.x + d.width));
  const maxY = Math.max(...effective.map((d) => d.y + d.height));
  const worldWidth = Math.max(1, maxX - minX);
  const worldHeight = Math.max(1, maxY - minY);
  const scale = Math.min(containerWidth / worldWidth, containerHeight / worldHeight);
  return {
    minX,
    minY,
    scale,
    offsetX: (containerWidth - worldWidth * scale) / 2,
    offsetY: (containerHeight - worldHeight * scale) / 2,
    displays: effective,
  };
}

const formatAge = (ageSeconds: number | null): string => {
  if (ageSeconds === null) return 'unknown age';
  if (ageSeconds < 90) return `${ageSeconds}s ago`;
  return `${Math.round(ageSeconds / 60)}m ago`;
};

type Props = {
  width?: number;
  height?: number;
  onWindowSelect?: (window: MirrorWindow) => void;
  refetchInterval?: number;
  className?: string;
};

export const TerminalMirror: React.FC<Props> = ({
  width = 640,
  height = 360,
  onWindowSelect,
  refetchInterval = 15000,
  className = '',
}) => {
  const { data, isLoading } = useTerminalMirror({ refetchInterval });
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const mirror: TerminalMirrorResult | undefined = data;
  const available = mirror?.available === true;
  const windows = available ? mirror.windows : [];
  const displays = available ? mirror.displays : [];
  const offline = !available || mirror.stale;

  const layout = useMemo(() => computeLayout(displays, width, height), [displays, width, height]);

  const positioned = useMemo(
    () => windows.filter((w) => w.bounds).sort((a, b) => (b.zOrder ?? 0) - (a.zOrder ?? 0)),
    [windows]
  );
  const unpositioned = windows.filter((w) => !w.bounds);

  const handleSelect = (window: MirrorWindow) => {
    setSelectedId(window.windowId);
    onWindowSelect?.(window);
  };

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-white/10 bg-black/30 text-sm text-slate-400 ${className}`}
        style={{ width, height }}
      >
        Loading terminal mirror...
      </div>
    );
  }

  if (!available) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/30 text-slate-400 ${className}`}
        style={{ width, height }}
      >
        <MonitorOff className="h-6 w-6" />
        <p className="text-sm">Local mirror offline</p>
        <p className="max-w-[80%] text-center text-xs text-slate-500">
          {mirror?.reason ?? 'No heartbeat data. Is the terminal-heartbeat cron running?'}
        </p>
      </div>
    );
  }

  return (
    <div className={className} style={{ width }}>
      <div
        className={`relative overflow-hidden rounded-lg border bg-black/40 ${
          offline ? 'border-white/10 opacity-60 grayscale' : 'border-white/15'
        }`}
        style={{ width, height }}
      >
        {layout.displays.map((display) => (
          <div
            key={display.id}
            className="absolute rounded border border-white/10 bg-slate-900/40"
            style={{
              left: layout.offsetX + (display.x - layout.minX) * layout.scale,
              top: layout.offsetY + (display.y - layout.minY) * layout.scale,
              width: display.width * layout.scale,
              height: display.height * layout.scale,
            }}
          >
            {display.main && (
              <span className="absolute bottom-0.5 right-1 text-[8px] uppercase tracking-wider text-slate-600">
                main
              </span>
            )}
          </div>
        ))}

        {positioned.map((window, index) => {
          const bounds = window.bounds!;
          return (
            <TerminalWindowCard
              key={window.windowId ?? `w-${index}`}
              window={window}
              selected={selectedId !== null && selectedId === window.windowId}
              onSelect={handleSelect}
              style={{
                left: layout.offsetX + (bounds.x - layout.minX) * layout.scale,
                top: layout.offsetY + (bounds.y - layout.minY) * layout.scale,
                width: Math.max(28, bounds.width * layout.scale),
                height: Math.max(18, bounds.height * layout.scale),
                zIndex: positioned.length - index,
              }}
            />
          );
        })}

        {mirror.stale && (
          <div className="absolute inset-x-0 top-0 bg-black/70 px-2 py-1 text-center text-[10px] text-amber-300">
            Local mirror stale — last seen {formatAge(mirror.ageSeconds)}
          </div>
        )}
      </div>

      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-500">
        <span>
          {windows.length} windows · {windows.filter((w) => w.busy).length} busy · updated{' '}
          {formatAge(mirror.ageSeconds)}
        </span>
        {unpositioned.length > 0 && (
          <span className="ml-auto flex items-center gap-1.5">
            off-screen:
            {unpositioned.slice(0, 4).map((window, index) => (
              <button
                key={window.windowId ?? `u-${index}`}
                type="button"
                onClick={() => handleSelect(window)}
                className="rounded-full border px-1.5 py-0.5 text-slate-300 hover:brightness-125"
                style={{ borderColor: `${chipColor(window)}66` }}
              >
                {windowLabel(window)}
              </button>
            ))}
            {unpositioned.length > 4 && <span>+{unpositioned.length - 4}</span>}
          </span>
        )}
      </div>
    </div>
  );
};

export default TerminalMirror;
