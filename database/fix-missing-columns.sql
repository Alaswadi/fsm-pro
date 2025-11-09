-- Fix Missing Columns in Database Schema
-- Run this script to add missing columns to existing tables

-- 1. Add company_id to technicians table
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- 2. Add missing columns to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS location_coordinates POINT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_size VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS billing_contact_name VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS billing_contact_email VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS billing_contact_phone VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(50) DEFAULT 'phone';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS service_tier VARCHAR(50) DEFAULT 'standard';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contract_type VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contract_end_date DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'normal';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS assigned_account_manager UUID REFERENCES users(id) ON DELETE SET NULL;

-- 3. Add missing columns to parts table
ALTER TABLE parts ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE parts ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE parts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255);
ALTER TABLE parts ADD COLUMN IF NOT EXISTS model_number VARCHAR(100);
ALTER TABLE parts ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(50) DEFAULT 'each';
ALTER TABLE parts ADD COLUMN IF NOT EXISTS quantity_in_stock INTEGER DEFAULT 0;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 0;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS reorder_quantity INTEGER DEFAULT 0;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2);
ALTER TABLE parts ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2);
ALTER TABLE parts ADD COLUMN IF NOT EXISTS supplier_id UUID;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE parts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4. Add missing columns to users table (if needed)
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_technicians_company_id ON technicians(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_parts_company_id ON parts(company_id);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- 6. Update existing technicians to have company_id from their user
UPDATE technicians t
SET company_id = u.company_id
FROM users u
WHERE t.user_id = u.id
AND t.company_id IS NULL
AND u.company_id IS NOT NULL;

-- 7. Update existing customers to have company_id (set to first company if exists)
UPDATE customers
SET company_id = (SELECT id FROM companies LIMIT 1)
WHERE company_id IS NULL;

-- 8. Update existing parts to have company_id (set to first company if exists)
UPDATE parts
SET company_id = (SELECT id FROM companies LIMIT 1)
WHERE company_id IS NULL;

-- Done!
SELECT 'Migration completed successfully!' AS status;

