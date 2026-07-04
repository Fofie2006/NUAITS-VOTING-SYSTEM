const { getPool } = require('../config/database');

const getLogs = async (req, res) => {
  try {
    const pool = getPool();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const action = req.query.action || null;

    let query = `SELECT * FROM audit_logs`;
    let countQuery = `SELECT COUNT(*) AS total FROM audit_logs`;

    let params = [];
    let countParams = [];

    if (action) {
      query += ` WHERE action = $1`;
      countQuery += ` WHERE action = $1`;
      params.push(action);
      countParams.push(action);
    }

    query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const [logsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
    ]);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: logsResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Logs error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs'
    });
  }
};

const getInvalidAttempts = async (req, res) => {
  try {
    const pool = getPool();

    const result = await pool.query(`
      SELECT * FROM audit_logs
      WHERE success = false
      AND action LIKE 'VOTE_%'
      ORDER BY timestamp DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Invalid attempts error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invalid attempts'
    });
  }
};

module.exports = { getLogs, getInvalidAttempts };