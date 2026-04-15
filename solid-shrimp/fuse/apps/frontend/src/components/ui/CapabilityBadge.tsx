import React from 'react';

interface CapabilityBadgeProps {
  label: string;
  enabled: boolean | null;
}

export const CapabilityBadge: React.FC<CapabilityBadgeProps> = ({ label, enabled }) => {
  const tone =
    enabled == null
      ? 'border-gray-500/40 bg-gray-500/10 text-gray-300'
      : enabled
        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
        : 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  const status = enabled == null ? 'unknown' : enabled ? 'enabled' : 'not deployed';

  return (
    <div className={`rounded-full border px-2 py-1 text-[10px] font-mono ${tone}`}>
      <span className="text-gray-300">{label}:</span> {status}
    </div>
  );
};
