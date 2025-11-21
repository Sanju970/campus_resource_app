const bcrypt = require('bcrypt');

async function hashPassword(plainPassword) {
  const saltRounds = 10; // recommended
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
  return hashedPassword;
}

// Example usage:
(async () => {
  const plain = "Test@123";
  const hashed = await hashPassword(plain);
  console.log("Hashed password:", hashed);
})();
