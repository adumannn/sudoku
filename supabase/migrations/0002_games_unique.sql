-- `if not exists` makes this idempotent so Supabase preview branches that
-- re-run migrations on each commit (after the initial fresh apply) don't fail
-- with `relation "..._unique" already exists`. Same pattern as the 0007
-- setval fix in PR #8.
create unique index if not exists games_user_puzzle_unique on public.games(user_id, puzzle_id) where puzzle_id is not null;
create unique index if not exists games_user_daily_unique on public.games(user_id, daily_date) where daily_date is not null;
