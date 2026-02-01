import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import React from 'react';
import { useRelay } from '../relay/RelayProvider';

export const BridgeConnectionStatus: React.FC = () => {
  const { connectionState } = useRelay();
  const { status, latency } = connectionState;

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'connecting':
      case 'reconnecting':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'disconnected':
      case 'error':
      default:
        return 'text-red-400 bg-red-400/10 border-red-400/20';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4" />;
      case 'connecting':
      case 'reconnecting':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return `Connected (${latency}ms)`;
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
    }
  };

  return (
    <div
      className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${getStatusColor()}`}
      title={getStatusText()}
    >
      {getStatusIcon()}
      <span className="text-xs font-medium">Relay</span>
      {status === 'connected' && latency !== null && (
        <span className="text-[10px] opacity-70 border-l border-current pl-2 ml-1">
          {latency}ms
        </span>
      )}
    </div>
  );
};
