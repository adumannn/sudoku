-- Daily kanji calendar (one featured kanji per UTC date)
create table public.daily_seal_calendar (
  date date primary key,
  kanji text not null,
  romaji text not null,
  meaning text not null
);

-- RLS
alter table public.daily_seal_calendar enable row level security;

-- Daily seal calendar: world-readable (service role inserts; no public writes)
create policy daily_seal_calendar_world_read on public.daily_seal_calendar for select using (true);
