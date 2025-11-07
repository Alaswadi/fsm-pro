-- Migration: Update inventory order status constraint to include 'accepted'
-- Description: Add 'accepted' status to the allowed statuses for inventory orders
-- Date: 2025-01-07

-- Drop the existing constraint
ALTER TABLE work_order_inventory_orders 
    DROP CONSTRAINT IF EXISTS work_order_inventory_orders_status_check;

-- Add the new constraint with 'accepted' status
ALTER TABLE work_order_inventory_orders 
    ADD CONSTRAINT work_order_inventory_orders_status_check 
    CHECK (status IN ('ordered', 'accepted', 'delivered', 'cancelled'));

-- Add comment
COMMENT ON COLUMN work_order_inventory_orders.status IS 'Order status: ordered (initial), accepted (admin approved), delivered (sent to technician), cancelled (rejected)';

