// Run this from the api directory: cd api && node ../generate-hashes.js
const bcrypt = require('bcryptjs');

async function generateHashes() {
    console.log('Generating password hashes for init.sql...\n');
    
    const admin123 = await bcrypt.hash('admin123', 10);
    const mobile123 = await bcrypt.hash('mobile123', 10);
    
    console.log('admin123 hash:');
    console.log(admin123);
    console.log('');
    console.log('mobile123 hash:');
    console.log(mobile123);
    console.log('');
    console.log('Copy these into database/init.sql');
}

generateHashes().catch(console.error);

