const jwt = require('jsonwebtoken');
const { getPool } = require('../config/database');

const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const pool = await getPool();

    const result = await pool.query(
      'SELECT id, username, email FROM admins WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Admin account not found'
      });
    }

    req.admin = result.rows[0];
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
};

module.exports = { authenticateAdmin };