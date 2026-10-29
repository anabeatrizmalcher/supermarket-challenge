import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../features/game/content/config';
import { generatePlans } from '../features/game/logic/plans';
import { TEAMS, TEAM_HEX } from '../features/game/state/types';
import { api } from '../features/match/api';
import { refreshNow, serverNow, startMs, useMatchStore, useTick } from '../features/match/hooks';
import ConnectionBadge from '../ui/ConnectionBadge';
import { getPlayerId, isHost } from '../lib/player';

export default function Lobby() {
  useTick(200);
  const snap = useMatchStore((s) => s.snap);
  const nav = useNavigate();
  const me = getPlayerId();
  const host = isHost();
  const mine = snap?.players.find((p) => p.id === me);
  const st = snap?.match.status;
  const s0 = snap ? startMs(snap) : null;
  const secs = s0 === null ? null : CONFIG.countdownSeconds - (serverNow() - s0) / 1000;

  useEffect(() => {
    if (!snap) return;
    if (st === 'finished') nav('/result', { replace: true });
    if (st === 'playing' && mine && secs !== null && secs <= 0) nav('/play', { replace: true });
    if (st === 'lobby' && !mine && !host) nav('/', { replace: true });
  });

  if (!snap) return <p className="p-6">Loading…</p>;

  const start = async () => {
    const seed = Math.floor(Math.random() * 2 ** 31);
    await api.start(snap.match.id, { seed, plans: generatePlans(seed, TEAMS), maxSeconds: CONFIG.maxSeconds });
    await refreshNow();
  };

  if (st === 'playing' && secs !== null && secs > 0)
    return (
      <div className="flex h-full items-center justify-center bg-indigo-700 text-white">
        <div className="text-[10rem] font-extrabold">{mine ? Math.ceil(secs) : '…'}</div>
      </div>
    );

  return (
    <div className="mx-auto max-w-md p-4">
      <ConnectionBadge />
      <h1 className="text-2xl font-bold">Lobby</h1>
      <p className="mb-3 text-slate-600">Waiting for the host to start…</p>
      <ul className="space-y-2">
        {TEAMS.map((t) => {
          const n = snap.players.filter((p) => p.team === t).length;
          return (
            <li key={t} className="flex items-center justify-between rounded-xl px-4 py-3 text-white" style={{ background: TEAM_HEX[t] }}>
              <span className="font-bold capitalize">{t} {mine?.team === t && '(you)'}</span>
              <span>{n}/{CONFIG.teamSize}</span>
            </li>
          );
        })}
      </ul>
      {mine && st === 'lobby' && <button onClick={() => nav('/')} className="mt-3 w-full rounded-xl bg-slate-200 py-3">Change team</button>}
      {host && (
        <div className="mt-4 flex flex-col gap-2 rounded-xl border-2 border-dashed p-3">
          <p className="text-sm font-bold">Host</p>
          <button disabled={st !== 'lobby' || snap.players.length === 0} onClick={start} className="rounded-xl bg-green-600 py-3 font-bold text-white disabled:opacity-40">▶ Start</button>
          <button onClick={async () => { await api.newMatch(); await refreshNow(); }} className="rounded-xl bg-red-600 py-3 font-bold text-white">New match (clears everything)</button>
        </div>
      )}
    </div>
  );
}
