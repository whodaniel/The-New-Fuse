// @ts-nocheck
import { useLibraryStore } from '../../store';

export default function BlockerOverlay() {
  const isPointerLocked = useLibraryStore((s) => s.isPointerLocked);

  if (isPointerLocked) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        cursor: 'pointer',
        transition: 'opacity 0.3s',
      }}
    >
      <div style={{ textAlign: 'center', color: '#d4b896', maxWidth: '500px' }}>
        <h1
          style={{
            fontSize: '2.2em',
            marginBottom: '0.4em',
            color: '#f0d9b5',
            textShadow: '0 0 20px rgba(240,217,181,0.3)',
            fontFamily: "'Courier New', monospace",
          }}
        >
          The Virtual Library
        </h1>
        <p
          style={{
            fontSize: '0.95em',
            lineHeight: 1.6,
            color: '#a89279',
            fontFamily: "'Courier New', monospace",
          }}
        >
          A 3D Spatial Knowledge Operating System
        </p>
        <p
          style={{
            marginTop: '1.2em',
            fontSize: '0.85em',
            color: '#6b5a48',
            fontFamily: "'Courier New', monospace",
          }}
        >
          Click to enter the library
          <br />
          <br />
          <span
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '0.85em',
              margin: '0 2px',
            }}
          >
            W
          </span>
          <span
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '0.85em',
              margin: '0 2px',
            }}
          >
            A
          </span>
          <span
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '0.85em',
              margin: '0 2px',
            }}
          >
            S
          </span>
          <span
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '0.85em',
              margin: '0 2px',
            }}
          >
            D
          </span>{' '}
          move &nbsp;
          <span
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '0.85em',
              margin: '0 2px',
            }}
          >
            Mouse
          </span>{' '}
          look &nbsp;
          <span
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '0.85em',
              margin: '0 2px',
            }}
          >
            Shift
          </span>{' '}
          sprint &nbsp;
          <span
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '0.85em',
              margin: '0 2px',
            }}
          >
            ESC
          </span>{' '}
          exit
        </p>
      </div>
    </div>
  );
}
