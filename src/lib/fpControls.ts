// Shared first-person controls: WASD/arrows, touch joystick (left half), drag to look, tap detection.
export interface Pose { x: number; z: number; yaw: number; pitch: number }
export interface Bounds { minX: number; maxX: number; minZ: number; maxZ: number }

export function createControls(
  dom: HTMLElement,
  pose: Pose,
  joyBase: HTMLElement | null,
  joyKnob: HTMLElement | null,
  onTap?: (x: number, y: number) => void,
) {
  const keys = new Set<string>();
  const joy = { x: 0, y: 0 };
  const R = 50;
  const ptrs = new Map<number, { role: 'joy' | 'look'; sx: number; sy: number; lx: number; ly: number; t0: number }>();

  const kd = (e: KeyboardEvent) => keys.add(e.key.toLowerCase());
  const ku = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);

  const down = (e: PointerEvent) => {
    dom.setPointerCapture(e.pointerId);
    const rect = dom.getBoundingClientRect();
    const role = e.pointerType === 'touch' && e.clientX - rect.left < rect.width / 2 ? 'joy' : 'look';
    ptrs.set(e.pointerId, { role, sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, t0: performance.now() });
    if (role === 'joy' && joyBase) {
      joyBase.style.display = 'block';
      joyBase.style.left = `${e.clientX - rect.left - R}px`;
      joyBase.style.top = `${e.clientY - rect.top - R}px`;
    }
  };
  const move = (e: PointerEvent) => {
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    if (p.role === 'look') {
      pose.yaw -= (e.clientX - p.lx) * 0.006;
      pose.pitch = Math.max(-0.6, Math.min(0.6, pose.pitch - (e.clientY - p.ly) * 0.005));
      p.lx = e.clientX;
      p.ly = e.clientY;
    } else {
      let dx = e.clientX - p.sx;
      let dy = e.clientY - p.sy;
      const d = Math.hypot(dx, dy);
      if (d > R) {
        dx = (dx / d) * R;
        dy = (dy / d) * R;
      }
      joy.x = dx / R;
      joy.y = dy / R;
      if (joyKnob) joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  };
  const up = (e: PointerEvent) => {
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    if (p.role === 'joy') {
      joy.x = joy.y = 0;
      if (joyBase) joyBase.style.display = 'none';
      if (joyKnob) joyKnob.style.transform = '';
    }
    if (e.type === 'pointerup' && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < 10 && performance.now() - p.t0 < 500) {
      const rect = dom.getBoundingClientRect();
      onTap?.(e.clientX - rect.left, e.clientY - rect.top);
    }
    ptrs.delete(e.pointerId);
  };
  dom.addEventListener('pointerdown', down);
  dom.addEventListener('pointermove', move);
  dom.addEventListener('pointerup', up);
  dom.addEventListener('pointercancel', up);

  return {
    locked: false, // when true the player can look but not walk
    step(dt: number, b: Bounds, speed = 5) {
      if (this.locked) return;
      const f = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - joy.y;
      const r = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0) + joy.x;
      if (keys.has('arrowleft')) pose.yaw += 1.8 * dt;
      if (keys.has('arrowright')) pose.yaw -= 1.8 * dt;
      pose.x += (-Math.sin(pose.yaw) * f + Math.cos(pose.yaw) * r) * speed * dt;
      pose.z += (-Math.cos(pose.yaw) * f - Math.sin(pose.yaw) * r) * speed * dt;
      pose.x = Math.max(b.minX, Math.min(b.maxX, pose.x));
      pose.z = Math.max(b.minZ, Math.min(b.maxZ, pose.z));
    },
    dispose() {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      dom.removeEventListener('pointerdown', down);
      dom.removeEventListener('pointermove', move);
      dom.removeEventListener('pointerup', up);
      dom.removeEventListener('pointercancel', up);
    },
  };
}
