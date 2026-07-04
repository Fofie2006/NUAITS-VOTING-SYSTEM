const { getPool } = require('../config/database');
const { auditLog, getClientIP } = require('../utils/auditLogger');

/**
 * STEP 1: VALIDATE CREDENTIALS
 */
const validateCredentials = async (req, res) => {
  const ip = getClientIP(req);

  try {
    const { student_id, voting_code } = req.body;

    if (!student_id || !voting_code) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and voting code are required'
      });
    }

    const pool = getPool();

    // Check active election
    const electionResult = await pool.query(`
      SELECT * FROM elections
      WHERE status='active' AND voting_enabled=true
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (!electionResult.rows.length) {
      return res.status(403).json({
        success: false,
        message: 'Voting is not open'
      });
    }

    const election = electionResult.rows[0];

    // Get student
    const studentResult = await pool.query(
      `SELECT * FROM students WHERE UPPER(student_id)=UPPER($1)`,
      [student_id]
    );

    if (!studentResult.rows.length) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const student = studentResult.rows[0];

    if (student.voting_code.toUpperCase() !== voting_code.toUpperCase()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (student.code_used) {
      return res.status(403).json({
        success: false,
        message: 'Voting code already used'
      });
    }

    // Already voted positions
    const votedPositions = await pool.query(
      `SELECT position FROM votes WHERE student_db_id=$1 AND election_id=$2`,
      [student.id, election.id]
    );

    // 🔥 FIX: Proper image URL handling
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const candidatesResult = await pool.query(`
      SELECT id, fullname, position, photo, department, manifesto
      FROM candidates
      ORDER BY position, fullname
    `);

    const candidates = candidatesResult.rows.map(c => ({
      ...c,
      photo: c.photo
        ? (c.photo.startsWith('http')
            ? c.photo
            : `${baseUrl}/uploads/candidates/${c.photo}`)
        : null
    }));

    res.json({
      success: true,
      data: {
        student: {
          name: student.fullname,
          student_id: student.student_id,
          department: student.department,
          level: student.level
        },
        election: {
          id: election.id,
          title: election.title
        },
        candidates,
        alreadyVotedFor: votedPositions.rows.map(r => r.position)
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


/**
 * STEP 2: SUBMIT VOTES
 */
const submitVotes = async (req, res) => {
  const pool = getPool();
  const client = await pool.connect();
  const ip = getClientIP(req);

  try {
    const { student_id, voting_code, election_id, votes } = req.body;

    await client.query('BEGIN');

    // Validate election
    const election = await client.query(
      `SELECT * FROM elections
       WHERE id=$1 AND status='active' AND voting_enabled=true`,
      [election_id]
    );

    if (!election.rows.length) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Voting session ended'
      });
    }

    // Lock student
    const studentResult = await client.query(
      `SELECT * FROM students
       WHERE UPPER(student_id)=UPPER($1)
       FOR UPDATE`,
      [student_id]
    );

    if (!studentResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const student = studentResult.rows[0];

    if (student.voting_code.toUpperCase() !== voting_code.toUpperCase()) {
      await client.query('ROLLBACK');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (student.code_used) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Voting code already used'
      });
    }

    // Insert votes
    for (const vote of votes) {
      await client.query(
        `INSERT INTO votes
        (student_db_id, student_id, candidate_id, position, election_id, ip_address)
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          student.id,
          student.student_id,
          vote.candidate_id,
          vote.position,
          election_id,
          ip
        ]
      );

      await client.query(
        `UPDATE candidates SET votes = votes + 1 WHERE id=$1`,
        [vote.candidate_id]
      );
    }

    // Mark used
    await client.query(
      `UPDATE students SET code_used=true WHERE id=$1`,
      [student.id]
    );

    await client.query('COMMIT');

    await auditLog({
      action: 'VOTE_SUBMITTED',
      student_id: student.student_id,
      ip_address: ip,
      description: `Votes submitted`
    });

    res.json({
      success: true,
      message: 'Vote submitted successfully'
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);

    res.status(500).json({
      success: false,
      message: 'Vote submission failed'
    });

  } finally {
    client.release();
  }
};

module.exports = {
  validateCredentials,
  submitVotes
};