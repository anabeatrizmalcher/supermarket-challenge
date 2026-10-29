import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { uid } from '../../lib/player';
import { CONFIG } from '../game/content/config';
import type { MatchConfig } from '../game/state/types';

export interface MatchRow {
  id: string;
  status: 'lobby' | 'playing' | 'finished';
  started_at: string | null;
  config: MatchConfig | null;
}
export interface PlayerRow {
  id: string;
  match_id: string;
  team: string;
  status: 'joined' | 'finished' | 'lost';
  score: number;
  spent: number;
  elapsed_seconds: number | null;
}
export interface Snapshot {
  match: MatchRow;
  players: PlayerRow[];
}

export interface MatchApi {
  mode: 'supabase' | 'local';
  getSnapshot(): Promise<Snapshot>;
  serverOffset(): Promise<number>;
  join(matchId: string, playerId: string, team: string): Promise<void>;
  start(matchId: string, config: MatchConfig): Promise<void>;
  submit(playerId: string, score: number, spent: number, elapsed: number, status: 'finished' | 'lost'): Promise<void>;
  finish(matchId: string): Promise<void>;
  newMatch(): Promise<void>;
  subscribe(onChange: () => void, onStatus?: (s: string) => void): () => void;
}

/* ---------- Supabase ---------- */
function supabaseApi(sb: SupabaseClient): MatchApi {
  const check = <T>(r: { data: T; error: { message: string } | null }) => {
    if (r.error) throw new Error(r.error.message);
    return r.data;
  };
  return {
    mode: 'supabase',
    async getSnapshot() {
      let match = check(
        await sb.from('matches').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ) as MatchRow | null;
      if (!match) {
        const id = check(await sb.rpc('new_match'));
        match = check(await sb.from('matches').select('*').eq('id', id).single()) as MatchRow;
      }
      const players = check(await sb.from('players').select('*').eq('match_id', match.id)) as PlayerRow[];
      return { match, players };
    },
    async serverOffset() {
      const t0 = Date.now();
      const server = check(await sb.rpc('server_time')) as string;
      const t1 = Date.now();
      return new Date(server).getTime() - (t0 + t1) / 2;
    },
    async join(p_match, p_player, p_team) {
      check(await sb.rpc('join_team', { p_match, p_player, p_team }));
    },
    async start(p_match, p_config) {
      check(await sb.rpc('start_match', { p_match, p_config }));
    },
    async submit(p_player, p_score, p_spent, p_elapsed, p_status) {
      check(await sb.rpc('submit_result', { p_player, p_score, p_spent, p_elapsed, p_status }));
    },
    async finish(p_match) {
      check(await sb.rpc('finish_match', { p_match }));
    },
    async newMatch() {
      check(await sb.rpc('new_match'));
    },
    subscribe(onChange, onStatus) {
      const ch = sb
        .channel('sc-match')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, onChange)
        .subscribe((status) => onStatus?.(status));
      return () => {
        void sb.removeChannel(ch);
      };
    },
  };
}

/* ---------- Local fallback (same browser, many tabs) ---------- */
const LKEY = 'sc:local-db';
function localApi(): MatchApi {
  const fresh = (): Snapshot => ({
    match: { id: uid(), status: 'lobby', started_at: null, config: null },
    players: [],
  });
  const read = (): Snapshot => {
    const raw = localStorage.getItem(LKEY);
    return raw ? (JSON.parse(raw) as Snapshot) : write(fresh());
  };
  const write = (s: Snapshot) => {
    localStorage.setItem(LKEY, JSON.stringify(s));
    return s;
  };
  const closeIfDone = (s: Snapshot) => {
    if (s.match.status === 'playing' && s.players.every((p) => p.status !== 'joined')) s.match.status = 'finished';
  };
  return {
    mode: 'local',
    async getSnapshot() {
      return read();
    },
    async serverOffset() {
      return 0;
    },
    async join(matchId, playerId, team) {
      const s = read();
      if (s.match.id !== matchId || s.match.status !== 'lobby') throw new Error('match_not_open');
      if (s.players.filter((p) => p.team === team && p.id !== playerId).length >= CONFIG.teamSize)
        throw new Error('team_full');
      const me = s.players.find((p) => p.id === playerId);
      if (me) me.team = team;
      else
        s.players.push({ id: playerId, match_id: matchId, team, status: 'joined', score: 0, spent: 0, elapsed_seconds: null });
      write(s);
    },
    async start(matchId, config) {
      const s = read();
      if (s.match.id !== matchId || s.match.status !== 'lobby') throw new Error('match_not_open');
      s.match = { ...s.match, status: 'playing', started_at: new Date().toISOString(), config };
      write(s);
    },
    async submit(playerId, score, spent, elapsed, status) {
      const s = read();
      const p = s.players.find((x) => x.id === playerId);
      if (!p) return;
      Object.assign(p, { score, spent, elapsed_seconds: elapsed, status });
      closeIfDone(s);
      write(s);
    },
    async finish() {
      const s = read();
      s.match.status = 'finished';
      write(s);
    },
    async newMatch() {
      write(fresh());
    },
    subscribe(onChange) {
      const h = (e: StorageEvent) => e.key === LKEY && onChange();
      window.addEventListener('storage', h);
      return () => window.removeEventListener('storage', h);
    },
  };
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const api: MatchApi = url && key ? supabaseApi(createClient(url, key)) : localApi();
