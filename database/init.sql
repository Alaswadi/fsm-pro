-- Field Service Management Platform Database Schema
-- PostgreSQL version (converted from Supabase)

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
    brand VARCHAR(100),
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

-- Insert default company
INSERT INTO companies (id, name, address, phone, email, is_active) VALUES
(uuid_generate_v4(), 'FSM Pro Demo Company', '123 Business St, City, State 12345', '+1-555-0123', 'info@fsmpro.com', true);

-- Insert default admin user (password: Admin@123)
-- Password hash for 'Admin@123' using bcrypt with salt rounds 10
INSERT INTO users (id, email, password_hash, full_name, role, is_active, email_verified) VALUES
(uuid_generate_v4(), 'admin@fsm.com', '$2b$10$MTNELq3ZPaXzwH2aJbV51uwhltRrmgbAxmDK7iKvI0ERXVP5rtD26', 'System Administrator', 'super_admin', true, true);

-- Insert sample technician users (password: Tech@123)
INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active, email_verified) VALUES
('11111111-1111-1111-1111-111111111111', 'michael.rodriguez@fsm.com', '$2b$10$MTNELq3ZPaXzwH2aJbV51uwhltRrmgbAxmDK7iKvI0ERXVP5rtD26', 'Michael Rodriguez', '+1-555-0101', 'technician', true, true),
('22222222-2222-2222-2222-222222222222', 'sarah.chen@fsm.com', '$2b$10$MTNELq3ZPaXzwH2aJbV51uwhltRrmgbAxmDK7iKvI0ERXVP5rtD26', 'Sarah Chen', '+1-555-0102', 'technician', true, true),
('33333333-3333-3333-3333-333333333333', 'david.thompson@fsm.com', '$2b$10$MTNELq3ZPaXzwH2aJbV51uwhltRrmgbAxmDK7iKvI0ERXVP5rtD26', 'David Thompson', '+1-555-0103', 'technician', true, true),
('44444444-4444-4444-4444-444444444444', 'lisa.martinez@fsm.com', '$2b$10$MTNELq3ZPaXzwH2aJbV51uwhltRrmgbAxmDK7iKvI0ERXVP5rtD26', 'Lisa Martinez', '+1-555-0104', 'technician', true, true),
('55555555-5555-5555-5555-555555555555', 'james.wilson@fsm.com', '$2b$10$MTNELq3ZPaXzwH2aJbV51uwhltRrmgbAxmDK7iKvI0ERXVP5rtD26', 'James Wilson', '+1-555-0105', 'technician', true, true);

-- Get the default company ID for technicians
DO $$
DECLARE
    default_company_id UUID;
    hvac_skill_id UUID;
    electrical_skill_id UUID;
    plumbing_skill_id UUID;
    solar_skill_id UUID;
    smart_home_skill_id UUID;
    refrigeration_skill_id UUID;
    epa_cert_id UUID;
    nate_cert_id UUID;
    nabcep_cert_id UUID;
    osha_cert_id UUID;
    master_plumber_cert_id UUID;
    journeyman_cert_id UUID;
