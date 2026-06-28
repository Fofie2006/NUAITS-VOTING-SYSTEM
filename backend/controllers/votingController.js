const { getPool, sql } = require('../config/database');
const { auditLog, getClientIP } = require('../utils/auditLogger');

/**
 * Step 1: Validate student credentials and return available positions to vote for
 */
const validateCredentials = async (req, res) => {
  const ip = getClientIP(req);
  try {
    const { student_id, voting_code } = req.body;

    if (!student_id || !voting_code) {
      return res.status(400).json({ success: false, message: 'Student ID and voting code are required' });
    }

    const pool = await getPool();

    // 1. Check for active election with voting enabled
    const electionResult = await pool.request().query(
      "SELECT TOP 1 * FROM elections WHERE status = 'active' AND voting_enabled = 1"
    );

    if (!electionResult.recordset.length) {
      await auditLog({ action: 'VOTE_ATTEMPT_NO_ELECTION', student_id, ip_address: ip, success: false });
      return res.status(403).json({ success: false, message: 'Voting is not currently open. Please check back later.' });
    }

    const election = electionResult.recordset[0];

    // 2. Look up student
    const studentResult = await pool.request()
      .input('student_id', sql.NVarChar, student_id.trim().toUpperCase())
      .query('SELECT * FROM students WHERE UPPER(student_id) = @student_id');

    if (!studentResult.recordset.length) {
      await auditLog({ action: 'VOTE_INVALID_STUDENT_ID', student_id, ip_address: ip, success: false, description: 'Student ID not found' });
      return res.status(401).json({ success: false, message: 'Invalid Student ID or voting code' });
    }

    const student = studentResult.recordset[0];

    // 3. Validate voting code
    const normalizedCode = voting_code.trim().toUpperCase();
    if (student.voting_code.toUpperCase() !== normalizedCode) {
      await auditLog({ action: 'VOTE_INVALID_CODE', student_id, ip_address: ip, success: false, description: 'Wrong voting code entered' });
      return res.status(401).json({ success: false, message: 'Invalid Student ID or voting code' });
    }

    // 4. Check if code already used
    if (student.code_used) {
      await auditLog({ action: 'VOTE_CODE_REUSED', student_id, ip_address: ip, success: false, description: 'Attempt to reuse voting code' });
      return res.status(403).json({ success: false, message: 'This voting code has already been used. Each code is single-use only.' });
    }

    // 5. Check which positions this student has already voted for (shouldn't happen but safety check)
    const votedPositions = await pool.request()
      .input('student_db_id', sql.Int, student.id)
      .input('election_id', sql.Int, election.id)
      .query('SELECT position FROM votes WHERE student_db_id = @student_db_id AND election_id = @election_id');

    const alreadyVotedFor = votedPositions.recordset.map(r => r.position);

    // 6. Get candidates
    const candidates = await pool.request().query('SELECT id, fullname, position, photo, department, manifesto FROM candidates ORDER BY position, fullname');

    await auditLog({ action: 'VOTE_CREDENTIALS_VALIDATED', student_id, ip_address: ip, description: `Valid credentials for ${student.fullname}` });

    res.json({
      success: true,
      message: 'Credentials verified. You may now vote.',
      data: {
        student: {
          name: student.fullname,
          student_id: student.student_id,
          department: student.department,
          level: student.level,
        },
        election: { id: election.id, title: election.title },
        candidates: candidates.recordset,
        alreadyVotedFor,
      },
    });
  } catch (err) {
    console.error('Validate credentials error:', err);
    await auditLog({ action: 'VOTE_SYSTEM_ERROR', ip_address: ip, success: false, description: err.message });
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
};

/**
 * Step 2: Submit votes (all positions at once)
 * votes: [{ candidate_id, position }, ...]
 */
const submitVotes = async (req, res) => {
  const ip = getClientIP(req);
  const pool = await getPool();

  try {
    const { student_id, voting_code, election_id, votes } = req.body;

    if (!student_id || !voting_code || !election_id || !votes || !Array.isArray(votes) || !votes.length) {
      return res.status(400).json({ success: false, message: 'Invalid vote submission data' });
    }

    // BEGIN TRANSACTION for atomic vote submission
    const transaction = new (require('mssql').Transaction)(pool);
    await transaction.begin();

    try {
      const req2 = new (require('mssql').Request)(transaction);

      // Re-validate everything atomically
      const electionResult = await req2
        .input('election_id', sql.Int, election_id)
        .query("SELECT * FROM elections WHERE id = @election_id AND status = 'active' AND voting_enabled = 1");

      if (!electionResult.recordset.length) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: 'Voting session has ended' });
      }

      // Lock and validate student row
      const studentResult = await new (require('mssql').Request)(transaction)
        .input('student_id', sql.NVarChar, student_id.trim().toUpperCase())
        .query('SELECT * FROM students WITH (UPDLOCK, ROWLOCK) WHERE UPPER(student_id) = @student_id');

      if (!studentResult.recordset.length) {
        await transaction.rollback();
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const student = studentResult.recordset[0];

      if (student.voting_code.toUpperCase() !== voting_code.trim().toUpperCase()) {
        await transaction.rollback();
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // Critical: check code_used with row lock
      if (student.code_used) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: 'This voting code has already been used' });
      }

      // Insert all votes
      for (const vote of votes) {
        await new (require('mssql').Request)(transaction)
          .input('student_db_id', sql.Int, student.id)
          .input('student_id', sql.NVarChar, student.student_id)
          .input('candidate_id', sql.Int, vote.candidate_id)
          .input('position', sql.NVarChar, vote.position)
          .input('election_id', sql.Int, election_id)
          .input('ip_address', sql.NVarChar, ip)
          .query(`
            INSERT INTO votes (student_db_id, student_id, candidate_id, position, election_id, ip_address)
            VALUES (@student_db_id, @student_id, @candidate_id, @position, @election_id, @ip_address)
          `);

        // Update candidate vote count
        await new (require('mssql').Request)(transaction)
          .input('candidate_id', sql.Int, vote.candidate_id)
          .query('UPDATE candidates SET votes = votes + 1 WHERE id = @candidate_id');
      }

      // Mark voting code as USED - this is the critical single-use enforcement
      await new (require('mssql').Request)(transaction)
        .input('id', sql.Int, student.id)
        .query('UPDATE students SET code_used = 1 WHERE id = @id');

      await transaction.commit();

      await auditLog({
        action: 'VOTE_SUBMITTED',
        student_id: student.student_id,
        description: `Vote submitted successfully for ${votes.length} position(s)`,
        ip_address: ip,
        success: true,
      });

      res.json({
        success: true,
        message: 'Your votes have been submitted successfully! Thank you for participating.',
        data: { votesSubmitted: votes.length },
      });
    } catch (txErr) {
      await transaction.rollback();
      throw txErr;
    }
  } catch (err) {
    console.error('Submit vote error:', err);
    await auditLog({ action: 'VOTE_SUBMIT_ERROR', ip_address: ip, success: false, description: err.message });
    res.status(500).json({ success: false, message: 'Failed to submit votes. Please try again.' });
  }
};

module.exports = { validateCredentials, submitVotes };
