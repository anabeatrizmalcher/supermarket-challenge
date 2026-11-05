import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createControls, type Pose } from '../../../lib/fpControls';
import { useLang } from '../../../lib/lang';
import { disposeScene } from '../../../lib/three';
import { ITEMS, ITEMS_BY_ID, SHOP_NAMES } from '../content';
import { CONFIG } from '../content/config';
import type { CartLine, PlaceId } from '../state/types';
import { UNIT_W, makeCluster, makeUnit } from './itemModels';

interface Props {
  place: PlaceId;
  /** true = the player can walk and tap items to pick them up */
  interactive: boolean;
  heldId?: string;
  cart?: CartLine[]; // shown on the counter at the checkout
  onPick?: (itemId: string) => void;
  onExit?: () => void;
}

const THEME: Record<PlaceId, { wall: string; a: string; b: string; apron: string; hat: 'chef' | 'cap' | 'none'; sign: string }> = {
  bakery: { wall: '#fde68a', a: '#f5deb3', b: '#e8c98f', apron: '#b45309', hat: 'chef', sign: '#f59e0b' },
  market: { wall: '#bbf7d0', a: '#d9f2c4', b: '#bfe3a5', apron: '#15803d', hat: 'cap', sign: '#22c55e' },
  supermarket: { wall: '#bfdbfe', a: '#e5eefc', b: '#c9d9f2', apron: '#1d4ed8', hat: 'cap', sign: '#3b82f6' },
  checkout: { wall: '#fecaca', a: '#f3e0e0', b: '#e2c4c4', apron: '#b91c1c', hat: 'none', sign: '#ef4444' },
};
// Table slots (x, z), filled in this order. 9 is the most items any shop sells.
const SLOTS: [number, number][] = [[-4.3, -2.5], [4.3, -2.5], [-4.3, -5.5], [4.3, -5.5], [-4.3, -8.5], [4.3, -8.5], [0, -4], [0, -6.5], [0, -9]];
const SELLER = { x: 0, z: -12.4 };
const TABLE_TOP = 0.9;

const mat = (c: string) => new THREE.MeshLambertMaterial({ color: c });
function box(scene: THREE.Object3D, w: number, h: number, d: number, c: string, x: number, y: number, z: number) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
  m.position.set(x, y, z);
  scene.add(m);
  return m;
}
function textTexture(lines: string[], bg: string | null, fg: string, w = 256, h = 128, size = 44) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  if (bg) {
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(4, 4, w - 8, h - 8, 18);
    g.fill();
  }
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `bold ${size}px system-ui, sans-serif`;
  lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * (size + 6)));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function priceTag(id: string) {
  const it = ITEMS_BY_ID[id];
  const price = `R$ ${it.price}${it.kind === 'countable' ? ' each' : ''}`;
  const plain = textTexture([it.id, price], 'rgba(255,255,255,.92)', '#0f172a', 256, 128, 38);
  const withPt = textTexture([it.id, it.pt, price], 'rgba(255,255,255,.92)', '#0f172a', 256, 160, 34);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: plain, depthWrite: false }));
  s.scale.set(1.3, 0.65, 1);
  return { sprite: s, plain, withPt };
}

