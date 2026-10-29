-- Supermarket Challenge: run this whole file in the Supabase SQL editor.
create table matches (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'lobby' check (status in ('lobby','playing','finished')),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  config jsonb
);

create table players (
  id uuid primary key,
  match_id uuid not null references matches(id) on delete cascade,
  team text not null,
  status text not null default 'joined' check (status in ('joined','finished','lost')),
  score int not null default 0,
  spent int not null default 0,
  elapsed_seconds int,
  joined_at timestamptz not null default now()
);

alter table matches enable row level security;
alter table players enable row level security;
create policy read_matches on matches for select using (true);
create policy read_players on players for select using (true);
-- no insert/update/delete policies: only the functions below can write.

alter publication supabase_realtime add table matches, players;

create function join_team(p_match uuid, p_player uuid, p_team text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform 1 from matches where id = p_match and status = 'lobby' for update;
  if not found then raise exception 'match_not_open'; end if;
  if (select count(*) from players
      where match_id = p_match and team = p_team and id <> p_player) >= 4 then
    raise exception 'team_full';
  end if;
  insert into players (id, match_id, team) values (p_player, p_match, p_team)
  on conflict (id) do update set team = excluded.team, match_id = excluded.match_id;
end $$;

create function start_match(p_match uuid, p_config jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  update matches set config = p_config, started_at = now(), status = 'playing'
  where id = p_match and status = 'lobby';
  if not found then raise exception 'match_not_open'; end if;
end $$;

create function submit_result(p_player uuid, p_score int, p_spent int, p_elapsed int, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare v_match uuid;
begin
  if p_status not in ('finished','lost') then raise exception 'bad_status'; end if;
  update players set score = p_score, spent = p_spent, elapsed_seconds = p_elapsed, status = p_status
  where id = p_player returning match_id into v_match;
  if v_match is null then return; end if;
  if not exists (select 1 from players where match_id = v_match and status = 'joined') then
    update matches set status = 'finished' where id = v_match and status = 'playing';
  end if;
end $$;

create function finish_match(p_match uuid)
returns void language sql security definer set search_path = public as $$
  update matches set status = 'finished' where id = p_match and status = 'playing';
$$;

create function new_match()
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into matches default values returning id into v_id;
  return v_id;
end $$;

create function server_time()
returns timestamptz language sql stable as $$ select now(); $$;

grant execute on function join_team, start_match, submit_result, finish_match, new_match, server_time to anon;
