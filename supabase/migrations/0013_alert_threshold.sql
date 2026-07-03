-- Per-student "warn me when balance drops below" threshold for the low-credits alert.
-- The critical ($1) alert stays fixed.
alter table entitlements add column if not exists alert_threshold_cents integer not null default 500;
