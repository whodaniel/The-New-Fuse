/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { Scene } from './components/Canvas/Scene';
import { ContextPanel } from './components/UI/ContextPanel';
import { FleetPanel } from './components/UI/FleetPanel';
import { MindMap } from './components/UI/MindMap';
import { Modals } from './components/UI/Modals';
import { Timeline } from './components/UI/Timeline';
import { TopBar } from './components/UI/TopBar';
import './index.css';
import { syncWithTNF } from './services/tnfBridge';

export default function App() {
  return <NexusApp />;
}

export function NexusApp() {
  useEffect(() => {
    syncWithTNF();
    const interval = setInterval(syncWithTNF, 10000); // Sync every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 text-white font-sans selection:bg-indigo-500 selection:text-white">
      {/* 3D Canvas Layer */}
      <Scene />

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 h-screen w-screen overflow-hidden">
        <TopBar />

        <div className="flex-1 flex justify-between items-start overflow-hidden relative">
          <FleetPanel />
          <ContextPanel />
        </div>

        <Timeline />
      </div>

      {/* Overlays */}
      <MindMap />
      <Modals />
    </div>
  );
}
