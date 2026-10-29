import * as THREE from 'three';

// Procedural 3D models for every item (no external assets). y = 0 is the base of the object.
const mat = (c: string, op = 1) => new THREE.MeshLambertMaterial({ color: c, transparent: op < 1, opacity: op });
const mesh = (g: THREE.BufferGeometry, c: string, x = 0, y = 0, z = 0, op = 1) => {
  const m = new THREE.Mesh(g, mat(c, op));
  m.position.set(x, y, z);
  return m;
};
const S = (r: number) => new THREE.SphereGeometry(r, 14, 10);
const B = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const C = (rt: number, rb: number, h: number, seg = 16) => new THREE.CylinderGeometry(rt, rb, h, seg);

/** Footprint used to lay out piles on a table. */
export const UNIT_W: Record<string, number> = {
  flour: 0.42, rice: 0.42, sugar: 0.36, milk: 0.3, juice: 0.3, water: 0.26, honey: 0.3,
  butter: 0.3, cheese: 0.36, fish: 0.55, bread: 0.5, bananas: 0.4, carrots: 0.36,
};

export function makeUnit(id: string): THREE.Group {
  const g = new THREE.Group();
  const a = (o: THREE.Object3D) => (g.add(o), o);
  switch (id) {
    case 'apples':
      a(mesh(S(0.13), '#d62828', 0, 0.13));
      a(mesh(C(0.01, 0.01, 0.07, 6), '#5a3', 0, 0.28));
      break;
    case 'oranges':
      a(mesh(S(0.13), '#f77f00', 0, 0.13));
      a(mesh(S(0.025), '#2f9e44', 0, 0.26));
      break;
    case 'bananas':
      for (let i = 0; i < 3; i++) {
        const b = mesh(new THREE.CapsuleGeometry(0.035, 0.2, 4, 8), '#ffd60a', 0, 0.05 + i * 0.045, (i - 1) * 0.05);
        b.rotation.z = Math.PI / 2 - 0.25;
        b.rotation.y = (i - 1) * 0.25;
        a(b);
      }
      a(mesh(S(0.03), '#5b3a1a', -0.16, 0.1, 0));
      break;
    case 'carrots': {
      const c = mesh(new THREE.ConeGeometry(0.045, 0.3, 8), '#f77f00', 0, 0.05);
      c.rotation.z = -Math.PI / 2;
      a(c);
      const l = mesh(new THREE.ConeGeometry(0.03, 0.09, 6), '#2f9e44', -0.18, 0.05);
      l.rotation.z = Math.PI / 2;
      a(l);
      break;
    }
    case 'eggs': {
      const e = mesh(S(0.08), '#fff3d6', 0, 0.1);
      e.scale.set(0.8, 1.15, 0.8);
      a(e);
      break;
    }
    case 'honey':
      a(mesh(C(0.1, 0.1, 0.2), '#e09f00', 0, 0.1, 0, 0.9));
      a(mesh(C(0.105, 0.105, 0.04), '#7a4b00', 0, 0.22));
      break;
    case 'fish': {
      const body = mesh(S(0.14), '#6c8ea4', 0, 0.1);
      body.scale.set(1.8, 0.7, 0.6);
      a(body);
      const tail = mesh(new THREE.ConeGeometry(0.09, 0.14, 4), '#58788d', 0.3, 0.1);
      tail.rotation.z = Math.PI / 2;
      a(tail);
      a(mesh(S(0.02), '#111', -0.19, 0.14, 0.08));
      break;
    }
    case 'rolls': {
      const r = mesh(S(0.1), '#c98b4a', 0, 0.08);
      r.scale.set(1.3, 0.8, 1);
      a(r);
      break;
    }
    case 'cookies':
      a(mesh(C(0.1, 0.1, 0.03), '#8b5a2b', 0, 0.02));
      a(mesh(S(0.015), '#3b2412', 0.03, 0.04, 0.02));
      a(mesh(S(0.015), '#3b2412', -0.04, 0.04, -0.02));
      break;
    case 'cupcakes': {
      a(mesh(C(0.1, 0.07, 0.1), '#c68642', 0, 0.05));
      const t = mesh(S(0.11), '#ff8fb1', 0, 0.14);
      t.scale.y = 0.8;
      a(t);
      a(mesh(S(0.02), '#d62828', 0, 0.25));
      break;
    }
    case 'bread': {
      const l = mesh(new THREE.CapsuleGeometry(0.09, 0.3, 6, 10), '#c68a3d', 0, 0.1);
      l.rotation.z = Math.PI / 2;
      l.scale.set(1, 1, 0.9);
      a(l);
      break;
    }
    case 'flour':
      a(mesh(B(0.28, 0.38, 0.14), '#f3f0e6', 0, 0.19));
      a(mesh(B(0.29, 0.1, 0.145), '#3b82f6', 0, 0.2));
      break;
    case 'onions': {
      const o = mesh(S(0.1), '#d9a441', 0, 0.09);
      o.scale.y = 0.9;
      a(o);
      a(mesh(new THREE.ConeGeometry(0.025, 0.07, 6), '#b98a2e', 0, 0.2));
      break;
    }
    case 'milk':
      a(mesh(B(0.13, 0.24, 0.13), '#ffffff', 0, 0.12));
      a(mesh(B(0.135, 0.08, 0.135), '#3b82f6', 0, 0.12));
      a(mesh(B(0.13, 0.04, 0.13), '#cbd5e1', 0, 0.26));
      break;
    case 'water':
      a(mesh(C(0.06, 0.06, 0.26), '#7dd3fc', 0, 0.13, 0, 0.75));
      a(mesh(C(0.025, 0.03, 0.05, 10), '#1d4ed8', 0, 0.28));
      break;
    case 'rice':
      a(mesh(B(0.3, 0.4, 0.12), '#e9d8a6', 0, 0.2));
      a(mesh(B(0.31, 0.1, 0.125), '#b45309', 0, 0.2));
      break;
    case 'sugar':
      a(mesh(B(0.22, 0.3, 0.1), '#ffffff', 0, 0.15));
      a(mesh(B(0.225, 0.08, 0.105), '#f472b6', 0, 0.15));
      break;
    case 'salt':
      a(mesh(C(0.06, 0.06, 0.2), '#f8fafc', 0, 0.1));
      a(mesh(C(0.05, 0.06, 0.04, 12), '#94a3b8', 0, 0.22));
      break;
    case 'cheese': {
      const w = mesh(C(0.15, 0.15, 0.1, 3), '#ffd23f', 0, 0.05);
      w.rotation.y = Math.PI / 6;
      a(w);
      a(mesh(S(0.02), '#e6b800', 0.03, 0.1, 0));
      break;
    }
    case 'juice':
      a(mesh(B(0.14, 0.24, 0.1), '#fb923c', 0, 0.12));
      a(mesh(B(0.145, 0.07, 0.105), '#ffffff', 0, 0.12));
      a(mesh(C(0.008, 0.008, 0.1, 6), '#ef4444', 0.04, 0.3));
      break;
    case 'butter':
      a(mesh(B(0.2, 0.07, 0.1), '#fff3b0', 0, 0.035));
      a(mesh(B(0.205, 0.072, 0.04), '#f4c430', 0, 0.036));
      break;
    default:
      a(mesh(B(0.2, 0.2, 0.2), '#94a3b8', 0, 0.1));
  }
  return g;
}

/** A pile of units laid out on a table top. */
export function makeCluster(id: string, areaX = 1.8, areaZ = 0.8): THREE.Group {
  const g = new THREE.Group();
  const w = UNIT_W[id] ?? 0.3;
  const cols = Math.max(1, Math.floor(areaX / w));
  const rows = Math.max(1, Math.floor(areaZ / w));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const u = makeUnit(id);
      u.position.set((c - (cols - 1) / 2) * (areaX / cols), 0, (r - (rows - 1) / 2) * (areaZ / rows));
      u.rotation.y = ((c * 7 + r * 13) % 10) * 0.6;
      g.add(u);
    }
  // generous invisible hit box so taps near the pile still count
  const hit = new THREE.Mesh(new THREE.BoxGeometry(areaX + 0.2, 0.7, areaZ + 0.2), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.3;
  g.add(hit);
  g.userData.itemId = id;
  return g;
}
