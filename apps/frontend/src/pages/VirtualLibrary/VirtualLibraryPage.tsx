import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import LibraryScene from './components/3d/LibraryScene';
import BlockerOverlay from './components/ui/BlockerOverlay';
import BookDetailPanel from './components/ui/BookDetailPanel';
import Crosshair from './components/ui/Crosshair';
import HUD from './components/ui/HUD';
import LiveThoughtStream from './components/ui/LiveThoughtStream';
import Minimap from './components/ui/Minimap';
import VoiceStatusIndicator from './components/ui/VoiceStatusIndicator';
import { useLibraryStore } from './store';

export default function App() {
  const currentView = useLibraryStore((s) => s.currentView);
  const addThought = useLibraryStore((s) => s.addThought);
  const setRelayStatus = useLibraryStore((s) => s.setRelayStatus);

  useEffect(() => {
    // 🔗 Docking: Listen to TNF Relay for KWS results
    setRelayStatus('connecting');
    const ws = new WebSocket(
      window.location.protocol === 'https:'
        ? 'wss://' + window.location.host
        : 'ws://localhost:3000'
    );

    ws.onopen = () => {
      console.log('[3D-Brain] Connected to TNF Relay');
      setRelayStatus('connected');
      ws.send(
        JSON.stringify({
          type: 'REGISTER',
          payload: { type: '3d_brain_ui', capabilities: ['visualization'] },
        })
      );
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

    ws.onerror = () => {
      setRelayStatus('error');
    };

    ws.onclose = () => {
      setRelayStatus('disconnected');
    };

    return () => ws.close();
  }, [addThought, setRelayStatus]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1410' }}>
      <Canvas shadows camera={{ fov: 72, near: 0.1, far: 100, position: [0, 1.65, 8] }}>
        <Suspense fallback={null}>
          <LibraryScene />
        </Suspense>
      </Canvas>

      <BlockerOverlay />
      <HUD />
      <VoiceStatusIndicator />
      {currentView === 'book-reader' && <BookDetailPanel />}
      <Crosshair />
      <Minimap />
      <LiveThoughtStream />
    </div>
  );
}
