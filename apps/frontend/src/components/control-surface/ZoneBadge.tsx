import { FolderKanban, Shield } from 'lucide-react';
import React from 'react';

export type Zone = 'system' | 'personal';

export const zoneCardClass = (zone: Zone): string =>
  zone === 'system'
    ? 'border-cyan-400/25 bg-cyan-500/[0.04]'
    : 'border-amber-400/25 bg-amber-500/[0.04]';

const badgeClass: Record<Zone, string> = {
  system: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200',
  personal: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
};

export const ZoneBadge: React.FC<{ zone: Zone; detail?: string; className?: string }> = ({
  zone,
  detail,
  className = '',
}) => {
  const Icon = zone === 'system' ? Shield : FolderKanban;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] leading-none ${badgeClass[zone]} ${className}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {zone === 'system' ? 'System' : 'Personal'}
      {detail ? <span className="normal-case tracking-normal opacity-75">· {detail}</span> : null}
    </span>
  );
};

export default ZoneBadge;
