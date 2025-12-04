import React from 'react';
interface LiveSyncToggleProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}
declare const LiveSyncToggle: React.FC<LiveSyncToggleProps>;
export default LiveSyncToggle;
