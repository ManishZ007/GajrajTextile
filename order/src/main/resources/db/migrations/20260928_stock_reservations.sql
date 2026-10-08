-- Apply to the orders database. NULL preserves existing orders' stock behavior.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reservation_managed boolean;
