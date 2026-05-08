-- Daily seal lines cache (one Sensei micro-line per date, shared across all users)
create table public.daily_seal_lines (
  date date primary key references public.daily_seal_calendar(date) on delete cascade,
  line text not null,
  generated_at timestamptz not null default now()
);

-- RLS
alter table public.daily_seal_lines enable row level security;

-- Daily seal lines: world-readable (service role inserts; no public writes)
create policy daily_seal_lines_world_read on public.daily_seal_lines for select using (true);
