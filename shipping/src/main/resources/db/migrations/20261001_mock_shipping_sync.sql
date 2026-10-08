-- Local ddl-auto=update adds this automatically. For managed schemas, apply before deploying.
-- NULL intentionally avoids replaying historic shipments.
ALTER TABLE shipment ADD COLUMN IF NOT EXISTS order_sync_pending boolean;
