import { Switch } from '@/components/ui';
import React from 'react';

interface LiveSyncToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const LiveSyncToggle: React.FC<LiveSyncToggleProps> = ({ enabled, onChange }) => {
  return (
    <div className="flex items-center space-x-2">
      <Switch checked={enabled} onCheckedChange={onChange} id="live-sync-toggle" />
      <label htmlFor="live-sync-toggle" className="text-sm font-medium">
        Enable live document synchronization
      </label>
    </div>
  );
};

export default LiveSyncToggle;
