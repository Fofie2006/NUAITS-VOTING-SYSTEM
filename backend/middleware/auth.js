const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/database');

const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify admin still exists
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, decoded.id)
      .query('SELECT id, username, email FROM admins WHERE id = @id');

    if (!result.recordset.length) {
      return res.status(401).json({ success: false, message: 'Admin account not found' });
    }

    req.admin = result.recordset[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token' });
  }
};

module.exports = { authenticateAdmin };
