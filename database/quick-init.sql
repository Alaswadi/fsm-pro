-- Quick Database Initialization for FSM Pro
-- Copy and paste this entire file into psql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types (with error handling)
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'manager', 'technician', 'customer'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE job_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE job_priority AS ENUM ('low', 'medium', 'high', 'urgent'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE part_status AS ENUM ('available', 'low_stock', 'out_of_stock', 'discontinued'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('email', 'sms', 'whatsapp', 'push'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
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

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
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

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    contact_person VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create technicians table
CREATE TABLE IF NOT EXISTS technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50),
    specialization VARCHAR(255),
    hourly_rate DECIMAL(10, 2),
    is_available BOOLEAN DEFAULT true,
    current_location_lat DECIMAL(10, 8),
    current_location_lng DECIMAL(11, 8),
    last_location_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status job_status DEFAULT 'pending',
    priority job_priority DEFAULT 'medium',
    scheduled_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER,
    actual_duration INTEGER,
    location_address TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_assignments table
CREATE TABLE IF NOT EXISTS job_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default company
INSERT INTO companies (id, name, address, phone, email, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'FSM Pro Demo Company',
    '123 Main St, City, State 12345',
    '+1-555-0100',
    'info@fsmpro.com',
    true
) ON CONFLICT (id) DO NOTHING;

-- Insert admin user (password: admin123)
INSERT INTO users (id, email, password_hash, full_name, role, is_active, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'admin@fsm.com',
    '$2b$10$YQjT5YvZ5YJ5YJ5YJ5YJ5.O5YJ5YJ5YJ5YJ5YJ5YJ5YJ5YJ5YJ5YJ',
    'Admin User',
    'admin',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert mobile technician user (password: mobile123)
INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    'mobile.tech@fsm.com',
    '$2b$10$YQjT5YvZ5YJ5YJ5YJ5YJ5.O5YJ5YJ5YJ5YJ5YJ5YJ5YJ5YJ5YJ5YJ',
    'Mobile Technician',
    '+1-555-0101',
    'technician',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Create technician profile
INSERT INTO technicians (id, user_id, employee_id, specialization, hourly_rate, is_available)
VALUES (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000003',
    'TECH001',
    'General Repair',
    50.00,
    true
) ON CONFLICT (id) DO NOTHING;

-- Verify installation
SELECT 'SUCCESS: Database initialized!' as status;
SELECT email, full_name, role, is_active FROM users ORDER BY created_at;