function buildSeller(place: PlaceId) {
  const t = THEME[place];
  const g = new THREE.Group();
  const add = (o: THREE.Object3D, x = 0, y = 0, z = 0) => (o.position.set(x, y, z), g.add(o), o);
  const part = (geo: THREE.BufferGeometry, c: string) => new THREE.Mesh(geo, mat(c));
  add(part(new THREE.BoxGeometry(0.5, 0.8, 0.3), '#374151'), 0, 0.4);
  add(part(new THREE.CylinderGeometry(0.3, 0.34, 0.75, 16), t.apron), 0, 1.15);
  add(part(new THREE.SphereGeometry(0.22, 16, 12), '#fcd9b6'), 0, 1.72);
  for (const sx of [-1, 1]) {
    const arm = add(part(new THREE.CapsuleGeometry(0.07, 0.45, 4, 8), '#ffffff'), sx * 0.4, 1.2);
    arm.rotation.z = sx * 0.25;
    add(part(new THREE.SphereGeometry(0.03, 8, 6), '#111'), sx * 0.08, 1.76, 0.19);
  }
  add(part(new THREE.BoxGeometry(0.1, 0.02, 0.02), '#c0392b'), 0, 1.66, 0.2);
  if (t.hat === 'chef') {
    add(part(new THREE.CylinderGeometry(0.19, 0.2, 0.28, 14), '#ffffff'), 0, 2.02);
    add(part(new THREE.SphereGeometry(0.22, 12, 8), '#ffffff'), 0, 2.2);
  } else if (t.hat === 'cap') {
    add(part(new THREE.CylinderGeometry(0.23, 0.23, 0.1, 14), t.apron), 0, 1.9);
    add(part(new THREE.BoxGeometry(0.3, 0.02, 0.18), t.apron), 0, 1.86, 0.2);
  }
  return g;
}

