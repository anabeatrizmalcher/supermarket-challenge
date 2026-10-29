import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { api, type Snapshot } from './api';
import { CONFIG } from '../game/content/config';

interface MatchStore {
  snap: Snapshot | null;
  error: string | null;
  realtime: string;
  set: (s: Partial<MatchStore>) => void;
}
export const useMatchStore = create<MatchStore>((set) => ({ snap: null, error: null, realtime: 'connecting', set }));

let offset = 0;
export const serverNow = () => Date.now() + offset;

/** Mount once: keeps the match snapshot fresh (realtime + a light poll as safety net). */
export function useMatchSync() {
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const snap = await api.getSnapshot();
        if (alive) useMatchStore.getState().set({ snap, error: null });
      } catch (e) {
        if (alive) useMatchStore.getState().set({ error: (e as Error).message });
      }
    };
    api.serverOffset().then((o) => (offset = o)).catch(() => undefined);
    void refresh();
    const unsub = api.subscribe(refresh, (realtime) => useMatchStore.getState().set({ realtime }));
    const t = setInterval(refresh, 2000);
    return () => {
      alive = false;
      unsub();
      clearInterval(t);
    };
  }, []);
}

export const refreshNow = async () => {
  useMatchStore.getState().set({ snap: await api.getSnapshot() });
};

export function useTick(ms = 500) {
  const [, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}

export const startMs = (snap: Snapshot) =>
  snap.match.started_at ? new Date(snap.match.started_at).getTime() : null;

/** Game clock starts when the 3-2-1 countdown ends. */
export const gameStartMs = (snap: Snapshot) => {
  const s = startMs(snap);
  return s === null ? null : s + CONFIG.countdownSeconds * 1000;
};

export const isClosed = (snap: Snapshot) => {
  if (snap.match.status === 'finished') return true;
  const g = gameStartMs(snap);
  return g !== null && serverNow() > g + (CONFIG.maxSeconds + 10) * 1000;
};
