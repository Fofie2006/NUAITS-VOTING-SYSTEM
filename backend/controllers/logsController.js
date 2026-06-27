const { getPool, sql } = require('../config/database');

const getLogs = async (req, res) => {
  try {
    const pool = await getPool();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const action = req.query.action || null;

    let query = 'SELECT * FROM audit_logs';
    const countQuery = 'SELECT COUNT(*) as total FROM audit_logs';
    const r = pool.request();

    if (action) {
      query += ' WHERE action = @action';
      r.input('action', sql.NVarChar, action);
    }

    query += ` ORDER BY timestamp DESC OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;

    const [logsResult, countResult] = await Promise.all([
      r.query(query),
      pool.request().query(countQuery),
    ]);

    res.json({
      success: true,
      data: logsResult.recordset,
      pagination: {
        page,
        limit,
        total: countResult.recordset[0].total,
        pages: Math.ceil(countResult.recordset[0].total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
};

const getInvalidAttempts = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT TOP 100 * FROM audit_logs 
      WHERE success = 0 AND action LIKE 'VOTE_%'
      ORDER BY timestamp DESC
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch invalid attempts' });
  }
};

module.exports = { getLogs, getInvalidAttempts };
