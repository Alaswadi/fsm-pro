-- Rollback Migration: Remove workshop/depot repair tables
-- Date: 2024-11-04
-- Description: Rollback script to remove all workshop-related tables

-- Drop triggers
DROP TRIGGER IF EXISTS update_workshop_settings_updated_at ON workshop_settings;
DROP TRIGGER IF EXISTS update_equipment_status_updated_at ON equipment_status;
DROP TRIGGER IF EXISTS update_equipment_intake_updated_at ON equipment_intake;

-- Drop indexes
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
