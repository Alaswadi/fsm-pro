-- FSM Pro Database Schema
-- Auto-initialized on first PostgreSQL startup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'manager', 'technician', 'customer');
CREATE TYPE job_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold');
CREATE TYPE job_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE part_status AS ENUM ('available', 'low_stock', 'out_of_stock', 'discontinued');
CREATE TYPE notification_type AS ENUM ('email', 'sms', 'whatsapp', 'push');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- Users table (standalone, not extending Supabase auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'customer',
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table (for multi-tenant support)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    business_type VARCHAR(100),
    tax_id VARCHAR(50),
    license_number VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    time_format VARCHAR(10) DEFAULT '12h',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company Skills table (customizable skills per company)
CREATE TABLE company_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Company Certifications table (customizable certifications per company)
CREATE TABLE company_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    issuing_organization VARCHAR(255),
    validity_period_months INTEGER, -- NULL means no expiration
    renewal_required BOOLEAN DEFAULT false,
    renewal_notice_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    whatsapp_number VARCHAR(20),
    address TEXT NOT NULL,
    location_coordinates POINT,
    company_name VARCHAR(255),
    industry VARCHAR(100), -- e.g., Healthcare, Education, Manufacturing
    company_size VARCHAR(50), -- e.g., Small (1-50), Medium (51-200), Large (201+)
    business_type VARCHAR(100), -- e.g., Corporation, LLC, Partnership, Non-profit
    tax_id VARCHAR(50), -- Business tax identification number
    website VARCHAR(255),
    billing_address TEXT,
    billing_contact_name VARCHAR(255),
    billing_contact_email VARCHAR(255),
    billing_contact_phone VARCHAR(20),
    preferred_contact_method VARCHAR(50) DEFAULT 'phone', -- phone, email, whatsapp
    service_tier VARCHAR(50) DEFAULT 'standard', -- basic, standard, premium
    contract_type VARCHAR(50), -- one-time, monthly, annual, custom
    contract_start_date DATE,
    contract_end_date DATE,
    payment_terms VARCHAR(100), -- Net 30, Net 15, COD, etc.
    credit_limit DECIMAL(10,2),
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    priority_level VARCHAR(20) DEFAULT 'normal', -- low, normal, high, critical
    assigned_account_manager UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Technicians table
CREATE TABLE technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    hourly_rate DECIMAL(10,2),
    is_available BOOLEAN DEFAULT true,
    current_location POINT,
    max_jobs_per_day INTEGER DEFAULT 8,
    working_hours JSONB, -- Store working schedule
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Technician Skills (linking technicians to company skills)
CREATE TABLE technician_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES company_skills(id) ON DELETE CASCADE,
    proficiency_level INTEGER DEFAULT 1 CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
    years_experience INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(technician_id, skill_id)
);

-- Technician Certifications (linking technicians to company certifications)
CREATE TABLE technician_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
    certification_id UUID REFERENCES company_certifications(id) ON DELETE CASCADE,
    certification_number VARCHAR(255),
    issued_date DATE,
    expiration_date DATE,
    issuing_organization VARCHAR(255),
    document_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(technician_id, certification_id)
);

-- Equipment types table
CREATE TABLE equipment_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- e.g., "Printer", "Scanner", "Copier"
    brand VARCHAR(255) NOT NULL, -- e.g., "HP", "Canon", "Epson"
    model VARCHAR(255) NOT NULL, -- e.g., "LaserJet Pro 123", "PIXMA TR4520"
    category VARCHAR(100), -- e.g., "Office Equipment", "IT Hardware"
    description TEXT,
    manual_url TEXT,
    warranty_period_months INTEGER DEFAULT 12,
    image_url TEXT,
    specifications JSONB, -- Store technical specifications
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, brand, model)
);

