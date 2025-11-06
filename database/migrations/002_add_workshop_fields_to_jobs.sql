-- Migration: Add workshop/depot repair fields to jobs table
-- Date: 2024-11-04
-- Description: Extend jobs table to support workshop/depot repair functionality

-- Add location_type column with CHECK constraint
ALTER TABLE jobs ADD COLUMN location_type VARCHAR(20) DEFAULT 'on_site' 
    CHECK (location_type IN ('on_site', 'workshop'));

-- Add estimated_completion_date column
ALTER TABLE jobs ADD COLUMN estimated_completion_date DATE;

-- Add pickup_delivery_fee column
ALTER TABLE jobs ADD COLUMN pickup_delivery_fee DECIMAL(10,2) DEFAULT 0.00;

-- Add delivery_scheduled_date column
ALTER TABLE jobs ADD COLUMN delivery_scheduled_date TIMESTAMP WITH TIME ZONE;

-- Add delivery_technician_id column with foreign key to technicians
ALTER TABLE jobs ADD COLUMN delivery_technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL;

-- Create indexes on new columns for better query performance
CREATE INDEX idx_jobs_location_type ON jobs(location_type);
CREATE INDEX idx_jobs_estimated_completion_date ON jobs(estimated_completion_date);
CREATE INDEX idx_jobs_delivery_scheduled_date ON jobs(delivery_scheduled_date);
CREATE INDEX idx_jobs_delivery_technician_id ON jobs(delivery_technician_id);

-- Add comments to document the columns
COMMENT ON COLUMN jobs.location_type IS 'Indicates whether job is performed on-site or at workshop';
COMMENT ON COLUMN jobs.estimated_completion_date IS 'Estimated date when workshop repair will be completed';
COMMENT ON COLUMN jobs.pickup_delivery_fee IS 'Fee charged for equipment pickup or delivery';
COMMENT ON COLUMN jobs.delivery_scheduled_date IS 'Scheduled date and time for equipment delivery';
COMMENT ON COLUMN jobs.delivery_technician_id IS 'Technician assigned to deliver repaired equipment';

-- Set default value 'on_site' for existing jobs (already handled by DEFAULT in ALTER TABLE)
-- All existing jobs will automatically have location_type = 'on_site'
