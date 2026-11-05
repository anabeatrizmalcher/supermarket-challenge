import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../features/game/content/config';
import { TEAMS, TEAM_HEX, TEAM_PT, TEAM_TEXT } from '../features/game/state/types';
import { api } from '../features/match/api';
import { refreshNow, useMatchStore } from '../features/match/hooks';
import LangToggle from '../ui/LangToggle';
import ConnectionBadge from '../ui/ConnectionBadge';
import { getPlayerId } from '../lib/player';

export default function Join() {
  const snap = useMatchStore((s) => s.snap);
  const error = useMatchStore((s) => s.error);
  const nav = useNavigate();
  const [msg, setMsg] = useState('');
  const me = getPlayerId();
  if (!snap) return <p className="p-6">{error ? `Problema de conexão: ${error}` : 'Carregando…'}</p>;
  const mine = snap.players.find((p) => p.id === me);

  if (snap.match.status !== 'lobby')
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold">{snap.match.status === 'finished' ? 'Partida encerrada' : 'Partida em andamento'}</h1>
        <p className="mt-2">Você poderá entrar na próxima partida, quando o professor(a) começar uma nova.</p>
        {mine && <button onClick={() => nav(snap.match.status === 'finished' ? '/result' : '/play')} className="mt-4 rounded-xl bg-indigo-600 px-4 py-3 text-white">Ir para o meu jogo</button>}
        <button onClick={() => nav('/result')} className="mt-4 block w-full text-indigo-700 underline">Ver o ranking</button>
      </div>
    );

  const join = async (team: string) => {
    try {
      await api.join(snap.match.id, me, team);
      await refreshNow();
      nav('/lobby');
    } catch (e) {
      setMsg((e as Error).message === 'team_full' ? 'Esse time está cheio.' : 'Não foi possível entrar. Tente de novo.');
    }
  };

  return (
    <div className="mx-auto max-w-md p-4">
      <ConnectionBadge />
      <div className="flex justify-end"><LangToggle /></div>
      <h1 className="text-center text-3xl font-extrabold">🛒 Supermarket Challenge</h1>
      <p className="mb-4 text-center text-slate-600">Escolha o seu time!</p>
      <div className="grid grid-cols-2 gap-3">
        {TEAMS.map((t) => {
          const n = snap.players.filter((p) => p.team === t).length;
          const full = n >= CONFIG.teamSize && mine?.team !== t;
          return (
            <button key={t} disabled={full} onClick={() => join(t)} style={{ background: TEAM_HEX[t], color: TEAM_TEXT[t] }}
              className={`rounded-2xl p-5 text-white shadow ${full ? 'opacity-40' : 'active:scale-95'} ${mine?.team === t ? 'ring-4 ring-slate-900' : ''}`}>
              <div className="text-xl font-bold capitalize">{t}</div>
              <div className="text-sm opacity-90">{TEAM_PT[t]}</div>
              <div className="text-lg">{n}/{CONFIG.teamSize}</div>
            </button>
          );
        })}
      </div>
      {msg && <p className="mt-3 text-center text-red-600">{msg}</p>}
    </div>
  );
}
