-- Rollback Migration: Remove workshop/depot repair fields from jobs table
-- Date: 2024-11-04
-- Description: Rollback script to remove workshop functionality from jobs table

-- Drop indexes
DROP INDEX IF EXISTS idx_jobs_delivery_technician_id;
DROP INDEX IF EXISTS idx_jobs_delivery_scheduled_date;
DROP INDEX IF EXISTS idx_jobs_estimated_completion_date;
DROP INDEX IF EXISTS idx_jobs_location_type;

-- Drop columns
ALTER TABLE jobs DROP COLUMN IF EXISTS delivery_technician_id;
ALTER TABLE jobs DROP COLUMN IF EXISTS delivery_scheduled_date;
ALTER TABLE jobs DROP COLUMN IF EXISTS pickup_delivery_fee;
ALTER TABLE jobs DROP COLUMN IF EXISTS estimated_completion_date;
ALTER TABLE jobs DROP COLUMN IF EXISTS location_type;
