-- Why a credit failed to land (Agent37 budget call error), written by the webhook and the
-- provisioning starter grant so failures are diagnosable from the database.
alter table wallet_transactions add column if not exists failure_reason text;
