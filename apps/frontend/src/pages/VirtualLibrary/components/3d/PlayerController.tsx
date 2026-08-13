// @ts-nocheck
import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useLibraryStore } from '../../store';
import { findDDCByCode } from '../../data/ddc';

const EYE_HEIGHT = 1.65;
const MOVE_SPEED = 4.5;
const SPRINT_SPEED = 9.0;
const ROOM_W = 30;
const ROOM_D = 20;
const HALF_W = ROOM_W / 2;
const HALF_D = ROOM_D / 2;
const MARGIN = 0.4;

const SHELF_POSITIONS: { code: string; x: number; z: number }[] = (() => {
  const ddcCodes = [
    '000', '100', '200', '300', '400',
    '500', '600', '700', '800', '900',
  ];
  const leftCodes = ddcCodes.filter((_, i) => i % 2 === 0);
  const rightCodes = ddcCodes.filter((_, i) => i % 2 === 1);
  const shelves: { code: string; x: number; z: number }[] = [];

  leftCodes.forEach((code, i) => {
    shelves.push({ code, x: -14.5, z: -8 + i * 4 });
  });
  rightCodes.forEach((code, i) => {
    shelves.push({ code, x: 14.5, z: -8 + i * 4 });
  });

  return shelves;
})();

export default function PlayerController() {
  const controlsRef = useRef<any>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const direction = useRef(new THREE.Vector3());
  const setPlayerPosition = useLibraryStore((s) => s.setPlayerPosition);
  const setPointerLocked = useLibraryStore((s) => s.setPointerLocked);
  const setSprinting = useLibraryStore((s) => s.setSprinting);
  const setNearestShelf = useLibraryStore((s) => s.setNearestShelf);
  const navigationTarget = useLibraryStore((s) => s.navigationTarget);
  const isNavigating = useLibraryStore((s) => s.isNavigating);
  const setIsNavigating = useLibraryStore((s) => s.setIsNavigating);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useFrame(({ camera, clock }, delta) => {
    if (!controlsRef.current) return;
    const dt = Math.min(delta, 0.1);
    const keys = keysRef.current;
    const controls = controlsRef.current;
    const isLocked = controls.isLocked;

    setPointerLocked(isLocked);

    if (isNavigating && navigationTarget) {
      const diff = new THREE.Vector3(
        navigationTarget.x - camera.position.x,
        0,
        navigationTarget.z - camera.position.z,
      );
      const dist = diff.length();
      if (dist < 0.1) {
        setIsNavigating(false);
      } else {
        const step = Math.min(dist, 5.0 * dt);
        diff.normalize().multiplyScalar(step);
        camera.position.add(diff);
        camera.position.y = EYE_HEIGHT;
      }
    } else if (isLocked) {
      const sprinting = keys['ShiftLeft'] || keys['ShiftRight'];
      const speed = sprinting ? SPRINT_SPEED : MOVE_SPEED;
      setSprinting(sprinting);

      direction.current.set(0, 0, 0);
      if (keys['KeyW'] || keys['ArrowUp']) direction.current.z -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) direction.current.z += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) direction.current.x -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) direction.current.x += 1;
      direction.current.normalize();

      controls.moveRight(direction.current.x * speed * dt);
      controls.moveForward(-direction.current.z * speed * dt);

      const p = camera.position;
      p.x = Math.max(-HALF_W + MARGIN, Math.min(HALF_W - MARGIN, p.x));
      p.z = Math.max(-HALF_D + MARGIN, Math.min(HALF_D - MARGIN, p.z));
      p.y = EYE_HEIGHT;
    }

    setPlayerPosition({
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    });

    let minDist = Infinity;
    let nearestCode: string | null = null;
    let nearestLabel: string | null = null;
    for (const shelf of SHELF_POSITIONS) {
      const dx = camera.position.x - shelf.x;
      const dz = camera.position.z - shelf.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < minDist) {
        minDist = d;
        const ddcNode = findDDCByCode(shelf.code);
        nearestCode = ddcNode?.code ?? shelf.code;
        nearestLabel = ddcNode?.label ?? null;
      }
    }
    if (minDist < 3.0) {
      setNearestShelf(nearestCode, nearestLabel);
    } else {
      setNearestShelf(null, null);
    }
  });

  return <PointerLockControls ref={controlsRef} />;
}
