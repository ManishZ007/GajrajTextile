-- Preserve NULL for old orders: they deducted stock during creation.
-- New orders explicitly write false until stock has been deducted.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted boolean;
