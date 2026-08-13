import { GlassCard } from '@/components/ui';
import { ArrowRight, MonitorPlay } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ZoneBadge } from '../ZoneBadge';
import type { MirrorWindow } from '../useLocalRuntime';
import { TerminalMirror } from './TerminalMirror';

type Props = {
  onWindowSelect?: (window: MirrorWindow) => void;
};

export const TerminalMirrorPanel: React.FC<Props> = ({ onWindowSelect }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(640);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const next = Math.floor(entries[0]?.contentRect.width ?? 640);
      if (next > 0) setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <GlassCard className="p-4" title="Terminal Mirror" icon={MonitorPlay} gradient="green">
      <div className="mb-3 flex items-center justify-between">
        <ZoneBadge zone="personal" detail="your desktop, live" />
        <Link
          to="/terminals/mirror"
          className="inline-flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200"
        >
          Open full view <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div ref={containerRef}>
        <TerminalMirror
          width={width}
          height={Math.round((width * 9) / 16)}
          onWindowSelect={onWindowSelect}
        />
      </div>
    </GlassCard>
  );
};

export default TerminalMirrorPanel;
