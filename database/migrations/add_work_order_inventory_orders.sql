-- Migration: Add work order inventory orders tracking
-- This table will track all inventory items ordered for specific work orders

CREATE TABLE work_order_inventory_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL,
    part_id UUID NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    ordered_by UUID NOT NULL, -- technician who ordered
    ordered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'ordered' CHECK (status IN ('ordered', 'accepted', 'delivered', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_work_order_inventory_orders_work_order 
        FOREIGN KEY (work_order_id) REFERENCES jobs(id) ON DELETE CASCADE,
    CONSTRAINT fk_work_order_inventory_orders_part 
        FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE RESTRICT,
    CONSTRAINT fk_work_order_inventory_orders_technician 
        FOREIGN KEY (ordered_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Create indexes for better query performance
CREATE INDEX idx_work_order_inventory_orders_work_order_id ON work_order_inventory_orders(work_order_id);
CREATE INDEX idx_work_order_inventory_orders_part_id ON work_order_inventory_orders(part_id);
CREATE INDEX idx_work_order_inventory_orders_ordered_by ON work_order_inventory_orders(ordered_by);
CREATE INDEX idx_work_order_inventory_orders_status ON work_order_inventory_orders(status);
CREATE INDEX idx_work_order_inventory_orders_ordered_at ON work_order_inventory_orders(ordered_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_work_order_inventory_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_work_order_inventory_orders_updated_at
    BEFORE UPDATE ON work_order_inventory_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_work_order_inventory_orders_updated_at();

-- Add some sample data for testing (optional)
-- INSERT INTO work_order_inventory_orders (work_order_id, part_id, quantity, unit_price, ordered_by, notes)
-- SELECT 
--     j.id as work_order_id,
--     p.id as part_id,
--     2 as quantity,
--     p.unit_price,
--     t.user_id as ordered_by,
--     'Sample ordered equipment for testing'
-- FROM jobs j
-- CROSS JOIN parts p
-- LEFT JOIN technicians t ON j.technician_id = t.id
-- WHERE j.status = 'in_progress' 
--   AND p.current_stock > 0
--   AND t.user_id IS NOT NULL
-- LIMIT 5;