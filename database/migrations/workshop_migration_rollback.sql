-- Rollback Workshop/Depot Repair Migration
-- Date: 2024-11-04
-- Description: Complete rollback to remove all workshop/depot repair functionality
-- WARNING: This will delete all workshop-related data

-- ============================================================================
-- PART 1: Remove workshop tables
-- ============================================================================

-- Drop triggers
DROP TRIGGER IF EXISTS update_workshop_settings_updated_at ON workshop_settings;
DROP TRIGGER IF EXISTS update_equipment_status_updated_at ON equipment_status;
DROP TRIGGER IF EXISTS update_equipment_intake_updated_at ON equipment_intake;

-- Drop indexes for workshop tables
DROP INDEX IF EXISTS idx_workshop_settings_company_id;
DROP INDEX IF EXISTS idx_intake_photos_equipment_intake_id;
DROP INDEX IF EXISTS idx_equipment_status_history_changed_at;
DROP INDEX IF EXISTS idx_equipment_status_history_job_id;
DROP INDEX IF EXISTS idx_equipment_status_history_equipment_status_id;
DROP INDEX IF EXISTS idx_equipment_status_current_status;
DROP INDEX IF EXISTS idx_equipment_status_company_id;
DROP INDEX IF EXISTS idx_equipment_status_job_id;
DROP INDEX IF EXISTS idx_equipment_intake_intake_date;
DROP INDEX IF EXISTS idx_equipment_intake_company_id;
DROP INDEX IF EXISTS idx_equipment_intake_job_id;

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS workshop_settings;
DROP TABLE IF EXISTS intake_photos;
DROP TABLE IF EXISTS equipment_status_history;
DROP TABLE IF EXISTS equipment_status;
DROP TABLE IF EXISTS equipment_intake;

-- Drop enum type
DROP TYPE IF EXISTS equipment_repair_status;

-- ============================================================================
-- PART 2: Remove workshop fields from jobs table
-- ============================================================================

-- Drop indexes for jobs table workshop fields
DROP INDEX IF EXISTS idx_jobs_delivery_technician_id;
DROP INDEX IF EXISTS idx_jobs_delivery_scheduled_date;
DROP INDEX IF EXISTS idx_jobs_estimated_completion_date;
DROP INDEX IF EXISTS idx_jobs_location_type;

-- Drop columns from jobs table
ALTER TABLE jobs DROP COLUMN IF EXISTS delivery_technician_id;
ALTER TABLE jobs DROP COLUMN IF EXISTS delivery_scheduled_date;
ALTER TABLE jobs DROP COLUMN IF EXISTS pickup_delivery_fee;
ALTER TABLE jobs DROP COLUMN IF EXISTS estimated_completion_date;
ALTER TABLE jobs DROP COLUMN IF EXISTS location_type;

-- ============================================================================
-- Rollback Complete
-- ============================================================================

-- Log rollback completion
DO $
BEGIN
  RAISE NOTICE 'Workshop/Depot Repair rollback completed successfully';
  RAISE NOTICE 'All workshop-related tables and fields have been removed';
END $;
