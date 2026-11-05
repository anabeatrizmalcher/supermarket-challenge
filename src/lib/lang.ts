import { create } from 'zustand';

const KEY = 'sc:showPt';
const read = () => {
  try {
    return localStorage.getItem(KEY) !== '0'; // on by default
  } catch {
    return true;
  }
};

/** Global switch for the Portuguese help under English sentences and item names. */
export const useLang = create<{ showPt: boolean; toggle: () => void }>((set, get) => ({
  showPt: read(),
  toggle: () => {
    const v = !get().showPt;
    try {
      localStorage.setItem(KEY, v ? '1' : '0');
    } catch {
      /* ignore */
    }
    set({ showPt: v });
  },
}));
