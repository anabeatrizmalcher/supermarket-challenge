import { create } from 'zustand';
import { reducer, initialState, type Action } from './reducer';
import type { GameState, TeamPlan } from './types';

interface GameStore {
  state: GameState | null;
  key: string | null;
  init: (matchId: string, playerId: string, plan: TeamPlan, startedAt: number) => void;
  dispatch: (a: Action) => void;
}

const save = (key: string, s: GameState) => {
  try {
    localStorage.setItem(key, JSON.stringify(s));
  } catch {
    /* storage unavailable: the game still works, it just won't survive a reload */
  }
};

export const useGame = create<GameStore>((set, get) => ({
  state: null,
  key: null,
  init: (matchId, playerId, plan, startedAt) => {
    const key = `sc:v1:${matchId}:${playerId}`;
    if (get().key === key && get().state) return;
    let state: GameState | null = null;
    try {
      const raw = localStorage.getItem(key);
      if (raw) state = JSON.parse(raw) as GameState;
    } catch {
      state = null;
    }
    // Drop state saved for any other match
    Object.keys(localStorage)
      .filter((k) => k.startsWith('sc:v1:') && k !== key)
      .forEach((k) => localStorage.removeItem(k));
    state = state ?? initialState(plan, startedAt);
    save(key, state);
    set({ key, state });
  },
  dispatch: (a) => {
    const { state, key } = get();
    if (!state || !key) return;
    const next = reducer(state, a);
    if (next !== state) {
      save(key, next);
      set({ state: next });
    }
  },
}));
