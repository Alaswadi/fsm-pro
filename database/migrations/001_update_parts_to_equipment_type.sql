-- Migration: Update parts table to use equipment_type_id instead of brand
-- Date: 2025-10-31
-- Description: This migration replaces the brand field with equipment_type_id foreign key

-- Step 1: Add the new equipment_type_id column
ALTER TABLE parts ADD COLUMN IF NOT EXISTS equipment_type_id UUID REFERENCES equipment_types(id) ON DELETE SET NULL;

-- Step 2: Migrate existing data (optional - try to match brands to equipment types)
-- This attempts to link parts to equipment types based on matching brand names
-- Note: This is a best-effort migration and may not match all parts
UPDATE parts p
SET equipment_type_id = (
    SELECT et.id 
    FROM equipment_types et 
    WHERE et.brand = p.brand 
    AND et.company_id = p.company_id
    LIMIT 1
)
WHERE p.brand IS NOT NULL 
AND p.equipment_type_id IS NULL;

-- Step 3: Drop the old brand column
-- WARNING: This will permanently delete the brand data
-- Comment out this line if you want to keep the brand column for reference
ALTER TABLE parts DROP COLUMN IF EXISTS brand;

-- Step 4: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_parts_equipment_type_id ON parts(equipment_type_id);

-- Verification query (run this to check the migration)
-- SELECT 
--   COUNT(*) as total_parts,
--   COUNT(equipment_type_id) as parts_with_equipment_type,
--   COUNT(*) - COUNT(equipment_type_id) as parts_without_equipment_type
-- FROM parts;

