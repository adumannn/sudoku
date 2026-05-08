-- Streak freezes ledger (Pro-tier per-user monthly allotment)
create table public.streak_freezes (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  granted_month date not null,
  granted_at timestamptz not null default now(),
  primary key (user_id, date)
);

create index streak_freezes_user_month_idx
  on public.streak_freezes(user_id, granted_month);

-- RLS
alter table public.streak_freezes enable row level security;

-- Streak freezes: users read/write only their own
create policy streak_freezes_owner_all on public.streak_freezes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
