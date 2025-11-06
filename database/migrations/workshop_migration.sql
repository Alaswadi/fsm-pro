-- Combined Workshop/Depot Repair Migration
-- Date: 2024-11-04
-- Description: Complete migration to add workshop/depot repair functionality to FSM Pro
-- This script combines all workshop-related database changes

-- ============================================================================
-- PART 1: Extend jobs table for workshop functionality
-- ============================================================================

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

-- ============================================================================
-- PART 2: Create workshop tables
-- ============================================================================

-- Create equipment_repair_status enum type
CREATE TYPE equipment_repair_status AS ENUM (
  'pending_intake',
  'in_transit',
  'received',
  'in_repair',
  'repair_completed',
  'ready_for_pickup',
  'out_for_delivery',
  'returned'
);

-- Create equipment_intake table
CREATE TABLE equipment_intake (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Intake details
  intake_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  received_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Equipment condition
  reported_issue TEXT NOT NULL,
  visual_condition TEXT,
  physical_damage_notes TEXT,
  accessories_included TEXT,
  
  -- Customer information at intake
  customer_signature TEXT,
  customer_notes TEXT,
  
  -- Internal notes
  internal_notes TEXT,
  estimated_repair_time INTEGER,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create equipment_status table
CREATE TABLE equipment_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Current status
  current_status equipment_repair_status NOT NULL DEFAULT 'pending_intake',
  
  -- Status timestamps (for quick access)
  pending_intake_at TIMESTAMP WITH TIME ZONE,
  in_transit_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  in_repair_at TIMESTAMP WITH TIME ZONE,
  repair_completed_at TIMESTAMP WITH TIME ZONE,
  ready_for_pickup_at TIMESTAMP WITH TIME ZONE,
  out_for_delivery_at TIMESTAMP WITH TIME ZONE,
  returned_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(job_id)
);

-- Create equipment_status_history table
CREATE TABLE equipment_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_status_id UUID REFERENCES equipment_status(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  
  -- Status change details
  from_status equipment_repair_status,
  to_status equipment_repair_status NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Optional notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create intake_photos table
CREATE TABLE intake_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_intake_id UUID REFERENCES equipment_intake(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  photo_type VARCHAR(50),
  caption TEXT,
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workshop_settings table
CREATE TABLE workshop_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Capacity settings
  max_concurrent_jobs INTEGER DEFAULT 20,
  max_jobs_per_technician INTEGER DEFAULT 5,
  
  -- Default settings
  default_estimated_repair_hours INTEGER DEFAULT 24,
  default_pickup_delivery_fee DECIMAL(10,2) DEFAULT 0.00,
  
  -- Workshop location
  workshop_address TEXT,
  workshop_phone VARCHAR(20),
  workshop_hours JSONB,
  
  -- Notification settings
  send_intake_confirmation BOOLEAN DEFAULT true,
  send_ready_notification BOOLEAN DEFAULT true,
  send_status_updates BOOLEAN DEFAULT true,
  
  -- Notification templates
  intake_confirmation_template TEXT,
  ready_notification_template TEXT,
  status_update_template TEXT,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for all new tables
CREATE INDEX idx_equipment_intake_job_id ON equipment_intake(job_id);
CREATE INDEX idx_equipment_intake_company_id ON equipment_intake(company_id);
CREATE INDEX idx_equipment_intake_intake_date ON equipment_intake(intake_date);

CREATE INDEX idx_equipment_status_job_id ON equipment_status(job_id);
CREATE INDEX idx_equipment_status_company_id ON equipment_status(company_id);
CREATE INDEX idx_equipment_status_current_status ON equipment_status(current_status);

CREATE INDEX idx_equipment_status_history_equipment_status_id ON equipment_status_history(equipment_status_id);
CREATE INDEX idx_equipment_status_history_job_id ON equipment_status_history(job_id);
CREATE INDEX idx_equipment_status_history_changed_at ON equipment_status_history(changed_at);

CREATE INDEX idx_intake_photos_equipment_intake_id ON intake_photos(equipment_intake_id);

CREATE INDEX idx_workshop_settings_company_id ON workshop_settings(company_id);

-- Add updated_at triggers
CREATE TRIGGER update_equipment_intake_updated_at 
  BEFORE UPDATE ON equipment_intake 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_status_updated_at 
  BEFORE UPDATE ON equipment_status 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workshop_settings_updated_at 
  BEFORE UPDATE ON workshop_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments to document the tables
COMMENT ON TABLE equipment_intake IS 'Records equipment condition and details when received at workshop';
COMMENT ON TABLE equipment_status IS 'Tracks current status of equipment in workshop repair process';
COMMENT ON TABLE equipment_status_history IS 'Audit trail of all equipment status changes';
COMMENT ON TABLE intake_photos IS 'Photos taken during equipment intake process';
COMMENT ON TABLE workshop_settings IS 'Company-specific workshop configuration and settings';

-- ============================================================================
-- PART 3: Seed default workshop settings for existing companies
-- ============================================================================

-- Insert default workshop settings for all existing companies
INSERT INTO workshop_settings (
  company_id,
  max_concurrent_jobs,
  max_jobs_per_technician,
  default_estimated_repair_hours,
  default_pickup_delivery_fee,
  send_intake_confirmation,
  send_ready_notification,
  send_status_updates
)
SELECT 
  id,
  20,
  5,
  24,
  0.00,
  true,
  true,
  true
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM workshop_settings WHERE workshop_settings.company_id = companies.id
);

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Log migration completion
DO $
BEGIN
  RAISE NOTICE 'Workshop/Depot Repair migration completed successfully';
  RAISE NOTICE 'Added % workshop settings records', (SELECT COUNT(*) FROM workshop_settings);
END $;
