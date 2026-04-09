/**
 * Theia IDE Integration Page
 * Provides embedded access to the Theia IDE within TNF platform
 */

import { AlertCircle, ExternalLink, RotateCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface IdeStatus {
  status: 'loading' | 'ready' | 'error';
  message?: string;
}

const TheiaIDE: React.FC = () => {
  const [ideStatus, setIdeStatus] = useState<IdeStatus>({ status: 'loading' });
  const ideUrl = import.meta.env.VITE_THEIA_IDE_URL || 'http://localhost:3007';

  useEffect(() => {
    // Check if IDE is available
    const checkIdeHealth = async () => {
      try {
        const response = await fetch(`${ideUrl}/health`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          setIdeStatus({ status: 'ready' });
        } else {
          setIdeStatus({
            status: 'error',
            message: 'IDE is not responding. Please ensure the IDE service is running.',
          });
        }
      } catch (error) {
        setIdeStatus({
          status: 'error',
          message: `Failed to connect to IDE at ${ideUrl}. Please check if the service is running.`,
        });
      }
    };

    checkIdeHealth();
  }, [ideUrl]);

  const handleRefresh = () => {
    setIdeStatus({ status: 'loading' });
    window.location.reload();
  };

  const handleOpenInNewTab = () => {
    window.open(ideUrl, '_blank', 'noopener,noreferrer');
  };

  if (ideStatus.status === 'loading') {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-transparent dark:bg-gray-900/50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 border-t-2 border-blue-500/30"></div>
          <p className="text-lg text-muted-foreground dark:text-muted-foreground">
            Loading Theia IDE...
          </p>
        </div>
      </div>
    );
  }

  if (ideStatus.status === 'error') {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-transparent dark:bg-gray-900/50 p-4">
        <div className="max-w-2xl w-full bg-transparent dark:bg-transparent rounded-md shadow-none border border-red-200 dark:border-red-800 p-4 flex flex-col items-center text-center">
          <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
            <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">IDE Unavailable</h2>
          <p className="text-muted-foreground dark:text-gray-300 mb-6 max-w-lg">
            {ideStatus.message}
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Retry Connection
            </button>
            <button
              onClick={handleOpenInNewTab}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-foreground dark:text-gray-300 rounded-md hover:bg-muted/20 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] relative overflow-hidden flex flex-col">
      {/* IDE Header */}
      <div className="bg-gray-800 text-white px-4 py-2 border-b border-gray-700 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Theia IDE</span>
          <span className="text-sm text-gray-400">v2.0.0 | Theia 1.65.2</span>
        </div>
        <div>
          <button
            onClick={handleOpenInNewTab}
            className="text-sm px-3 py-1.5 text-gray-300 hover:text-white hover:bg-transparent/10 rounded transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in New Tab
          </button>
        </div>
      </div>

      {/* IDE Iframe */}
      <iframe src={ideUrl} className="w-full flex-1 border-none bg-transparent" title="Theia IDE" />
    </div>
  );
};

export default TheiaIDE;
