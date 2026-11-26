import { Canvas } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import LibraryScene from './components/3d/LibraryScene';
import BlockerOverlay from './components/ui/BlockerOverlay';
import BookDetailPanel from './components/ui/BookDetailPanel';
import Crosshair from './components/ui/Crosshair';
import HUD from './components/ui/HUD';
import LiveThoughtStream from './components/ui/LiveThoughtStream';
import Minimap from './components/ui/Minimap';
import VoiceStatusIndicator from './components/ui/VoiceStatusIndicator';
import { SAMPLE_BOOKS } from './data/sampleBooks';
import { useLibraryStore } from './store';

const STORY_RELAY = 'http://127.0.0.1:43120';
const KWS_BASE = 'http://127.0.0.1:43110';
const AUDIO_STACK_START_COMMAND = 'node scripts/library/ensure-library-audio-stack.cjs';
const BLUEPRINTS_URL = 'http://127.0.0.1:5173';
const RELAY_WS =
  typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? `wss://${window.location.host}/ws`
    : 'ws://127.0.0.1:3007/ws';

type DepState = boolean | null;

async function probe(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(2500) });
    return res.ok;
  } catch {
    return false;
  }
}

export default function App() {
  const currentView = useLibraryStore((s) => s.currentView);
  const addThought = useLibraryStore((s) => s.addThought);
  const setRelayStatus = useLibraryStore((s) => s.setRelayStatus);
  const books = useLibraryStore((s) => s.books);
  const addBooks = useLibraryStore((s) => s.addBooks);
  const [mode, setMode] = useState<'native' | 'blueprints'>('blueprints');
  const [showKeys, setShowKeys] = useState(false);
  const [copied, setCopied] = useState(false);
  const [storyOnline, setStoryOnline] = useState<DepState>(null);
  const [kwsOnline, setKwsOnline] = useState<DepState>(null);
  const [libraryOnline, setLibraryOnline] = useState<DepState>(null);

  const embedUrl = useMemo(() => {
    const url = new URL(BLUEPRINTS_URL);
    url.searchParams.set('tnf_desktop', '1');
    url.searchParams.set('tnf_story_architect_local', '1');
    url.searchParams.set('tnf_ai_relay', STORY_RELAY);
    url.searchParams.set('tnf_kws_base', KWS_BASE);
    return url.toString();
  }, []);

  const refreshDeps = useCallback(async () => {
    const [story, kws, library] = await Promise.all([
      probe(`${STORY_RELAY}/v1/health`),
      probe(`${KWS_BASE}/healthz`),
      probe(BLUEPRINTS_URL),
    ]);
    setStoryOnline(story);
    setKwsOnline(kws);
    setLibraryOnline(library);
  }, []);

  useEffect(() => {
    void refreshDeps();
    const timer = window.setInterval(() => void refreshDeps(), 8000);
    return () => window.clearInterval(timer);
  }, [refreshDeps]);

  // Seed the catalog so shelf spines and the detail panel have real books.
  useEffect(() => {
    if (books.length === 0) {
      addBooks(SAMPLE_BOOKS);
    }
  }, [books.length, addBooks]);

  useEffect(() => {
    setRelayStatus('connecting');
    let ws: WebSocket;
    try {
      ws = new WebSocket(RELAY_WS);
    } catch {
      setRelayStatus('error');
      return;
    }

    ws.onopen = () => {
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
        if (message.type === 'BROADCAST_EVENT' && message.payload?.type === 'KWS_LLM_RESULT') {
          const result = message.payload.result || message.payload.text;
          if (result) addThought(result);
        }
      } catch {
        /* ignore */
      }
    };

    ws.onerror = () => setRelayStatus('error');
    ws.onclose = () => setRelayStatus('disconnected');

    return () => ws.close();
  }, [addThought, setRelayStatus]);

  const offlineServices = [
    storyOnline === false ? 'Story Architect' : null,
    kwsOnline === false ? 'KWS (voice)' : null,
  ].filter((name): name is string => name !== null);
  const bannerVisible = offlineServices.length > 0;

  const copyStartCommand = () => {
    try {
      void navigator.clipboard.writeText(AUDIO_STACK_START_COMMAND).then(() => setCopied(true));
    } catch {
      /* clipboard unavailable in this context */
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1410', position: 'relative' }}>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          padding: '10px 14px',
          background: 'rgba(20,16,12,0.92)',
          borderBottom: '1px solid rgba(240,217,181,0.15)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <strong style={{ color: '#f0d9b5', marginRight: 8 }}>Virtual Library</strong>
        <Chip ok={libraryOnline} label="Library" detail=":5173" />
        <Chip ok={storyOnline} label="Story Architect" detail=":43120" />
        <Chip ok={kwsOnline} label="KWS" detail=":43110" />
        <button type="button" style={btnStyle} onClick={() => setMode('blueprints')}>
          Full Library (Chrome)
        </button>
        <button type="button" style={btnStyle} onClick={() => setMode('native')}>
          Lightweight scene (walkthrough)
        </button>
        <button
          type="button"
          style={btnStyle}
          onClick={() => window.open(embedUrl, '_blank', 'noopener,noreferrer')}
        >
          Open in new tab
        </button>
        <button
          type="button"
          style={btnStyle}
          onClick={() => setShowKeys((value) => !value)}
          aria-expanded={showKeys}
        >
          Keys
        </button>
        <span style={{ color: '#8a7560', fontSize: 12, marginLeft: 'auto' }}>
          Enable Voice inside the Library (optional) · Tab = Story Architect · T = Timeline
        </span>
      </div>

      {bannerVisible && (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: 52,
            left: 0,
            right: 0,
            zIndex: 190,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
            padding: '8px 14px',
            background: 'rgba(80,32,16,0.95)',
            borderBottom: '1px solid rgba(255,150,80,0.35)',
            color: '#ffd9b0',
            fontSize: 13,
          }}
        >
          <span>
            {offlineServices.join(' and ')} offline — related features are unavailable until the
            local stack is running. Start it with:
          </span>
          <code
            style={{
              background: 'rgba(0,0,0,0.4)',
              padding: '4px 8px',
              borderRadius: 6,
              userSelect: 'all',
            }}
          >
            {AUDIO_STACK_START_COMMAND}
          </code>
          <button type="button" style={btnStyle} onClick={copyStartCommand}>
            {copied ? 'Copied' : 'Copy'}
          </button>
          <Link to="/settings/api" style={{ color: '#f0d9b5', textDecoration: 'underline' }}>
            Settings → API → Local AI Relay
          </Link>
        </div>
      )}

      {showKeys && (
        <div
          style={{
            position: 'fixed',
            top: bannerVisible ? 100 : 60,
            right: 14,
            zIndex: 195,
            background: 'rgba(20,16,12,0.96)',
            border: '1px solid rgba(240,217,181,0.2)',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#d4b896',
            fontSize: 12.5,
            lineHeight: 1.9,
          }}
        >
          <div>
            <strong style={{ color: '#f0d9b5' }}>Keys</strong>
          </div>
          <div>W A S D — move</div>
          <div>Mouse — look</div>
          <div>Shift — sprint</div>
          <div>Tab — Story Architect</div>
          <div>T — Timeline</div>
          <div>ESC — exit pointer lock</div>
        </div>
      )}

      <div style={{ position: 'absolute', inset: 0, top: bannerVisible ? 100 : 52 }}>
        {mode === 'blueprints' && libraryOnline ? (
          <iframe
            title="Virtual Library Blueprints"
            src={embedUrl}
            style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; xr-spatial-tracking; microphone; camera"
          />
        ) : mode === 'blueprints' && libraryOnline === false ? (
          <div
            style={{
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              color: '#d4b896',
              padding: 24,
              textAlign: 'center',
            }}
          >
            <div>
              <h2 style={{ marginTop: 0 }}>Library UI offline</h2>
              <p>Start the blueprints Vite app, then refresh this strip.</p>
              <code
                style={{
                  display: 'inline-block',
                  background: 'rgba(0,0,0,0.35)',
                  padding: '8px 12px',
                  borderRadius: 8,
                }}
              >
                cd apps/virtual-library-blueprints && npx vite --host 127.0.0.1 --port 5173
              </code>
              <div style={{ marginTop: 12 }}>
                <button type="button" style={btnStyle} onClick={() => void refreshDeps()}>
                  Recheck
                </button>
                <button
                  type="button"
                  style={{ ...btnStyle, marginLeft: 8 }}
                  onClick={() => setMode('native')}
                >
                  Use lightweight scene (walkthrough)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

function Chip({ ok, label, detail }: { ok: DepState; label: string; detail: string }) {
  const color = ok === true ? '#6ee7b7' : ok === false ? '#fca5a5' : '#fcd34d';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 600,
        color,
        border: `1px solid ${color}55`,
        background: `${color}14`,
        borderRadius: 999,
        padding: '4px 10px',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
        }}
      />
      {label} {ok === true ? 'live' : ok === false ? 'offline' : '…'}
      <code style={{ opacity: 0.8, fontSize: 11 }}>{detail}</code>
    </span>
  );
}

const btnStyle: CSSProperties = {
  background: 'rgba(240,217,181,0.12)',
  border: '1px solid rgba(240,217,181,0.28)',
  color: '#d4b896',
  borderRadius: 8,
  padding: '6px 10px',
  cursor: 'pointer',
  fontSize: 12,
};
