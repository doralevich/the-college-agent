-- Ambassador program core (July 2026 PRD): ambassadors with Stripe promo attribution,
-- sales that clear after the 7-day refund window with a lifetime bounty escalator
-- ($75 first 10, $100 after), bi-weekly payout runs gated on W-9, clawback ledger,
-- org/charity splits, and the demo sandbox's lead + capped-session tables.
-- All money in cents. Service-role access only (RLS on, no policies).

create table if not exists public.ambassadors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  school text,
  status text not null default 'pending', -- pending / approved / suspended
  stripe_promo_code text,                 -- the human code, e.g. JORDAN10
  stripe_promo_code_id text,              -- promo_...
  stripe_coupon_id text,
  referral_slug text unique,              -- /r/{slug}
  cleared_referral_count int not null default 0, -- drives the $75 -> $100 escalator
  w9_on_file boolean not null default false,     -- payout gate
  payout_method text,                     -- paypal / venmo
  payout_handle text,
  org_id uuid,
  donate_share boolean not null default false,   -- student donates own share to the org
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'club',      -- club / team / greek / charity
  org_code text unique,
  student_split_cents int not null default 1500,
  org_split_cents int not null default 1500,
  payout_method text,
  payout_handle text,
  status text not null default 'pending', -- active / pending
  created_at timestamptz not null default now()
);

alter table public.ambassadors
  add constraint ambassadors_org_fk foreign key (org_id) references public.orgs(id);

create table if not exists public.ambassador_sales (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid references public.ambassadors(id),
  org_id uuid references public.orgs(id),
  purchaser_email text,
  stripe_customer_id text,
  stripe_payment_intent_id text,
  stripe_session_id text unique,          -- idempotency for webhook replays
  coupon_code_used text,
  card_fingerprint text,                  -- cluster-fraud flagging
  gross_cents int not null default 0,
  status text not null default 'pending', -- pending / cleared / refunded / reversed / review
  review_reason text,
  clears_at timestamptz not null,         -- purchase + 7 days (mirrors the refund window)
  payout_id uuid,
  bounty_cents int,                       -- locked at clear time; never recomputed
  created_at timestamptz not null default now()
);
create index if not exists ambassador_sales_pending_idx on public.ambassador_sales (clears_at) where status = 'pending';
create index if not exists ambassador_sales_amb_idx on public.ambassador_sales (ambassador_id, created_at desc);

create table if not exists public.ambassador_payouts (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid references public.ambassadors(id),
  org_id uuid references public.orgs(id),
  payee_type text not null default 'ambassador', -- ambassador / org
  run_date date not null,
  total_cents int not null,               -- can be negative when clawbacks exceed earnings
  status text not null default 'queued',  -- queued / paid / held_no_w9
  method text,
  handle text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ambassador_payouts_run_idx on public.ambassador_payouts (run_date);

alter table public.ambassador_sales
  add constraint ambassador_sales_payout_fk foreign key (payout_id) references public.ambassador_payouts(id);

create table if not exists public.ambassador_ledger_adjustments (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid not null references public.ambassadors(id),
  sale_id uuid references public.ambassador_sales(id),
  amount_cents int not null,              -- negative
  reason text not null,                   -- chargeback / late_refund
  applied_to_payout_id uuid references public.ambassador_payouts(id),
  created_at timestamptz not null default now()
);

create table if not exists public.demo_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  phone text,
  school text,
  grad_year int,
  ambassador_id uuid references public.ambassadors(id), -- null = house / organic
  email_opt_in boolean not null default false,
  sms_opt_in boolean not null default false,            -- distinct TCPA consent
  mailchimp_synced boolean not null default false,
  converted_to_paid boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.demo_sessions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.demo_leads(id) on delete cascade,
  school text,
  grad_year int,
  message_count int not null default 0,   -- hard per-session cap (cost control)
  token_count int not null default 0,
  expires_at timestamptz not null,        -- created_at + 12h; hourly cron deletes expired
  created_at timestamptz not null default now()
);
create index if not exists demo_sessions_expiry_idx on public.demo_sessions (expires_at);

alter table public.ambassadors enable row level security;
alter table public.orgs enable row level security;
alter table public.ambassador_sales enable row level security;
alter table public.ambassador_payouts enable row level security;
alter table public.ambassador_ledger_adjustments enable row level security;
alter table public.demo_leads enable row level security;
alter table public.demo_sessions enable row level security;