-- Customer equipment table
CREATE TABLE customer_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    equipment_type_id UUID REFERENCES equipment_types(id) ON DELETE RESTRICT,
    serial_number VARCHAR(255) NOT NULL,
    asset_tag VARCHAR(100), -- Internal asset tracking number
    purchase_date DATE,
    warranty_expiry DATE,
    installation_date DATE,
    location_details TEXT, -- Specific location at customer site
    condition VARCHAR(50) DEFAULT 'good', -- good, fair, poor, needs_repair
    last_service_date DATE,
    next_service_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, serial_number)
);

-- Parts/Inventory table
CREATE TABLE parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    part_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    equipment_type_id UUID REFERENCES equipment_types(id) ON DELETE SET NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    current_stock INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 100,
    status part_status DEFAULT 'available',
    supplier_info JSONB,
    compatible_equipment UUID[], -- Array of equipment_type IDs
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment-Inventory compatibility table (many-to-many relationship)
CREATE TABLE equipment_inventory_compatibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_type_id UUID REFERENCES equipment_types(id) ON DELETE CASCADE,
    part_id UUID REFERENCES parts(id) ON DELETE CASCADE,
    compatibility_type VARCHAR(50) DEFAULT 'compatible', -- compatible, recommended, alternative
    usage_notes TEXT, -- Notes about how this part is used with this equipment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(equipment_type_id, part_id)
);

-- Jobs/Work Orders table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES customer_equipment(id) ON DELETE SET NULL,
    technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
    job_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority job_priority DEFAULT 'medium',
    status job_status DEFAULT 'pending',
    scheduled_date TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER, -- in minutes
    customer_signature TEXT, -- Base64 encoded signature
    technician_notes TEXT,
    customer_feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    total_cost DECIMAL(10,2),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job parts (parts used in jobs)
CREATE TABLE job_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    part_id UUID REFERENCES parts(id) ON DELETE RESTRICT,
    quantity_used INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity_used * unit_price) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job photos table
