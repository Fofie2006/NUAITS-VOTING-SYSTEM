require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getPool } = require('./config/database');

const createAdmin = async () => {
  try {
    const pool = getPool();

    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

    await pool.query(
  `INSERT INTO admins (username, email, password_hash)
   VALUES ($1, $2, $3)
   ON CONFLICT (username)
   DO UPDATE SET
     email = EXCLUDED.email,
     password_hash = EXCLUDED.password_hash`,
  [
    process.env.ADMIN_USERNAME,
    process.env.ADMIN_EMAIL,
    hash
  ]
);
    console.log("✅ Admin created successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    process.exit(1);
  }
};

createAdmin();