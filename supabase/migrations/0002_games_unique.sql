create unique index games_user_puzzle_unique on public.games(user_id, puzzle_id) where puzzle_id is not null;
create unique index games_user_daily_unique on public.games(user_id, daily_date) where daily_date is not null;
