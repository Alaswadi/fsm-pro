-- FSM Pro Database Verification and Fix Script
-- Run this to check if all tables exist and create missing ones

-- Check if technicians table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'technicians') THEN
        RAISE NOTICE 'Creating technicians table...';
        
        CREATE TABLE technicians (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            employee_id VARCHAR(50) UNIQUE NOT NULL,
            hourly_rate DECIMAL(10,2),
            is_available BOOLEAN DEFAULT true,
            current_location POINT,
            max_jobs_per_day INTEGER DEFAULT 8,
            working_hours JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_technicians_company_id ON technicians(company_id);
        CREATE INDEX idx_technicians_user_id ON technicians(user_id);
        
        CREATE TRIGGER update_technicians_updated_at 
            BEFORE UPDATE ON technicians 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Technicians table created successfully';
    ELSE
        RAISE NOTICE 'Technicians table already exists';
    END IF;
END $$;

-- Check if company_skills table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'company_skills') THEN
        RAISE NOTICE 'Creating company_skills table...';
        
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
        
        CREATE INDEX idx_company_skills_company_id ON company_skills(company_id);
        
        CREATE TRIGGER update_company_skills_updated_at 
            BEFORE UPDATE ON company_skills 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Company_skills table created successfully';
    ELSE
        RAISE NOTICE 'Company_skills table already exists';
    END IF;
END $$;

-- Check if company_certifications table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'company_certifications') THEN
        RAISE NOTICE 'Creating company_certifications table...';
        
        CREATE TABLE company_certifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            issuing_organization VARCHAR(255),
            validity_period_months INTEGER,
            renewal_required BOOLEAN DEFAULT false,
            renewal_notice_days INTEGER DEFAULT 30,
            is_active BOOLEAN DEFAULT true,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(company_id, name)
        );
        
        CREATE INDEX idx_company_certifications_company_id ON company_certifications(company_id);
        
        CREATE TRIGGER update_company_certifications_updated_at 
            BEFORE UPDATE ON company_certifications 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Company_certifications table created successfully';
    ELSE
        RAISE NOTICE 'Company_certifications table already exists';
    END IF;
END $$;

-- Verify all critical tables exist
DO $$
DECLARE
    missing_tables TEXT := '';
    table_name TEXT;
    required_tables TEXT[] := ARRAY[
        'users', 'companies', 'technicians', 'company_skills', 'company_certifications',
        'customers', 'equipment_types', 'customer_equipment', 'parts', 'jobs',
        'job_parts', 'job_photos', 'notifications', 'audit_logs', 'mail_settings'
    ];
BEGIN
    RAISE NOTICE '=== Verifying Database Tables ===';
    
    FOREACH table_name IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = table_name) THEN
            missing_tables := missing_tables || table_name || ', ';
            RAISE WARNING 'Missing table: %', table_name;
        ELSE
            RAISE NOTICE '✓ Table exists: %', table_name;
        END IF;
    END LOOP;
    
    IF missing_tables != '' THEN
        RAISE WARNING 'Missing tables: %', TRIM(TRAILING ', ' FROM missing_tables);
        RAISE NOTICE 'Please run the full init.sql script to create all tables';
    ELSE
        RAISE NOTICE '=== All critical tables exist ===';
    END IF;
END $$;

-- Show current database state
SELECT 
    'Users' as table_name, 
    COUNT(*) as count 
FROM users
UNION ALL
SELECT 
    'Companies' as table_name, 
    COUNT(*) as count 
FROM companies
UNION ALL
SELECT 
    'Technicians' as table_name, 
    COUNT(*) as count 
FROM technicians
ORDER BY table_name;

