-- Apply to the payments database before starting the updated service.
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS user_id varchar(255);
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS order_confirmed boolean;
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS reservation_expires_at timestamp;
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS revision bigint;
UPDATE payment_records SET revision = 0 WHERE revision IS NULL;
