const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Database connection (using postgres hostname for Docker network)
const pool = new Pool({
  host: 'postgres',
  port: 5432,
  database: 'fsm_db',
  user: 'fsm_user',
  password: 'fsm_password'
});

async function resetAdminPassword() {
  const newPassword = 'Admin@123';
  const saltRounds = 10;

  try {
    // Generate new password hash
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('Generated password hash:', passwordHash);
    console.log('New password:', newPassword);

    // Update admin user
    const result = await pool.query(
      `UPDATE users 
       SET password_hash = $1, 
           updated_at = NOW() 
       WHERE email = 'admin@fsm.com'
       RETURNING id, email, full_name, role`,
      [passwordHash]
    );

    if (result.rows.length > 0) {
      console.log('\n✅ Admin password reset successfully!');
      console.log('User details:', result.rows[0]);
      console.log('\n📧 Email: admin@fsm.com');
      console.log('🔑 Password:', newPassword);
    } else {
      console.log('❌ Admin user not found');
    }

    await pool.end();
  } catch (error) {
    console.error('Error resetting password:', error);
    await pool.end();
    process.exit(1);
  }
}

resetAdminPassword();

