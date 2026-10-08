-- Apply once to existing databases before restarting the order service.
-- Hibernate ddl-auto=update does not reliably replace existing CHECK constraints.
BEGIN;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_current_status_check;
ALTER TABLE order_items ADD CONSTRAINT order_items_current_status_check
    CHECK (current_status IN ('PENDING', 'IN_PRODUCTION', 'COMPLETED', 'SHIPPED', 'DELIVERED', 'CANCELLED'));

-- Repair stale items using the persisted parent state; preserve shipping progress.
UPDATE order_items i
SET current_status = CASE o.order_status
    WHEN 'IN_PROGRESS' THEN 'IN_PRODUCTION'
    WHEN 'COMPLETED' THEN 'COMPLETED'
    WHEN 'DELIVERED' THEN 'DELIVERED'
    WHEN 'CANCELLED' THEN 'CANCELLED'
END
FROM orders o
WHERE i.order_id = o.order_id
  AND o.order_status IN ('IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED')
  AND (i.current_status IS NULL OR i.current_status IN ('PENDING', 'IN_PRODUCTION', 'COMPLETED')
       OR (i.current_status = 'SHIPPED' AND o.order_status = 'DELIVERED'));
COMMIT;