export default function ShopInterior3D({ place, interactive, heldId, cart, onPick, onExit }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ interactive, onPick, onExit });
  propsRef.current = { interactive, onPick, onExit };
  const setHeldRef = useRef<(id?: string) => void>(() => undefined);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const el = mount.current!;
    const th = THEME[place];
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1e293b');
    const camera = new THREE.PerspectiveCamera(70, el.clientWidth / el.clientHeight, 0.05, 60);
    camera.rotation.order = 'YXZ';
    scene.add(camera);
    scene.add(new THREE.HemisphereLight('#ffffff', '#cbd5e1', 2.2));
    const sun = new THREE.DirectionalLight('#ffffff', 0.8);
    sun.position.set(3, 10, 4);
    scene.add(sun);

    // Room
    const tex = textTexture([], null, '#000', 64, 64);
    {
      const g = (tex.image as HTMLCanvasElement).getContext('2d')!;
      g.fillStyle = th.a; g.fillRect(0, 0, 64, 64);
      g.fillStyle = th.b; g.fillRect(0, 0, 32, 32); g.fillRect(32, 32, 32, 32);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(6, 7.5);
      tex.magFilter = THREE.NearestFilter;
      tex.needsUpdate = true;
    }
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 15), new THREE.MeshLambertMaterial({ map: tex }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -6.5);
    scene.add(floor);
    box(scene, 12, 0.2, 15, '#f8fafc', 0, 4.1, -6.5); // ceiling
    box(scene, 0.3, 4, 15, th.wall, -6.15, 2, -6.5);
    box(scene, 0.3, 4, 15, th.wall, 6.15, 2, -6.5);
    box(scene, 12.6, 4, 0.3, th.wall, 0, 2, -14.15);
    box(scene, 12.6, 4, 0.3, th.wall, 0, 2, 1.15);
    box(scene, 12, 0.15, 0.1, th.sign, 0, 3.0, -13.95); // trim

    // Back wall: sign + decorative shelves
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.25), new THREE.MeshBasicMaterial({ map: textTexture([place === 'checkout' ? 'CHECKOUT' : SHOP_NAMES[place].toUpperCase()], th.sign, '#fff', 512, 128, 70) }));
    sign.position.set(0, 3.5, -13.95);
    scene.add(sign);
    for (const y of [1.2, 1.9, 2.6]) {
      box(scene, 3, 0.06, 0.4, '#8b5e34', -4.3, y, -13.8);
      box(scene, 3, 0.06, 0.4, '#8b5e34', 4.3, y, -13.8);
      for (let i = 0; i < 6; i++) {
        const col = ['#f87171', '#fbbf24', '#60a5fa', '#34d399', '#f472b6'][(i + Math.floor(y * 3)) % 5];
        box(scene, 0.3, 0.3, 0.3, col, -5.5 + i * 0.5, y + 0.18, -13.8);
        box(scene, 0.3, 0.3, 0.3, col, 3.0 + i * 0.5, y + 0.18, -13.8);
      }
    }

    // Exit door (tap it) on the wall behind the player
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.8), new THREE.MeshBasicMaterial({ color: '#7c4a1e' }));
    door.position.set(0, 1.4, 0.98);
    door.rotation.y = Math.PI;
    door.userData.exit = true;
    scene.add(door);
    const exitSign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.4), new THREE.MeshBasicMaterial({ map: textTexture(['EXIT'], '#16a34a', '#fff', 256, 90, 50) }));
    exitSign.position.set(0, 3.1, 0.98);
    exitSign.rotation.y = Math.PI;
    scene.add(exitSign);

    // Counter, register, seller
    box(scene, place === 'checkout' ? 6.4 : 5, 1, 1.2, '#8b5e34', 0, 0.5, -11);
    box(scene, place === 'checkout' ? 6.6 : 5.2, 0.08, 1.4, '#d6b98c', 0, 1.02, -11);
    box(scene, 0.55, 0.35, 0.4, '#334155', 2, 1.25, -11.2);
    box(scene, 0.45, 0.02, 0.3, '#22c55e', 2, 1.44, -11.1);
    const seller = buildSeller(place);
    seller.position.set(SELLER.x, 0, SELLER.z);
    scene.add(seller);

    // Tables with items (or the cart on the counter at the checkout)
    const tags: ReturnType<typeof priceTag>[] = [];
    const targets: THREE.Object3D[] = [door];
    const tables: { x: number; z: number }[] = [];
    const clusters: THREE.Group[] = [];
    if (place !== 'checkout') {
      ITEMS.filter((i) => i.shop === place).forEach((it, idx) => {
        const [x, z] = SLOTS[idx];
        box(scene, 2, TABLE_TOP, 1, '#a16207', x, TABLE_TOP / 2, z);
        box(scene, 2.1, 0.05, 1.1, '#fef3c7', x, TABLE_TOP + 0.02, z);
        tables.push({ x, z });
        const cl = makeCluster(it.id);
        cl.position.set(x, TABLE_TOP + 0.05, z);
        scene.add(cl);
        targets.push(cl);
        clusters.push(cl);
        const tag = priceTag(it.id);
        tag.sprite.position.set(x, TABLE_TOP + 1.05, z);
        scene.add(tag.sprite);
        tags.push(tag);
      });
    } else if (cart) {
      let cx = -2.9;
      for (const line of cart) {
        const w = UNIT_W[line.itemId] ?? 0.3;
        const n = typeof line.amount === 'number' ? Math.min(line.amount, 8) : CONFIG.multipliers[line.amount] + 1;
        for (let i = 0; i < n; i++) {
          const u = makeUnit(line.itemId);
          u.position.set(cx, 1.06, -10.75);
          u.rotation.y = i * 0.9;
          scene.add(u);
          cx += w * 0.9;
        }
        cx += 0.18;
        if (cx > 2.9) cx = -2.9; // wrap onto the same line rather than leave the counter
      }
    }

    // Controls
    const pose: Pose = { x: 0, z: -1.5, yaw: 0, pitch: 0 };
    const ray = new THREE.Raycaster();
    let picking: { unit: THREE.Group; from: THREE.Vector3; t: number; id: string } | null = null;
    const held = new THREE.Group();
    held.position.set(0.32, -0.3, -0.65);
    held.scale.setScalar(1.6);
    camera.add(held);
    setHeldRef.current = (id) => {
      held.clear();
      if (id) held.add(makeUnit(id));
    };

    const onTap = (px: number, py: number) => {
      if (!propsRef.current.interactive || picking) return;
      const r = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2((px / r.width) * 2 - 1, -(py / r.height) * 2 + 1), camera);
      const hit = ray.intersectObjects(targets, true)[0];
      if (!hit) return;
      let o: THREE.Object3D | null = hit.object;
      while (o && !o.userData.itemId && !o.userData.exit) o = o.parent;
      if (!o) return;
      if (o.userData.exit) return propsRef.current.onExit?.();
      if (hit.distance > 6) {
        setToast('Chegue mais perto 🚶');
        setTimeout(() => setToast(''), 1400);
        return;
      }
      const id = o.userData.itemId as string;
      const unit = makeUnit(id);
      const from = o.getWorldPosition(new THREE.Vector3());
      from.y += 0.1;
      unit.position.copy(from);
      scene.add(unit);
      picking = { unit, from, t: 0, id };
    };
    const ctl = createControls(renderer.domElement, pose, base.current, knob.current, onTap);

    const ro = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    });
    ro.observe(el);

    const tgt = new THREE.Vector3();
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const interactiveNow = propsRef.current.interactive;
      ctl.locked = !interactiveNow;
      ctl.step(dt, { minX: -5.4, maxX: 5.4, minZ: -9.8, maxZ: 0.4 }, 4);
      for (const t of tables) {
        const hx = 1.45, hz = 0.95;
        const dx = pose.x - t.x, dz = pose.z - t.z;
        if (Math.abs(dx) < hx && Math.abs(dz) < hz) {
          const px = hx - Math.abs(dx), pz = hz - Math.abs(dz);
          if (px < pz) pose.x += (dx >= 0 ? 1 : -1) * px;
          else pose.z += (dz >= 0 ? 1 : -1) * pz;
        }
      }
      if (!interactiveNow) {
        // turn to face the seller while talking
        let diff = Math.atan2(-(SELLER.x - pose.x), -(SELLER.z - pose.z)) - pose.yaw;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        pose.yaw += diff * Math.min(1, dt * 3);
        pose.pitch *= 1 - Math.min(1, dt * 3);
      }
      camera.position.set(pose.x, 1.6, pose.z);
      camera.rotation.set(pose.pitch, pose.yaw, 0);
      camera.updateMatrixWorld();
      const wantPt = useLang.getState().showPt;
      for (const t of tags) {
        const m = t.sprite.material as THREE.SpriteMaterial;
        const next = wantPt ? t.withPt : t.plain;
        if (m.map !== next) {
          m.map = next;
          t.sprite.scale.set(1.3, wantPt ? 0.81 : 0.65, 1);
          m.needsUpdate = true;
        }
      }
      seller.position.y = Math.sin(now / 500) * 0.015;
      held.rotation.y += dt * 1.2;
      if (picking) {
        picking.t += dt / 0.4;
        const k = Math.min(1, picking.t);
        const e = k * k * (3 - 2 * k);
        tgt.set(0.32, -0.3, -0.65).applyMatrix4(camera.matrixWorld);
        picking.unit.position.lerpVectors(picking.from, tgt, e);
        picking.unit.scale.setScalar(1 + 0.6 * e);
        if (k >= 1) {
          const id = picking.id;
          scene.remove(picking.unit);
          picking = null;
          propsRef.current.onPick?.(id);
        }
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      ctl.dispose();
      setHeldRef.current = () => undefined;
      disposeScene(scene, renderer);
      el.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place]);

  useEffect(() => setHeldRef.current(heldId), [heldId]);

  return (
    <div className="relative min-h-0 flex-1 select-none">
      <div ref={mount} className="absolute inset-0" />
      <div ref={base} className="pointer-events-none absolute hidden h-[100px] w-[100px] rounded-full border-2 border-white/60 bg-white/20">
        <div ref={knob} className="absolute left-[30px] top-[30px] h-10 w-10 rounded-full bg-white/80" />
      </div>
      {interactive && (
        <p className="pointer-events-none absolute left-2 top-2 rounded-lg bg-black/50 px-2 py-1 text-xs text-white">
          Ande pela loja e toque num item para pegar 🖐️
        </p>
      )}
      {toast && <p className="pointer-events-none absolute left-1/2 top-12 -translate-x-1/2 rounded-xl bg-black/70 px-3 py-2 text-white">{toast}</p>}
    </div>
  );
}
