# 🗄️ Manual Database Initialization

## Problem
The `init.sql` file has issues when run with `\i` command. The UUID extension isn't being created properly.

## Solution
Run these SQL commands **one by one** or **copy the entire block** into psql.

---

## 📋 Step-by-Step Instructions

### Step 1: Connect to Database
```bash
# On your production server
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db
```

### Step 2: Copy and Paste This Entire SQL Block

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'manager', 'technician', 'customer'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE job_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE job_priority AS ENUM ('low', 'medium', 'high', 'urgent'); EXCEPTION WHEN duplicate_object THEN null; END $$;

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
-- Hash generated with: bcrypt.hash('admin123', 10)
INSERT INTO users (id, email, password_hash, full_name, role, is_active, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'admin@fsm.com',
    '$2a$10$rKZvVqZ5YJ5YJ5YJ5YJ5YeO5YJ5YJ5YJ5YJ5YJ5YJ5YJ5YJ5YJ5YJ',
    'Admin User',
    'admin',
    true,
    true
) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Insert mobile technician user (password: mobile123)
-- Hash generated with: bcrypt.hash('mobile123', 10)
INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    'mobile.tech@fsm.com',
    '$2a$10$rKZvVqZ5YJ5YJ5YJ5YJ5YeO5YJ5YJ5YJ5YJ5YJ5YJ5YJ5YJ5YJ5YJ',
    'Mobile Technician',
    '+1-555-0101',
    'technician',
    true,
    true
) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

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

-- Verify
SELECT 'Database initialized successfully!' as status;
SELECT email, full_name, role, is_active FROM users;
```

### Step 3: Exit psql
```sql
\q
```

### Step 4: Restart API
```bash
docker-compose -f docker-compose.coolify.yml restart api
```

### Step 5: Test Login
```bash
curl -X POST https://fsmpro.phishsimulator.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fsm.com","password":"admin123"}'
```

---

## ⚠️ Important Notes

1. **Password Hashes**: The password hashes in the SQL above are **placeholders**. They won't work for login.

2. **You need to generate real hashes**. Here's how:

### Option A: Use the API's Register Endpoint

Instead of inserting users manually, use the API to create them:

```bash
# Create admin user
curl -X POST https://fsmpro.phishsimulator.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fsm.com",
    "password": "admin123",
    "full_name": "Admin User",
    "role": "admin"
  }'

# Create mobile tech user
curl -X POST https://fsmpro.phishsimulator.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mobile.tech@fsm.com",
    "password": "mobile123",
    "full_name": "Mobile Technician",
    "phone": "+1-555-0101",
    "role": "technician"
  }'
```

### Option B: Generate Hashes Locally

1. **On your local machine** (where you have the code):
   ```bash
   cd api
   npm install
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(h => console.log('admin123:', h)); bcrypt.hash('mobile123', 10).then(h => console.log('mobile123:', h));"
   ```

2. **Copy the generated hashes** and replace them in the SQL INSERT statements above.

---

## ✅ Verification

After running the SQL:

1. **Check tables exist**:
   ```sql
   \dt
   ```
   Should show: users, companies, customers, technicians, jobs

2. **Check users exist**:
   ```sql
   SELECT email, full_name, role FROM users;
   ```
   Should show: admin@fsm.com and mobile.tech@fsm.com

3. **Test login** (after generating proper hashes):
   ```bash
   curl -X POST https://fsmpro.phishsimulator.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@fsm.com","password":"admin123"}'
   ```

---

## 🎯 Recommended Approach

**Use the API's register endpoint** (Option A above) instead of manually inserting users. This ensures:
- ✅ Correct password hashing
- ✅ Proper validation
- ✅ All required fields set correctly

---

## 📞 If You Still Get Errors

If you get "relation does not exist" errors:

1. **Make sure UUID extension is enabled**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';
   ```

2. **Check if tables were created**:
   ```sql
   \dt
   ```

3. **If no tables**, run the CREATE TABLE statements one by one.

4. **Check API logs** for specific errors:
   ```bash
   docker logs fsm-api-coolify --tail 50
   ```

---

**The key issue is the password hashes. Use the API's register endpoint to create users with proper password hashing!**

