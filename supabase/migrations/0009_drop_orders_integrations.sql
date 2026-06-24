-- Drop the per-order integrations selection.
--
-- The /build checkout no longer asks students to pick integrations (that "Choose Your
-- Integrations" step was removed). Integrations are finalized during co-training, not stored
-- as an order field, so the column is dead. Nothing reads it anymore (checkout route, Stripe
-- webhook, and order-summary email all stopped selecting/writing it).

alter table public.orders drop column if exists integrations;