CREATE TABLE job_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status notification_status DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB, -- Store additional data like WhatsApp message ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mail settings table
CREATE TABLE mail_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    smtp_host VARCHAR(255),
    smtp_port INTEGER DEFAULT 587,
    smtp_secure BOOLEAN DEFAULT false,
    smtp_user VARCHAR(255),
    smtp_password VARCHAR(255),
    from_name VARCHAR(255) DEFAULT 'FSM Pro',
    from_email VARCHAR(255),
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_technicians_company_id ON technicians(company_id);
CREATE INDEX idx_technicians_user_id ON technicians(user_id);
CREATE INDEX idx_company_skills_company_id ON company_skills(company_id);
CREATE INDEX idx_company_certifications_company_id ON company_certifications(company_id);
CREATE INDEX idx_technician_skills_technician_id ON technician_skills(technician_id);
CREATE INDEX idx_technician_skills_skill_id ON technician_skills(skill_id);
CREATE INDEX idx_technician_certifications_technician_id ON technician_certifications(technician_id);
CREATE INDEX idx_technician_certifications_certification_id ON technician_certifications(certification_id);
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_technician_id ON jobs(technician_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_parts_company_id ON parts(company_id);
CREATE INDEX idx_parts_part_number ON parts(part_number);
CREATE INDEX idx_parts_status ON parts(status);
CREATE INDEX idx_equipment_types_company_id ON equipment_types(company_id);
CREATE INDEX idx_equipment_types_brand ON equipment_types(brand);
CREATE INDEX idx_equipment_types_category ON equipment_types(category);
CREATE INDEX idx_customer_equipment_company_id ON customer_equipment(company_id);
CREATE INDEX idx_customer_equipment_customer_id ON customer_equipment(customer_id);
CREATE INDEX idx_customer_equipment_equipment_type_id ON customer_equipment(equipment_type_id);
CREATE INDEX idx_customer_equipment_serial_number ON customer_equipment(serial_number);
CREATE INDEX idx_equipment_inventory_compatibility_equipment_type_id ON equipment_inventory_compatibility(equipment_type_id);
CREATE INDEX idx_equipment_inventory_compatibility_part_id ON equipment_inventory_compatibility(part_id);
CREATE INDEX idx_job_parts_job_id ON job_parts(job_id);
CREATE INDEX idx_job_photos_job_id ON job_photos(job_id);
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_skills_updated_at BEFORE UPDATE ON company_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_certifications_updated_at BEFORE UPDATE ON company_certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_technician_certifications_updated_at BEFORE UPDATE ON technician_certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_types_updated_at BEFORE UPDATE ON equipment_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_equipment_updated_at BEFORE UPDATE ON customer_equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_inventory_compatibility_updated_at BEFORE UPDATE ON equipment_inventory_compatibility FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mail_settings_updated_at BEFORE UPDATE ON mail_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Schema initialization complete
-- No seed data - use the setup wizard to create first admin user and company

-- Migration: Add due_date column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS due_date DATE;
CREATE INDEX IF NOT EXISTS idx_jobs_due_date ON jobs(due_date);
COMMENT ON COLUMN jobs.due_date IS 'Target completion date for the work order';

-- ============================================================================
-- WORKSHOP/DEPOT REPAIR TABLES
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

-- Create indexes for workshop tables
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

-- Add updated_at triggers for workshop tables
CREATE TRIGGER update_equipment_intake_updated_at
  BEFORE UPDATE ON equipment_intake
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_status_updated_at
  BEFORE UPDATE ON equipment_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workshop_settings_updated_at
  BEFORE UPDATE ON workshop_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments to document the workshop tables
COMMENT ON TABLE equipment_intake IS 'Records equipment condition and details when received at workshop';
COMMENT ON TABLE equipment_status IS 'Tracks current status of equipment in workshop repair process';
COMMENT ON TABLE equipment_status_history IS 'Audit trail of all equipment status changes';
COMMENT ON TABLE intake_photos IS 'Photos taken during equipment intake process';
COMMENT ON TABLE workshop_settings IS 'Company-specific workshop configuration and settings';

-- ============================================================================
-- INVENTORY ORDER TRACKING TABLES
-- ============================================================================

-- Create work_order_inventory_orders table
CREATE TABLE work_order_inventory_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL,
    part_id UUID NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    ordered_by UUID NOT NULL,
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

-- Create inventory_order_status_log table
CREATE TABLE inventory_order_status_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES work_order_inventory_orders(id) ON DELETE CASCADE,
    old_status VARCHAR(20) NOT NULL,
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for inventory order tables
CREATE INDEX idx_work_order_inventory_orders_work_order_id ON work_order_inventory_orders(work_order_id);
CREATE INDEX idx_work_order_inventory_orders_part_id ON work_order_inventory_orders(part_id);
CREATE INDEX idx_work_order_inventory_orders_ordered_by ON work_order_inventory_orders(ordered_by);
CREATE INDEX idx_work_order_inventory_orders_status ON work_order_inventory_orders(status);
CREATE INDEX idx_work_order_inventory_orders_ordered_at ON work_order_inventory_orders(ordered_at);

CREATE INDEX idx_inventory_order_status_log_order_id ON inventory_order_status_log(order_id);
CREATE INDEX idx_inventory_order_status_log_changed_by ON inventory_order_status_log(changed_by);
CREATE INDEX idx_inventory_order_status_log_created_at ON inventory_order_status_log(created_at DESC);

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

-- Add comments to inventory order tables
COMMENT ON TABLE work_order_inventory_orders IS 'Tracks all inventory items ordered for specific work orders';
COMMENT ON TABLE inventory_order_status_log IS 'Audit log for all inventory order status changes';
COMMENT ON COLUMN inventory_order_status_log.order_id IS 'Reference to the inventory order';
COMMENT ON COLUMN inventory_order_status_log.old_status IS 'Previous status before change';
COMMENT ON COLUMN inventory_order_status_log.new_status IS 'New status after change';
COMMENT ON COLUMN inventory_order_status_log.changed_by IS 'User who made the status change';
COMMENT ON COLUMN inventory_order_status_log.notes IS 'Optional notes about the status change';
