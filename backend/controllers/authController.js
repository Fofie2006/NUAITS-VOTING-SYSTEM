const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/database');
const { auditLog, getClientIP } = require('../utils/auditLogger');

// =====================================================
// ADMIN LOGIN (POSTGRES VERSION)
// =====================================================
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password required'
      });
    }

    const pool = getPool();

    const result = await pool.query(
      'SELECT * FROM admins WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rows.length === 0) {
      await auditLog({
        action: 'ADMIN_LOGIN_FAILED',
        description: `Failed login: ${username}`,
        ip_address: getClientIP(req),
        success: false
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const admin = result.rows[0];

    const validPassword = await bcrypt.compare(password, admin.password_hash);

    if (!validPassword) {
      await auditLog({
        action: 'ADMIN_LOGIN_FAILED',
        description: `Wrong password for: ${username}`,
        ip_address: getClientIP(req),
        success: false
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        email: admin.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await auditLog({
      action: 'ADMIN_LOGIN',
      description: `Admin logged in: ${admin.username}`,
      admin_user: admin.username,
      ip_address: getClientIP(req)
    });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// =====================================================
// CHANGE PASSWORD (POSTGRES VERSION)
// =====================================================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const pool = getPool();

    const result = await pool.query(
      'SELECT password_hash FROM admins WHERE id = $1',
      [req.admin.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const admin = result.rows[0];

    const valid = await bcrypt.compare(currentPassword, admin.password_hash);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await pool.query(
      'UPDATE admins SET password_hash = $1 WHERE id = $2',
      [newHash, req.admin.id]
    );

    await auditLog({
      action: 'ADMIN_PASSWORD_CHANGE',
      admin_user: req.admin.username,
      ip_address: getClientIP(req)
    });

    return res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (err) {
    console.error('Password change error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

module.exports = {
  login,
  changePassword
};