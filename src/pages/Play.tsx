import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Checkout from '../features/game/components/Checkout';
import Hud from '../features/game/components/Hud';
import ShopScene from '../features/game/components/ShopScene';
import Street3D from '../features/game/components/Street3D';
import { ITEMS_BY_ID } from '../features/game/content';
import { CONFIG } from '../features/game/content/config';
import { cartTotal, listComplete } from '../features/game/logic/pricing';
import { overspend } from '../features/game/logic/pricing';
import { useGame } from '../features/game/state/store';
import { api } from '../features/match/api';
import { gameStartMs, isClosed, serverNow, useMatchStore } from '../features/match/hooks';
import { getPlayerId } from '../lib/player';

export default function Play() {
  const snap = useMatchStore((s) => s.snap);
  const { state, init, dispatch } = useGame();
  const nav = useNavigate();
  const me = getPlayerId();
  const player = snap?.players.find((p) => p.id === me);
  const plan = snap?.match.config?.plans.find((p) => p.team === player?.team);
  const startAt = snap ? gameStartMs(snap) : null;

  useEffect(() => {
    if (snap && snap.match.status === 'lobby') nav('/', { replace: true });
    if (snap && snap.match.status !== 'lobby' && !player) nav('/', { replace: true });
  }, [snap, player, nav]);

  useEffect(() => {
    if (snap && plan && startAt !== null) init(snap.match.id, me, plan, startAt);
  }, [snap?.match.id, plan, startAt, init, me]); // eslint-disable-line

  // 20 minute limit
  useEffect(() => {
    const t = setInterval(() => {
      if (startAt !== null && serverNow() - startAt > CONFIG.maxSeconds * 1000) dispatch({ type: 'TIMEOUT', now: serverNow() });
    }, 1000);
    return () => clearInterval(t);
  }, [startAt, dispatch]);

  // Send the result once the player is done
  const outcome = state?.phase.name === 'finished' ? state.phase.outcome : null;
  useEffect(() => {
    if (!state || !outcome || startAt === null) return;
    const elapsed = outcome === 'timeout' ? CONFIG.maxSeconds : Math.round(((state.endedAt ?? serverNow()) - startAt) / 1000);
    const lost = outcome === 'lost';
    api.submit(me, lost ? 0 : state.score, cartTotal(state.cart, ITEMS_BY_ID), elapsed, lost ? 'lost' : 'finished').catch(() => undefined);
  }, [outcome]); // eslint-disable-line

  useEffect(() => {
    if (snap && outcome && isClosed(snap)) nav('/result', { replace: true });
  }, [snap, outcome, nav]);

  if (!state) return <p className="p-6">Loading…</p>;
  const ph = state.phase;

  return (
    <div className="flex h-full flex-col">
      <Hud state={state} />
      {ph.name === 'street' && (
        <Street3D
          checkoutReady={listComplete(state.needs, state.cart)}
          spawn={state.lastPlace}
          onEnter={(place) =>
            place === 'checkout'
              ? dispatch({ type: 'GO_CHECKOUT' })
              : dispatch({ type: 'ENTER_SHOP', shop: place, extra: Math.floor(Math.random() * 4) })
          }
        />
      )}
      {ph.name === 'shop' && <ShopScene state={state} dispatch={dispatch} />}
      {ph.name === 'checkout' && <Checkout state={state} dispatch={dispatch} />}
      {ph.name === 'finished' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="text-7xl">{ph.outcome === 'paid' ? '🎉' : ph.outcome === 'lost' ? '😢' : '⏰'}</div>
          <h1 className="text-2xl font-bold">
            {ph.outcome === 'paid' && 'Thank you! Have a nice day!'}
            {ph.outcome === 'lost' && 'Sorry, you don’t have much money.'}
            {ph.outcome === 'timeout' && 'Time is up!'}
          </h1>
          {ph.outcome === 'lost' && (
            <div className="rounded-xl bg-red-50 p-3 text-left">
              <p className="font-bold">You took too much:</p>
              {overspend(state.cart, state.needs, ITEMS_BY_ID).map((o, i) => (
                <p key={i}>• {o.label} (R$ {o.cost} extra)</p>
              ))}
            </div>
          )}
          <p>Your points: <b>{ph.outcome === 'lost' ? 0 : state.score}</b></p>
          <p className="text-slate-500">Waiting for the other teams…</p>
          <button onClick={() => nav('/result')} className="rounded-xl bg-indigo-600 px-4 py-3 text-white">See ranking</button>
        </div>
      )}
    </div>
  );
}
