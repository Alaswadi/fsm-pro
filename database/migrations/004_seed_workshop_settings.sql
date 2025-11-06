-- Migration: Seed default workshop settings for existing companies
-- Date: 2024-11-04
-- Description: Create default workshop_settings record for each company with sensible defaults

-- Insert default workshop settings for all existing companies that don't have settings yet
INSERT INTO workshop_settings (
  company_id,
  max_concurrent_jobs,
  max_jobs_per_technician,
  default_estimated_repair_hours,
  default_pickup_delivery_fee,
  send_intake_confirmation,
  send_ready_notification,
  send_status_updates,
  intake_confirmation_template,
  ready_notification_template,
  status_update_template
)
SELECT 
  id,
  20, -- max 20 concurrent jobs in workshop
  5,  -- max 5 jobs per technician
  24, -- default 24 hours (1 day) repair time
  0.00, -- no default pickup/delivery fee
  true, -- send intake confirmation
  true, -- send ready notification
  true, -- send status updates
  'Dear {{customer_name}}, we have received your {{equipment_type}} at our workshop. Your job number is {{job_number}}. We will notify you once the repair is complete.',
  'Dear {{customer_name}}, your {{equipment_type}} (Job #{{job_number}}) has been repaired and is ready for pickup at our workshop. Please contact us to arrange pickup.',
  'Dear {{customer_name}}, status update for your {{equipment_type}} (Job #{{job_number}}): {{status_message}}.'
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM workshop_settings WHERE workshop_settings.company_id = companies.id
);

-- Add comment
COMMENT ON TABLE workshop_settings IS 'Default workshop settings seeded for all companies';
