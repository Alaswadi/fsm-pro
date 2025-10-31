-- Migration: Add due_date column to jobs table
-- Date: 2025-09-05
-- Description: Add due_date field to work orders for better job scheduling and tracking

-- Add due_date column to jobs table
ALTER TABLE jobs ADD COLUMN due_date DATE;

-- Add index for due_date for better query performance
CREATE INDEX idx_jobs_due_date ON jobs(due_date);

-- Add comment to document the column
COMMENT ON COLUMN jobs.due_date IS 'Target completion date for the work order';

-- Update existing jobs to have a default due_date (optional - can be NULL for existing records)
-- This is commented out to allow existing jobs to have NULL due_date
-- UPDATE jobs SET due_date = (scheduled_date::date + INTERVAL '7 days')::date WHERE due_date IS NULL AND scheduled_date IS NOT NULL;
