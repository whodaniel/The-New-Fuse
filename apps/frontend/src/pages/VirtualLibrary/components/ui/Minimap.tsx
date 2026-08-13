// @ts-nocheck
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useLibraryStore } from '../../store';
import { getDDCMainClasses } from '../../data/ddc';

const ROOM_W = 30;
const ROOM_D = 20;
const CANVAS_W = 160;
const CANVAS_H = 120;

const DDC = getDDCMainClasses();

const SHELF_MAP = (() => {
  const leftShelves = DDC.filter((_, i) => i % 2 === 0);
  const rightShelves = DDC.filter((_, i) => i % 2 === 1);
  const map: { code: string; x: number; z: number; color: number }[] = [];
  leftShelves.forEach((ddc, i) => {
    map.push({ code: ddc.code, x: -14.5, z: -8 + i * 4, color: ddc.color });
  });
  rightShelves.forEach((ddc, i) => {
    map.push({ code: ddc.code, x: 14.5, z: -8 + i * 4, color: ddc.color });
  });
  return map;
})();

export default function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const playerPosition = useLibraryStore((s) => s.playerPosition);
  const playerRotation = useLibraryStore((s) => s.playerRotation);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const scaleX = CANVAS_W / ROOM_W;
      const scaleZ = CANVAS_H / ROOM_D;
      const cx = CANVAS_W / 2;
      const cy = CANVAS_H / 2;

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = 'rgba(26,20,16,0.8)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.strokeStyle = 'rgba(212,184,150,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(2, 2, CANVAS_W - 4, CANVAS_H - 4);

      for (const shelf of SHELF_MAP) {
        const sx = cx + shelf.x * scaleX;
        const sy = cy + shelf.z * scaleZ;
        const hex = '#' + shelf.color.toString(16).padStart(6, '0');
        ctx.fillStyle = hex;
        ctx.fillRect(sx - 4, sy - 2, 8, 4);
      }

      ctx.fillStyle = 'rgba(61,43,26,0.6)';
      ctx.fillRect(cx - 6, cy - 4, 12, 8);

      const px = cx + playerPosition.x * scaleX;
      const pz = cy + playerPosition.z * scaleZ;

      ctx.fillStyle = '#f0d9b5';
      ctx.beginPath();
      ctx.arc(px, pz, 3, 0, Math.PI * 2);
      ctx.fill();

      const dirX = Math.sin(playerRotation.yaw);
      const dirZ = -Math.cos(playerRotation.yaw);
      ctx.strokeStyle = '#f0d9b5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, pz);
      ctx.lineTo(px + dirX * 12, pz + dirZ * 12);
      ctx.stroke();
    };

    let animId: number;
    const loop = () => {
      frameRef.current++;
      if (frameRef.current % 3 === 0) {
        draw();
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, [playerPosition, playerRotation]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        width: `${CANVAS_W}px`,
        height: `${CANVAS_H}px`,
        background: 'rgba(0,0,0,0.6)',
        border: '1px solid rgba(240,217,181,0.2)',
        borderRadius: '6px',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ width: '100%', height: '100%', borderRadius: '6px' }}
      />
    </div>
  );
}
