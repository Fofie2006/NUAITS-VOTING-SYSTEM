const { getPool } = require('../config/database');

// Get client IP safely
const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
};

// Audit log function (POSTGRES VERSION)
const auditLog = async ({
  action,
  description,
  student_id = null,
  admin_user = null,
  ip_address = null,
  user_agent = null,
  success = true
}) => {
  try {
    const pool = getPool();

    await pool.query(
      `INSERT INTO audit_logs 
      (action, description, student_id, admin_user, ip_address, user_agent, success)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        action,
        description,
        student_id,
        admin_user,
        ip_address,
        user_agent,
        success
      ]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { auditLog, getClientIP };