-- Migration: Add inventory order status log table
-- Description: Track all status changes for inventory orders for audit purposes
-- Date: 2025-01-07

-- Create inventory_order_status_log table
CREATE TABLE IF NOT EXISTS inventory_order_status_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES work_order_inventory_orders(id) ON DELETE CASCADE,
    old_status VARCHAR(20) NOT NULL,
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_order_status_log_order_id 
    ON inventory_order_status_log(order_id);

CREATE INDEX IF NOT EXISTS idx_inventory_order_status_log_changed_by 
    ON inventory_order_status_log(changed_by);

CREATE INDEX IF NOT EXISTS idx_inventory_order_status_log_created_at 
    ON inventory_order_status_log(created_at DESC);

-- Add comment to table
COMMENT ON TABLE inventory_order_status_log IS 'Audit log for all inventory order status changes';
COMMENT ON COLUMN inventory_order_status_log.order_id IS 'Reference to the inventory order';
COMMENT ON COLUMN inventory_order_status_log.old_status IS 'Previous status before change';
COMMENT ON COLUMN inventory_order_status_log.new_status IS 'New status after change';
COMMENT ON COLUMN inventory_order_status_log.changed_by IS 'User who made the status change';
COMMENT ON COLUMN inventory_order_status_log.notes IS 'Optional notes about the status change';

