import { useState } from 'react';
import LangToggle from '../../../ui/LangToggle';
import { ITEMS_BY_ID } from '../content';
import { CONFIG } from '../content/config';
import { cartTotal } from '../logic/pricing';
import { serverNow, useTick } from '../../match/hooks';
import type { GameState } from '../state/types';
import Cart from './Cart';

export default function Hud({ state }: { state: GameState }) {
  useTick(500);
  const [open, setOpen] = useState(false);
  const total = cartTotal(state.cart, ITEMS_BY_ID);
  const left = Math.max(0, CONFIG.maxSeconds - Math.max(0, Math.floor((serverNow() - state.startedAt) / 1000)));
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return (
    <>
      <div className="z-20 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-slate-900/90 px-3 py-2 text-base font-semibold text-white">
        <span>⭐ {state.score}</span>
        <span>⏱ {mm}:{ss}</span>
        <span className={total > state.wallet ? 'text-red-300' : ''}>💰 R$ {total}/{state.wallet}</span>
        <button onClick={() => setOpen(true)} className="rounded-lg bg-white/20 px-3 py-2">
          🛒 Lista
        </button>
        <LangToggle className="py-2" />
      </div>
      {open && <Cart state={state} onClose={() => setOpen(false)} />}
    </>
  );
}
