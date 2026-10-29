import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createControls, type Pose } from '../../../lib/fpControls';
import { PLACES, STREET } from '../content/places';
import { SHOP_NAMES } from '../content';
import type { PlaceId } from '../state/types';

interface Props {
  checkoutReady: boolean;
  spawn?: PlaceId;
  onEnter: (p: PlaceId) => void;
}

const WALL: Record<PlaceId, string> = { bakery: '#fde68a', market: '#bbf7d0', supermarket: '#bfdbfe', checkout: '#fecaca' };
const FILLERS = ['#e5e7eb', '#fed7aa', '#ddd6fe', '#fbcfe8', '#cffafe'];

function signTexture(text: string, bg: string) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = bg;
  g.fillRect(0, 0, 512, 128);
  g.fillStyle = '#fff';
  g.font = 'bold 64px system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text.toUpperCase(), 256, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** First-person street: walk with WASD/arrows (or the on-screen joystick), look by dragging. */
export default function Street3D({ checkoutReady, spawn, onEnter }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const base = useRef<HTMLDivElement>(null);
  const mini = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState<PlaceId | null>(null);

  useEffect(() => {
    const el = mount.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#9fd3ff');
    scene.fog = new THREE.Fog('#9fd3ff', 18, 70);
    const camera = new THREE.PerspectiveCamera(70, el.clientWidth / el.clientHeight, 0.1, 120);
    camera.rotation.order = 'YXZ';
    scene.add(new THREE.HemisphereLight('#ffffff', '#88aa77', 1.6));
    const sun = new THREE.DirectionalLight('#ffffff', 1.2);
    sun.position.set(5, 20, 5);
    scene.add(sun);

    const mat = (c: string) => new THREE.MeshLambertMaterial({ color: c });
    const box = (w: number, h: number, d: number, c: string, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
      m.position.set(x, y, z);
      scene.add(m);
      return m;
    };
    const len = STREET.maxZ - STREET.minZ + 10;
    const mid = (STREET.maxZ + STREET.minZ) / 2;
    box(200, 0.1, 200, '#6ab04c', 0, -0.06, mid); // grass
    box(8, 0.12, len, '#4b5563', 0, 0, mid); // road
    box(2, 0.14, len, '#cbd5e1', -5, 0, mid); // sidewalks
    box(2, 0.14, len, '#cbd5e1', 5, 0, mid);
    for (let z = STREET.maxZ; z > STREET.minZ; z -= 4) box(0.2, 0.14, 1.6, '#f8fafc', 0, 0, z);
    box(14, 8, 1, '#94a3b8', 0, 4, STREET.minZ - 4); // end walls
    box(14, 8, 1, '#94a3b8', 0, 4, STREET.maxZ + 4);

    // Buildings: shops get a door + sign, the rest are filler houses
    for (const side of [-1, 1] as const) {
      let f = 0;
      for (let z = 2; z >= -60; z -= 14) {
        const place = (Object.entries(PLACES) as [PlaceId, (typeof PLACES)[PlaceId]][]).find(
          ([, v]) => v.side === side && Math.abs(v.z - z) < 7,
        );
        const bx = side * (STREET.halfWidth + 5);
        const rot = side === -1 ? Math.PI / 2 : -Math.PI / 2;
        const face = (w: number, h: number, c: THREE.Material, y: number, dz: number, off: number) => {
          const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), c);
          m.position.set(side * (STREET.halfWidth - off), y, z + dz);
          m.rotation.y = rot;
          scene.add(m);
        };
        box(10, 6, 12, place ? WALL[place[0]] : FILLERS[f++ % FILLERS.length], bx, 3, z);
        for (const dz of [-4, 4]) face(2, 1.6, new THREE.MeshBasicMaterial({ color: '#bae6fd' }), 2.2, dz, 0.02);
        if (place) {
          const [id, v] = place;
          face(1.8, 2.8, new THREE.MeshBasicMaterial({ color: '#7c4a1e' }), 1.4, 0, 0.03);
          face(6, 1.5, new THREE.MeshBasicMaterial({ map: signTexture(id === 'checkout' ? 'Checkout' : SHOP_NAMES[id], v.color) }), 4.4, 0, 0.03);
          box(0.8, 0.25, 7, v.color, side * (STREET.halfWidth - 0.4), 3.3, z); // awning
        } else {
          // a tree in front of filler houses
          box(0.4, 2.2, 0.4, '#7c4a1e', side * 5.6, 1.1, z + 5);
          const crown = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8), mat('#2f9e44'));
          crown.position.set(side * 5.6, 3, z + 5);
          scene.add(crown);
        }
        // lamp post
        box(0.15, 3.6, 0.15, '#334155', side * 5.2, 1.8, z + 7);
        box(0.5, 0.3, 0.5, '#fde047', side * 5.2, 3.7, z + 7);
      }
    }

    // Player pose
    const pose: Pose = { x: 0, z: 8, yaw: 0, pitch: 0 };
    if (spawn) {
      const pl = PLACES[spawn];
      pose.z = pl.z;
      pose.yaw = pl.side === 1 ? -Math.PI / 2 : Math.PI / 2;
    }
    const ctl = createControls(renderer.domElement, pose, base.current, knob.current);

    const ro = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    });
    ro.observe(el);

    const mm = mini.current?.getContext('2d');
    let nearNow: PlaceId | null = null;
    let last = performance.now();
    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      ctl.step(dt, { minX: -STREET.walkHalf, maxX: STREET.walkHalf, minZ: STREET.minZ + 1, maxZ: STREET.maxZ });
      camera.position.set(pose.x, 1.6, pose.z);
      camera.rotation.set(pose.pitch, pose.yaw, 0);
      renderer.render(scene, camera);

      let found: PlaceId | null = null;
      for (const [id, v] of Object.entries(PLACES) as [PlaceId, (typeof PLACES)[PlaceId]][]) {
        if (Math.hypot(pose.x - v.side * STREET.halfWidth, pose.z - v.z) < 4) found = id;
      }
      if (found !== nearNow) {
        nearNow = found;
        setNear(found);
      }

      if (mm) {
        const W = 70, H = 170;
        const Y = (z: number) => ((STREET.maxZ - z) / (STREET.maxZ - STREET.minZ)) * H;
        mm.clearRect(0, 0, W, H);
        mm.fillStyle = 'rgba(15,23,42,.75)';
        mm.fillRect(0, 0, W, H);
        mm.fillStyle = '#64748b';
        mm.fillRect(W / 2 - 10, 0, 20, H);
        for (const v of Object.values(PLACES)) {
          mm.fillStyle = v.color;
          mm.fillRect(v.side === -1 ? 4 : W - 24, Y(v.z) - 8, 20, 16);
        }
        const px = W / 2 + (pose.x / STREET.walkHalf) * 8;
        mm.fillStyle = '#fff';
        mm.beginPath();
        mm.arc(px, Y(pose.z), 4, 0, 7);
        mm.fill();
        mm.strokeStyle = '#fff';
        mm.beginPath();
        mm.moveTo(px, Y(pose.z));
        mm.lineTo(px - Math.sin(pose.yaw) * 14, Y(pose.z) - Math.cos(pose.yaw) * 14 * (H / (STREET.maxZ - STREET.minZ)) / 2.3);
        mm.stroke();
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      ctl.dispose();
      renderer.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
      });
      el.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locked = near === 'checkout' && !checkoutReady;
  return (
    <div className="relative min-h-0 flex-1 select-none">
      <div ref={mount} className="absolute inset-0" />
      <div ref={base} className="pointer-events-none absolute hidden h-[100px] w-[100px] rounded-full border-2 border-white/60 bg-white/20">
        <div ref={knob} className="absolute left-[30px] top-[30px] h-10 w-10 rounded-full bg-white/80" />
      </div>
      <canvas ref={mini} width={70} height={170} className="pointer-events-none absolute right-2 top-2 rounded-lg" />
      <p className="pointer-events-none absolute left-2 top-2 rounded-lg bg-black/50 px-2 py-1 text-xs text-white">
        Left side: walk · Right side: look · (PC: WASD + mouse)
      </p>
      {near && (
        <button
          disabled={locked}
          onClick={() => onEnter(near)}
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 rounded-2xl px-6 py-4 text-xl font-bold text-white shadow-lg ${locked ? 'bg-slate-500' : 'bg-indigo-600 active:scale-95'}`}
        >
          {locked ? '🔒 Finish your list first' : `🚪 Enter ${near === 'checkout' ? 'Checkout' : SHOP_NAMES[near]}`}
        </button>
      )}
    </div>
  );
}
