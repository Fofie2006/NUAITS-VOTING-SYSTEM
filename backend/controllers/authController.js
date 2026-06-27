const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/database');
const { auditLog, getClientIP } = require('../utils/auditLogger');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM admins WHERE username = @username OR email = @username');

    if (!result.recordset.length) {
      await auditLog({ action: 'ADMIN_LOGIN_FAILED', description: `Failed login: ${username}`, ip_address: getClientIP(req), success: false });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const admin = result.recordset[0];
    const validPassword = await bcrypt.compare(password, admin.password_hash);

    if (!validPassword) {
      await auditLog({ action: 'ADMIN_LOGIN_FAILED', description: `Wrong password for: ${username}`, ip_address: getClientIP(req), success: false });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await auditLog({ action: 'ADMIN_LOGIN', description: `Admin logged in: ${admin.username}`, admin_user: admin.username, ip_address: getClientIP(req) });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: { id: admin.id, username: admin.username, email: admin.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, req.admin.id)
      .query('SELECT password_hash FROM admins WHERE id = @id');

    const valid = await bcrypt.compare(currentPassword, result.recordset[0].password_hash);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.request()
      .input('id', sql.Int, req.admin.id)
      .input('hash', sql.NVarChar, newHash)
      .query('UPDATE admins SET password_hash = @hash WHERE id = @id');

    await auditLog({ action: 'ADMIN_PASSWORD_CHANGE', admin_user: req.admin.username, ip_address: getClientIP(req) });
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

module.exports = { login, changePassword };
