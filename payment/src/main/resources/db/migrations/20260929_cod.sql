-- Run against the payment database before restarting Payment Service.
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS cod_amount numeric(10,2);
ALTER TABLE payment_records DROP CONSTRAINT IF EXISTS payment_records_status_check;
ALTER TABLE payment_records ADD CONSTRAINT payment_records_status_check
    CHECK (status IN ('CREATED','INITIATED','PAID','FAILED','COD_PENDING','CANCELLED'));
