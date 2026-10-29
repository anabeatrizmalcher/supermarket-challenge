import type { TeamColor } from '../state/types';

export interface PlayerResult {
  team: TeamColor;
  status: 'joined' | 'finished' | 'lost';
  score: number;
  elapsed: number | null;
}
export interface TeamRank {
  team: TeamColor;
  score: number;
  time: number;
  players: number;
}

export function rankTeams(players: PlayerResult[], maxSeconds: number): TeamRank[] {
  const by = new Map<TeamColor, PlayerResult[]>();
  players.forEach((p) => by.set(p.team, [...(by.get(p.team) ?? []), p]));
  const ranks: TeamRank[] = [...by.entries()].map(([team, ps]) => ({
    team,
    players: ps.length,
    score: ps.reduce((s, p) => s + (p.status === 'lost' ? 0 : p.score), 0) / ps.length,
    time: ps.reduce((s, p) => s + (p.elapsed ?? maxSeconds), 0) / ps.length,
  }));
  return ranks.sort((a, b) => b.score - a.score || a.time - b.time);
}
