export default function Crosshair() {
  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 40,
        pointerEvents: 'none',
        width: '6px',
        height: '6px',
        border: '1.5px solid rgba(240,217,181,0.4)',
        borderRadius: '50%',
      }}
    />
  );
}
