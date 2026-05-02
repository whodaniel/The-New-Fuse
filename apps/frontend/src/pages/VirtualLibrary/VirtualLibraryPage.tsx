import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import LibraryScene from './components/3d/LibraryScene';
import HUD from './components/ui/HUD';
import BookDetailPanel from './components/ui/BookDetailPanel';
import BlockerOverlay from './components/ui/BlockerOverlay';
import Crosshair from './components/ui/Crosshair';
import Minimap from './components/ui/Minimap';
import LiveThoughtStream from './components/ui/LiveThoughtStream';
import { useLibraryStore } from './store';

export default function App() {
  const currentView = useLibraryStore((s) => s.currentView);
  const addThought = useLibraryStore((s) => s.addThought);

  useEffect(() => {
    // 🔗 Docking: Listen to TNF Relay for KWS results
    const ws = new WebSocket(window.location.protocol === 'https:' ? 'wss://' + window.location.host : 'ws://localhost:3000');
    
    ws.onopen = () => {
      console.log('[3D-Brain] Connected to TNF Relay');
      ws.send(JSON.stringify({
        type: 'REGISTER',
        payload: { type: '3d_brain_ui', capabilities: ['visualization'] }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'BROADCAST_EVENT' && message.payload.type === 'KWS_LLM_RESULT') {
          const result = message.payload.result || message.payload.text;
          if (result) {
            addThought(result);
          }
        }
      } catch (e) {
        console.error('[3D-Brain] WS parse error', e);
      }
    };

    return () => ws.close();
  }, [addThought]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1410' }}>
      <Canvas
        shadows
        camera={{ fov: 72, near: 0.1, far: 100, position: [0, 1.65, 8] }}
      >
        <Suspense fallback={null}>
          <LibraryScene />
        </Suspense>
      </Canvas>

      <BlockerOverlay />
      <HUD />
      {currentView === 'book-reader' && <BookDetailPanel />}
      <Crosshair />
      <Minimap />
      <LiveThoughtStream />
    </div>
  );
}
