-- Migration: Fix inventory cancellation refund logic
-- Description: Ensure stock is properly refunded when inventory orders are cancelled
-- Date: 2025-01-07

-- This migration doesn't require schema changes, but documents the fix to the application logic
-- The fix ensures that when an inventory order is cancelled, the stock is properly refunded
-- regardless of the current status of the order.

-- Add comment to document the fix
COMMENT ON TABLE work_order_inventory_orders IS 'Tracks all inventory items ordered for specific work orders. When orders are cancelled, stock is refunded to the inventory.';