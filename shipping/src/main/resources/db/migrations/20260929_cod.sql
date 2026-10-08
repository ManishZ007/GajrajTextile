ALTER TABLE shipment ADD COLUMN IF NOT EXISTS payment_method varchar(255);
ALTER TABLE shipment ADD COLUMN IF NOT EXISTS cod_amount numeric(38,2);
ALTER TABLE shipment ADD COLUMN IF NOT EXISTS cod_collected boolean DEFAULT false;
