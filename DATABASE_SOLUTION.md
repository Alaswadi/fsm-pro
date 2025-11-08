# 🗄️ Database Initialization Solution

## 🔍 Problem Identified

You got this error when running `init.sql`:
```
ERROR: function uuid_generate_v4() does not exist
ERROR: relation "users" does not exist
```

**Root Cause**: The UUID extension wasn't created properly, so all table creations failed.

---

## ✅ Simple Solution (Recommended)

Instead of manually running SQL scripts, **use the API's register endpoint** to create users. This is the easiest and most reliable method.

### Step 1: Create Basic Tables First

Run this minimal SQL to create just the essential tables:

```bash
# Connect to database
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db
```

Then paste this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify it worked
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';

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

-- Verify tables were created
\dt

-- Exit
\q
```

### Step 2: Restart API

```bash
docker-compose -f docker-compose.coolify.yml restart api
```

Wait about 10 seconds for the API to start.

### Step 3: Create Users via API

**Option A: Use the Script (Easiest)**

```bash
# Linux/Mac
chmod +x create-default-users.sh
./create-default-users.sh

# Windows
create-default-users.bat
```

**Option B: Manual curl Commands**

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

# Create mobile technician user
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

### Step 4: Test Login

```bash
# Test admin login
curl -X POST https://fsmpro.phishsimulator.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fsm.com","password":"admin123"}'
```

You should get a response with a token and user data!

---

## 🎯 Why This Works

1. **UUID Extension**: Created properly with `CREATE EXTENSION IF NOT EXISTS`
2. **Enum Types**: Created with error handling (`DO $$ BEGIN ... EXCEPTION`)
3. **Tables**: Created with `IF NOT EXISTS` to avoid errors
4. **Users**: Created via API which:
   - ✅ Properly hashes passwords with bcrypt
   - ✅ Validates all fields
   - ✅ Sets correct defaults
   - ✅ No manual password hash generation needed

---

## ✅ Verification

After completing the steps:

1. **Check tables exist**:
   ```bash
   docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "\dt"
   ```

2. **Check users exist**:
   ```bash
   docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT email, full_name, role FROM users;"
   ```

3. **Test admin app**:
   - Go to: https://fsmpro.phishsimulator.com/
   - Login with: admin@fsm.com / admin123
   - Should work!

4. **Test mobile app**:
   - Open Expo Go
   - Login with: mobile.tech@fsm.com / mobile123
   - Should work!

---

## 🔧 If You Still Get Errors

### Error: "relation 'users' does not exist"
**Solution**: Tables weren't created. Run Step 1 again.

### Error: "function uuid_generate_v4() does not exist"
**Solution**: UUID extension not enabled. Run this:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error: "User already exists"
**Solution**: User was already created. Try logging in instead.

### Error: "Cannot connect to database"
**Solution**: PostgreSQL container not running:
```bash
docker-compose -f docker-compose.coolify.yml up -d postgres
sleep 10
```

---

## 📊 What Gets Created

### Tables:
- ✅ users
- ✅ companies
- ✅ customers
- ✅ technicians
- ✅ jobs

### Users:
- ✅ admin@fsm.com (password: admin123)
- ✅ mobile.tech@fsm.com (password: mobile123)

---

## 🎉 Success!

After following these steps:

✅ Database has all essential tables  
✅ UUID extension is enabled  
✅ Admin user created with proper password hash  
✅ Mobile tech user created with proper password hash  
✅ Can login to admin app  
✅ Can login to mobile app  

---

## 📝 Next Steps

1. **Login to admin app** and change default passwords
2. **Test mobile app** with Expo Go
3. **Create more users** as needed
4. **Add customers, jobs, etc.** through the admin interface

---

**This approach is much simpler than manually generating password hashes and running complex SQL scripts!**

