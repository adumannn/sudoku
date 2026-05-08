-- Allow authenticated users to insert their own daily_results row.
-- Server route /api/daily/submit also validates the solution + min_seconds before inserting.
create policy daily_results_self_insert on public.daily_results
  for insert with check (auth.uid() = user_id);
