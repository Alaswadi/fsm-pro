# Workshop/Depot Repair Migration Guide

## Overview

This migration adds complete workshop/depot repair functionality to the FSM Pro platform, enabling the system to handle equipment repairs at the company's workshop facility.

## Migration Files

### Main Migration Files

1. **workshop_migration.sql** - Complete migration script that applies all changes
2. **workshop_migration_rollback.sql** - Complete rollback script to remove all changes

### Individual Migration Files

1. **002_add_workshop_fields_to_jobs.sql** - Extends jobs table with workshop fields
   - **002_add_workshop_fields_to_jobs_rollback.sql** - Rollback for jobs table changes

2. **003_create_workshop_tables.sql** - Creates all workshop-related tables
   - **003_create_workshop_tables_rollback.sql** - Rollback for workshop tables

3. **004_seed_workshop_settings.sql** - Seeds default workshop settings for companies

## Database Changes

### Jobs Table Extensions

The following columns were added to the `jobs` table:

- `location_type` (VARCHAR(20)) - 'on_site' or 'workshop', defaults to 'on_site'
- `estimated_completion_date` (DATE) - Estimated completion date for workshop repairs
- `pickup_delivery_fee` (DECIMAL(10,2)) - Fee for equipment pickup/delivery
- `delivery_scheduled_date` (TIMESTAMP WITH TIME ZONE) - Scheduled delivery date
- `delivery_technician_id` (UUID) - Technician assigned for delivery

### New Tables Created

1. **equipment_intake** - Records equipment condition when received at workshop
   - Tracks reported issues, visual condition, damage notes, accessories
   - Stores customer signature and notes
   - Links to job via job_id (unique constraint)

2. **equipment_status** - Tracks current status of equipment in repair process
   - Current status field with enum type
   - Timestamp fields for each status transition
   - Links to job via job_id (unique constraint)

3. **equipment_status_history** - Audit trail of all status changes
   - Records from_status, to_status, changed_by, notes
   - Maintains complete history of status transitions

4. **intake_photos** - Photos taken during equipment intake
   - Supports multiple photo types (overall, damage, serial_number, accessories)
   - Links to equipment_intake record

5. **workshop_settings** - Company-specific workshop configuration
   - Capacity settings (max concurrent jobs, max jobs per technician)
   - Default settings (repair hours, delivery fee)
   - Workshop location and contact info
   - Notification preferences and templates

### New Enum Type

- **equipment_repair_status** - Enum with values:
  - pending_intake
  - in_transit
  - received
  - in_repair
  - repair_completed
  - ready_for_pickup
  - out_for_delivery
  - returned

## How to Apply Migration

### Windows

Run the batch script:
```batch
apply-workshop-migration.bat
```

### Manual Application

```bash
# Apply migration
docker-compose exec -T postgres psql -U fsm_user -d fsm_db < database/migrations/workshop_migration.sql

# Verify migration
docker-compose exec -T postgres psql -U fsm_user -d fsm_db -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%workshop%' OR table_name LIKE '%equipment%';"
```

## How to Rollback Migration

### Windows

Run the batch script:
```batch
apply-workshop-rollback.bat
```

**WARNING:** This will delete all workshop-related data!

### Manual Rollback

```bash
# Rollback migration
docker-compose exec -T postgres psql -U fsm_user -d fsm_db < database/migrations/workshop_migration_rollback.sql
```

## Seeding Workshop Settings

Workshop settings are automatically seeded for all existing companies during migration. To seed settings for new companies added after migration:

### Windows
```batch
seed-workshop-settings.bat
```

### Manual
```bash
docker-compose exec -T postgres psql -U fsm_user -d fsm_db < database/migrations/004_seed_workshop_settings.sql
```

## Default Workshop Settings

Each company receives the following default settings:

- **max_concurrent_jobs**: 20
- **max_jobs_per_technician**: 5
- **default_estimated_repair_hours**: 24 (1 day)
- **default_pickup_delivery_fee**: 0.00
- **send_intake_confirmation**: true
- **send_ready_notification**: true
- **send_status_updates**: true

## Verification Queries

### Check Jobs Table Columns
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name IN ('location_type', 'estimated_completion_date', 'pickup_delivery_fee', 'delivery_scheduled_date', 'delivery_technician_id');
```

### Check Workshop Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('equipment_intake', 'equipment_status', 'equipment_status_history', 'intake_photos', 'workshop_settings');
```

### Check Workshop Settings
```sql
SELECT c.name as company_name, 
       ws.max_concurrent_jobs, 
       ws.max_jobs_per_technician, 
       ws.default_estimated_repair_hours 
FROM companies c 
INNER JOIN workshop_settings ws ON c.id = ws.company_id;
```

### Check Equipment Status Enum
```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'equipment_repair_status'::regtype 
ORDER BY enumsortorder;
```

## Migration Status

✅ **Successfully Applied** - All database changes have been tested and verified on development database.

### What Was Created:
- 5 new tables (equipment_intake, equipment_status, equipment_status_history, intake_photos, workshop_settings)
- 1 new enum type (equipment_repair_status)
- 5 new columns in jobs table
- 15 new indexes for query optimization
- 3 new triggers for updated_at columns
- Default workshop settings for existing companies

### Next Steps:
1. Proceed to Task 2: TypeScript types and interfaces
2. Implement API endpoints for workshop functionality
3. Build frontend components for workshop management

## Support

For issues or questions about this migration, refer to:
- Design Document: `.kiro/specs/workshop-depot-repair/design.md`
- Requirements: `.kiro/specs/workshop-depot-repair/requirements.md`
- Tasks: `.kiro/specs/workshop-depot-repair/tasks.md`
