const { getPool } = require('../config/database');
const { auditLog, getClientIP } = require('../utils/auditLogger');

const getAllElections = async (req, res) => {
  try {
    const pool = getPool();

    const result = await pool.query(
      'SELECT * FROM elections ORDER BY created_at DESC'
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch elections' });
  }
};

const getActiveElection = async (req, res) => {
  try {
    const pool = getPool();

    const result = await pool.query(
      `SELECT * FROM elections
       WHERE status IN ('active','pending')
       ORDER BY created_at DESC
       LIMIT 1`
    );

    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch active election' });
  }
};

const createElection = async (req, res) => {
  try {
    const { title, description } = req.body;
    const pool = getPool();

    const active = await pool.query(
      "SELECT id FROM elections WHERE status='active'"
    );

    if (active.rows.length) {
      return res.status(400).json({
        success: false,
        message: 'An active election already exists'
      });
    }

    const result = await pool.query(
      `INSERT INTO elections (title, description, status)
       VALUES ($1,$2,'pending')
       RETURNING id`,
      [title, description || null]
    );

    await auditLog({
      action: 'ELECTION_CREATED',
      description: `Election created: ${title}`,
      admin_user: req.admin?.username,
      ip_address: getClientIP(req)
    });

    res.status(201).json({
      success: true,
      message: 'Election created',
      data: { id: result.rows[0].id }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create election' });
  }
};

const updateElectionStatus = async (req, res) => {
  try {
    const { status, voting_enabled } = req.body;
    const pool = getPool();

    if (status) {
      await pool.query(
        `UPDATE elections
         SET status=$1,
             start_time = CASE WHEN $1='active' THEN NOW() ELSE start_time END,
             end_time = CASE WHEN $1='ended' THEN NOW() ELSE end_time END,
             voting_enabled = CASE
                WHEN $1='ended' THEN false
                ELSE voting_enabled
             END
         WHERE id=$2`,
        [status, req.params.id]
      );
    }

    if (voting_enabled !== undefined && status !== 'ended') {
      await pool.query(
        `UPDATE elections SET voting_enabled=$1 WHERE id=$2`,
        [voting_enabled, req.params.id]
      );
    }

    res.json({
      success: true,
      message: 'Election updated successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update election' });
  }
};

const getElectionResults = async (req, res) => {
  try {
    const pool = getPool();
    const electionId = req.params.id;

    const election = await pool.query(
      'SELECT * FROM elections WHERE id=$1',
      [electionId]
    );

    if (!election.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }

    const candidateVotes = await pool.query(`
      SELECT c.id, c.fullname, c.position, c.photo, c.department,
             COUNT(v.id) AS vote_count
      FROM candidates c
      LEFT JOIN votes v
        ON v.candidate_id = c.id
       AND v.election_id = ${electionId}
      GROUP BY c.id
      ORDER BY c.position
    `);

    const totalVoters = await pool.query(
      'SELECT COUNT(DISTINCT student_db_id) AS total FROM votes WHERE election_id=$1',
      [electionId]
    );

    const totalStudents = await pool.query(
      'SELECT COUNT(*) AS total FROM students'
    );

    res.json({
      success: true,
      data: {
        election: election.rows[0],
        candidates: candidateVotes.rows,
        totalVoters: totalVoters.rows[0].total,
        totalStudents: totalStudents.rows[0].total
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch results' });
  }
};

module.exports = {
  getAllElections,
  getActiveElection,
  createElection,
  updateElectionStatus,
  getElectionResults
};