ALTER TABLE orders ADD COLUMN IF NOT EXISTS integration_pending boolean;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_started boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_collected boolean DEFAULT false;
-- Do not backfill collection or replay legacy orders automatically.
