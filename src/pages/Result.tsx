import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../features/game/content/config';
import { rankTeams, type PlayerResult } from '../features/game/logic/ranking';
import { TEAM_HEX, TEAM_PT, TEAM_TEXT, type TeamColor } from '../features/game/state/types';
import { api } from '../features/match/api';
import { isClosed, refreshNow, useMatchStore, useTick } from '../features/match/hooks';
import { getPlayerId, isHost } from '../lib/player';

export default function Result() {
  useTick(1000);
  const snap = useMatchStore((s) => s.snap);
  const nav = useNavigate();
  if (!snap) return <p className="p-6">Carregando…</p>;
  const closed = isClosed(snap);
  const me = snap.players.find((p) => p.id === getPlayerId());
  const ranks = rankTeams(
    snap.players.map((p): PlayerResult => ({ team: p.team as TeamColor, status: p.status, score: p.score, elapsed: p.elapsed_seconds })),
    CONFIG.maxSeconds,
  );
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

  return (
    <div className="mx-auto max-w-md p-4">
      <h1 className="text-center text-3xl font-extrabold">🏆 Ranking</h1>
      {!closed ? (
        <p className="my-6 text-center text-slate-600">Esperando os outros times…</p>
      ) : (
        <ol className="mt-4 space-y-2">
          {ranks.map((r, i) => (
            <li key={r.team} className={`flex items-center justify-between rounded-xl px-4 py-3 text-white ${i === 0 ? 'ring-4 ring-yellow-300' : ''}`} style={{ background: TEAM_HEX[r.team], color: TEAM_TEXT[r.team] }}>
              <span className="font-bold capitalize">{i === 0 ? '👑' : `${i + 1}.`} {r.team} <span className="text-sm font-normal opacity-90">({TEAM_PT[r.team]})</span></span>
              <span>{r.score.toFixed(1)} pts · {fmt(r.time)}</span>
            </li>
          ))}
        </ol>
      )}
      {me && <p className="mt-4 text-center">Seus pontos: <b>{me.status === 'lost' ? 0 : me.score}</b></p>}
      {isHost() && (
        <div className="mt-6 flex flex-col gap-2 rounded-xl border-2 border-dashed p-3">
          {!closed && <button onClick={async () => {
                if (!confirm('Encerrar a partida agora? Quem ainda não terminou fica com 0 pontos.')) return;
                await api.finish(snap.match.id);
                await refreshNow();
              }} className="rounded-xl bg-amber-500 py-3 font-bold text-white">Encerrar partida agora</button>}
          <button onClick={async () => {
              if (!confirm('Começar uma NOVA partida? Isso apaga a partida atual para todos os alunos.')) return;
              await api.newMatch();
              await refreshNow();
              nav('/lobby');
            }} className="rounded-xl bg-red-600 py-3 font-bold text-white">Nova partida</button>
        </div>
      )}
      <button onClick={() => nav('/')} className="mt-4 w-full rounded-xl bg-slate-200 py-3">Voltar ao início</button>
    </div>
  );
}
