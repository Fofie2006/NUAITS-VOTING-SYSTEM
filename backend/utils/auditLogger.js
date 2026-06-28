const { getPool, sql } = require('../config/database');

const auditLog = async ({ action, description, student_id = null, admin_user = null, ip_address = null, user_agent = null, success = true }) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('action', sql.NVarChar, action)
      .input('description', sql.NVarChar, description || null)
      .input('student_id', sql.NVarChar, student_id || null)
      .input('admin_user', sql.NVarChar, admin_user || null)
      .input('ip_address', sql.NVarChar, ip_address || null)
      .input('user_agent', sql.NVarChar, user_agent ? user_agent.substring(0, 500) : null)
      .input('success', sql.Bit, success ? 1 : 0)
      .query(`
        INSERT INTO audit_logs (action, description, student_id, admin_user, ip_address, user_agent, success)
        VALUES (@action, @description, @student_id, @admin_user, @ip_address, @user_agent, @success)
      `);
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown';
};

module.exports = { auditLog, getClientIP };
