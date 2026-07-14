-- Rate limiting for public (unauthenticated) endpoints. A fixed-window counter keyed by
-- "<endpoint>:<ip>", incremented atomically so it holds across Vercel's serverless
-- instances (an in-memory limiter would not). Server-only: RLS enabled with no policies
-- (the service role bypasses RLS; the public anon/authenticated key gets nothing).

create table if not exists public.rate_limits (
  bucket        text        not null,
  window_start  timestamptz not null,
  count         integer     not null default 0,
  primary key (bucket, window_start)
);

alter table public.rate_limits enable row level security;

-- Atomic "hit": bump the current window's counter and report whether the caller is still
-- within `p_max`. SECURITY DEFINER so it runs under the function owner regardless of the
-- (service-role) caller. The window is quantized to p_window_seconds.
create or replace function public.rate_limit_hit(
  p_bucket text,
  p_max integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.rate_limits (bucket, window_start, count)
  values (p_bucket, v_window_start, 1)
  on conflict (bucket, window_start)
  do update set count = public.rate_limits.count + 1
  returning count into v_count;
  return v_count <= p_max;
end;
$$;

-- Only the service role should ever call this.
revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
