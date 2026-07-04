require('dotenv').config();
const { Pool } = require('pg');


console.log("DB_HOST =", process.env.DB_HOST);
console.log("DB_PORT =", process.env.DB_PORT);
console.log("DB_USER =", process.env.DB_USER);
console.log("DB_NAME =", process.env.DB_NAME);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Supabase PostgreSQL');
    client.release();
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
};

const getPool = () => pool;

module.exports = { connectDB, getPool };