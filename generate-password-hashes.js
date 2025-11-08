// Generate password hashes for default users
const bcrypt = require('bcrypt');

async function generateHashes() {
    console.log('Generating password hashes...\n');
    
    // Admin password: admin123
    const adminHash = await bcrypt.hash('admin123', 10);
    console.log('Admin (admin123):');
    console.log(adminHash);
    console.log('');
    
    // Mobile tech password: mobile123
    const mobileHash = await bcrypt.hash('mobile123', 10);
    console.log('Mobile Tech (mobile123):');
    console.log(mobileHash);
    console.log('');
    
    console.log('Copy these hashes into the SQL INSERT statements.');
}

generateHashes().catch(console.error);