BEGIN
    SELECT id INTO default_company_id FROM companies LIMIT 1;

    -- Insert default company skills
    INSERT INTO company_skills (id, company_id, name, description, category, sort_order) VALUES
    (uuid_generate_v4(), default_company_id, 'HVAC', 'Heating, Ventilation, and Air Conditioning systems', 'Climate Control', 1),
    (uuid_generate_v4(), default_company_id, 'Electrical', 'Electrical systems installation and repair', 'Electrical', 2),
    (uuid_generate_v4(), default_company_id, 'Plumbing', 'Water and drainage systems', 'Plumbing', 3),
    (uuid_generate_v4(), default_company_id, 'Solar', 'Solar panel installation and maintenance', 'Renewable Energy', 4),
    (uuid_generate_v4(), default_company_id, 'Smart Home', 'Home automation and smart device installation', 'Technology', 5),
    (uuid_generate_v4(), default_company_id, 'Refrigeration', 'Commercial and residential refrigeration systems', 'Climate Control', 6);

    -- Get skill IDs for linking
    SELECT id INTO hvac_skill_id FROM company_skills WHERE company_id = default_company_id AND name = 'HVAC';
    SELECT id INTO electrical_skill_id FROM company_skills WHERE company_id = default_company_id AND name = 'Electrical';
    SELECT id INTO plumbing_skill_id FROM company_skills WHERE company_id = default_company_id AND name = 'Plumbing';
    SELECT id INTO solar_skill_id FROM company_skills WHERE company_id = default_company_id AND name = 'Solar';
    SELECT id INTO smart_home_skill_id FROM company_skills WHERE company_id = default_company_id AND name = 'Smart Home';
    SELECT id INTO refrigeration_skill_id FROM company_skills WHERE company_id = default_company_id AND name = 'Refrigeration';

    -- Insert default company certifications
    INSERT INTO company_certifications (id, company_id, name, description, issuing_organization, validity_period_months, renewal_required, sort_order) VALUES
    (uuid_generate_v4(), default_company_id, 'EPA 608 Certification', 'Environmental Protection Agency Section 608 Certification for refrigerant handling', 'EPA', 36, true, 1),
    (uuid_generate_v4(), default_company_id, 'NATE Certified', 'North American Technician Excellence Certification', 'NATE', 24, true, 2),
    (uuid_generate_v4(), default_company_id, 'NABCEP PV Installation Professional', 'Solar photovoltaic installation certification', 'NABCEP', 36, true, 3),
    (uuid_generate_v4(), default_company_id, 'OSHA 10', 'Occupational Safety and Health Administration 10-hour training', 'OSHA', 36, true, 4),
    (uuid_generate_v4(), default_company_id, 'Master Plumber License', 'State-issued master plumber license', 'State Licensing Board', NULL, false, 5),
    (uuid_generate_v4(), default_company_id, 'Journeyman Electrician', 'State-issued journeyman electrician license', 'State Licensing Board', NULL, false, 6),
    (uuid_generate_v4(), default_company_id, 'Low Voltage Certification', 'Low voltage systems installation certification', 'Industry Association', 24, true, 7),
    (uuid_generate_v4(), default_company_id, 'Backflow Prevention', 'Backflow prevention device testing certification', 'Water Authority', 12, true, 8),
    (uuid_generate_v4(), default_company_id, 'RSES Certified', 'Refrigeration Service Engineers Society Certification', 'RSES', 24, true, 9);

    -- Get certification IDs for linking
    SELECT id INTO epa_cert_id FROM company_certifications WHERE company_id = default_company_id AND name = 'EPA 608 Certification';
    SELECT id INTO nate_cert_id FROM company_certifications WHERE company_id = default_company_id AND name = 'NATE Certified';
    SELECT id INTO nabcep_cert_id FROM company_certifications WHERE company_id = default_company_id AND name = 'NABCEP PV Installation Professional';
    SELECT id INTO osha_cert_id FROM company_certifications WHERE company_id = default_company_id AND name = 'OSHA 10';
    SELECT id INTO master_plumber_cert_id FROM company_certifications WHERE company_id = default_company_id AND name = 'Master Plumber License';
    SELECT id INTO journeyman_cert_id FROM company_certifications WHERE company_id = default_company_id AND name = 'Journeyman Electrician';

    -- Insert sample technicians (without skills and certifications arrays)
    INSERT INTO technicians (
        id, company_id, user_id, employee_id,
        hourly_rate, is_available, max_jobs_per_day, working_hours
    ) VALUES
    ('11111111-1111-1111-1111-111111111111', default_company_id, '11111111-1111-1111-1111-111111111111', 'T1247', 45.00, true, 8, '{"monday": {"start": "08:00", "end": "17:00"}, "tuesday": {"start": "08:00", "end": "17:00"}, "wednesday": {"start": "08:00", "end": "17:00"}, "thursday": {"start": "08:00", "end": "17:00"}, "friday": {"start": "08:00", "end": "17:00"}}'::jsonb),
    ('22222222-2222-2222-2222-222222222222', default_company_id, '22222222-2222-2222-2222-222222222222', 'T1238', 50.00, true, 6, '{"monday": {"start": "07:00", "end": "16:00"}, "tuesday": {"start": "07:00", "end": "16:00"}, "wednesday": {"start": "07:00", "end": "16:00"}, "thursday": {"start": "07:00", "end": "16:00"}, "friday": {"start": "07:00", "end": "16:00"}}'::jsonb),
    ('33333333-3333-3333-3333-333333333333', default_company_id, '33333333-3333-3333-3333-333333333333', 'T1242', 42.00, true, 8, '{"monday": {"start": "08:00", "end": "17:00"}, "tuesday": {"start": "08:00", "end": "17:00"}, "wednesday": {"start": "08:00", "end": "17:00"}, "thursday": {"start": "08:00", "end": "17:00"}, "friday": {"start": "08:00", "end": "17:00"}}'::jsonb),
    ('44444444-4444-4444-4444-444444444444', default_company_id, '44444444-4444-4444-4444-444444444444', 'T1251', 48.00, true, 7, '{"monday": {"start": "09:00", "end": "18:00"}, "tuesday": {"start": "09:00", "end": "18:00"}, "wednesday": {"start": "09:00", "end": "18:00"}, "thursday": {"start": "09:00", "end": "18:00"}, "friday": {"start": "09:00", "end": "18:00"}}'::jsonb),
    ('55555555-5555-5555-5555-555555555555', default_company_id, '55555555-5555-5555-5555-555555555555', 'T1256', 46.00, false, 8, '{"monday": {"start": "08:00", "end": "17:00"}, "tuesday": {"start": "08:00", "end": "17:00"}, "wednesday": {"start": "08:00", "end": "17:00"}, "thursday": {"start": "08:00", "end": "17:00"}, "friday": {"start": "08:00", "end": "17:00"}}'::jsonb);

    -- Link technicians to skills
    INSERT INTO technician_skills (technician_id, skill_id, proficiency_level, years_experience) VALUES
    ('11111111-1111-1111-1111-111111111111', hvac_skill_id, 4, 5),
    ('11111111-1111-1111-1111-111111111111', electrical_skill_id, 3, 3),
    ('22222222-2222-2222-2222-222222222222', solar_skill_id, 5, 7),
    ('22222222-2222-2222-2222-222222222222', electrical_skill_id, 4, 6),
    ('33333333-3333-3333-3333-333333333333', plumbing_skill_id, 5, 8),
    ('33333333-3333-3333-3333-333333333333', hvac_skill_id, 3, 4),
    ('44444444-4444-4444-4444-444444444444', electrical_skill_id, 4, 6),
    ('44444444-4444-4444-4444-444444444444', smart_home_skill_id, 4, 3),
    ('55555555-5555-5555-5555-555555555555', hvac_skill_id, 5, 10),
    ('55555555-5555-5555-5555-555555555555', refrigeration_skill_id, 4, 8);

    -- Link technicians to certifications
    INSERT INTO technician_certifications (technician_id, certification_id, certification_number, issued_date, expiration_date, is_verified) VALUES
    ('11111111-1111-1111-1111-111111111111', epa_cert_id, 'EPA-608-12345', '2022-01-15', '2025-01-15', true),
    ('11111111-1111-1111-1111-111111111111', nate_cert_id, 'NATE-67890', '2022-06-01', '2024-06-01', true),
    ('22222222-2222-2222-2222-222222222222', nabcep_cert_id, 'NABCEP-PV-54321', '2021-03-10', '2024-03-10', true),
    ('22222222-2222-2222-2222-222222222222', osha_cert_id, 'OSHA-10-98765', '2023-01-20', '2026-01-20', true),
    ('33333333-3333-3333-3333-333333333333', master_plumber_cert_id, 'MP-2019-001', '2019-05-15', NULL, true),
    ('44444444-4444-4444-4444-444444444444', journeyman_cert_id, 'JE-2020-045', '2020-08-01', NULL, true);

    -- Insert sample equipment types
    INSERT INTO equipment_types (company_id, name, brand, model, category, description, warranty_period_months, specifications) VALUES
    (default_company_id, 'Printer', 'HP', 'LaserJet Pro M404n', 'Office Equipment', 'Monochrome laser printer for office use', 12, '{"print_speed": "38 ppm", "resolution": "1200x1200 dpi", "connectivity": "USB, Ethernet"}'),
    (default_company_id, 'Printer', 'Canon', 'PIXMA TR4520', 'Office Equipment', 'All-in-one inkjet printer with wireless capability', 12, '{"print_speed": "8.8 ppm", "resolution": "4800x1200 dpi", "connectivity": "WiFi, USB", "functions": "Print, Scan, Copy, Fax"}'),
    (default_company_id, 'Scanner', 'Epson', 'WorkForce ES-400', 'Office Equipment', 'High-speed document scanner', 12, '{"scan_speed": "35 ppm", "resolution": "600 dpi", "connectivity": "USB 3.0"}'),
    (default_company_id, 'Copier', 'Xerox', 'WorkCentre 6515', 'Office Equipment', 'Color multifunction printer', 24, '{"print_speed": "30 ppm", "resolution": "1200x2400 dpi", "connectivity": "WiFi, Ethernet, USB"}'),
    (default_company_id, 'Computer', 'Dell', 'OptiPlex 7090', 'IT Hardware', 'Business desktop computer', 36, '{"processor": "Intel i7", "ram": "16GB", "storage": "512GB SSD", "os": "Windows 11 Pro"}'),
    (default_company_id, 'Monitor', 'LG', '27UK850-W', 'IT Hardware', '27-inch 4K USB-C monitor', 24, '{"size": "27 inch", "resolution": "3840x2160", "connectivity": "USB-C, HDMI, DisplayPort"}'),
    (default_company_id, 'Router', 'Cisco', 'RV340W', 'Network Equipment', 'Dual WAN wireless router', 12, '{"wifi_standard": "802.11ac", "ports": "4x Gigabit LAN", "vpn_support": "Yes"}'),
    (default_company_id, 'Switch', 'Netgear', 'GS108', 'Network Equipment', '8-port Gigabit Ethernet switch', 12, '{"ports": "8x Gigabit", "power": "External adapter", "mounting": "Desktop/Wall"}');

END $$;
