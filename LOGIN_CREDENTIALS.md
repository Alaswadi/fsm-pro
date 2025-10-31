# FSM Pro - Login Credentials

## 🔐 Admin Access

**Email:** admin@fsm.com  
**Password:** Admin@123  
**Role:** Super Admin

## 👨‍🔧 Technician Accounts

All technician accounts use the same password for demo purposes:

**Password:** Tech@123

### Technician Users:

1. **Michael Rodriguez**
   - Email: michael.rodriguez@fsm.com
   - Employee ID: T1247
   - Skills: HVAC (Level 4), Electrical (Level 3)

2. **Sarah Chen**
   - Email: sarah.chen@fsm.com
   - Employee ID: T1238
   - Skills: Solar (Level 5), Electrical (Level 4)

3. **David Thompson**
   - Email: david.thompson@fsm.com
   - Employee ID: T1242
   - Skills: Plumbing (Level 5), HVAC (Level 3)

4. **Lisa Martinez**
   - Email: lisa.martinez@fsm.com
   - Employee ID: T1251
   - Skills: Electrical (Level 4), Smart Home (Level 4)

5. **James Wilson**
   - Email: james.wilson@fsm.com
   - Employee ID: T1256
   - Skills: HVAC (Level 5), Refrigeration (Level 4)

## 🌐 Application URLs

- **Admin Dashboard:** http://localhost:3000
- **API Endpoint:** http://localhost:3001
- **API Health Check:** http://localhost:3001/api/health
- **Main Site (via Nginx):** http://localhost

## 📝 Notes

- All passwords have been updated to use stronger security
- Passwords are hashed using bcrypt with 10 salt rounds
- All users have verified email addresses
- All technician accounts are active and ready to use

## 🔄 Reset Instructions

If you need to reset the database and credentials:

```bash
# Stop all containers and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d

# Wait 15 seconds for database initialization
# Then verify admin user
docker exec fsm-postgres psql -U fsm_user -d fsm_db -c "SELECT email, full_name, role FROM users WHERE email = 'admin@fsm.com';"
```

## 🛡️ Security Recommendations

For production use:
1. Change all default passwords
2. Use environment variables for sensitive data
3. Enable HTTPS/SSL
4. Implement rate limiting
5. Add two-factor authentication
6. Regular security audits

