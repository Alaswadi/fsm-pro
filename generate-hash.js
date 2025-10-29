const bcrypt = require('bcrypt');

const password = 'Admin@123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log('Password:', password);
  console.log('Hash:', hash);
});

