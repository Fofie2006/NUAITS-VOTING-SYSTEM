const { getPool } = require('../config/database');
const { generateUniqueVotingCode } = require('../utils/codeGenerator');
const { sendVotingCredentials } = require('../utils/email');
const { auditLog, getClientIP } = require('../utils/auditLogger');

// GET all students
const getAllStudents = async (req, res) => {
  try {
    const pool = getPool();

    const result = await pool.query(`
      SELECT id, fullname, student_id, email, department, level,
             voting_code, code_used, email_sent, created_at
      FROM students
      ORDER BY created_at DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch students' });
  }
};

// GET single student
const getStudent = async (req, res) => {
  try {
    const pool = getPool();

    const result = await pool.query(
      `SELECT id, fullname, student_id, email, department, level,
              voting_code, code_used, email_sent, created_at
       FROM students WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch student' });
  }
};

// CREATE student
const createStudent = async (req, res) => {
  try {
    const { fullname, student_id, email, department, level } = req.body;
    const pool = getPool();

    const existing = await pool.query(
      'SELECT id FROM students WHERE student_id=$1 OR email=$2',
      [student_id, email]
    );

    if (existing.rows.length) {
      return res.status(409).json({
        success: false,
        message: 'Student ID or email already registered'
      });
    }

    const voting_code = await generateUniqueVotingCode();

    await pool.query(
      `INSERT INTO students
      (fullname, student_id, email, department, level, voting_code)
      VALUES ($1,$2,$3,$4,$5,$6)`,
      [fullname, student_id, email, department, level, voting_code]
    );

    let emailSent = false;

    try {
      await sendVotingCredentials({ fullname, student_id, email, voting_code });

      await pool.query(
        'UPDATE students SET email_sent=true WHERE student_id=$1',
        [student_id]
      );

      emailSent = true;
    } catch (emailErr) {
      console.error(emailErr.message);
    }

    await auditLog({
      action: 'STUDENT_REGISTERED',
      description: `Student registered: ${fullname} (${student_id})`,
      admin_user: req.admin?.username,
      ip_address: getClientIP(req),
    });

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: { fullname, student_id, email, voting_code, emailSent }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to register student' });
  }
};

// UPDATE student
const updateStudent = async (req, res) => {
  try {
    const { fullname, email, department, level } = req.body;
    const pool = getPool();

    const existing = await pool.query(
      'SELECT id FROM students WHERE id=$1',
      [req.params.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await pool.query(
      `UPDATE students
       SET fullname=$1, email=$2, department=$3, level=$4
       WHERE id=$5`,
      [fullname, email, department, level, req.params.id]
    );

    await auditLog({
      action: 'STUDENT_UPDATED',
      description: `Student #${req.params.id} updated`,
      admin_user: req.admin?.username,
      ip_address: getClientIP(req)
    });

    res.json({ success: true, message: 'Student updated successfully' });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update student' });
  }
};

// DELETE student
const deleteStudent = async (req, res) => {
  try {
    const pool = getPool();

    const existing = await pool.query(
      'SELECT id, code_used FROM students WHERE id=$1',
      [req.params.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (existing.rows[0].code_used) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete student who has already voted'
      });
    }

    await pool.query('DELETE FROM students WHERE id=$1', [req.params.id]);

    await auditLog({
      action: 'STUDENT_DELETED',
      description: `Student #${req.params.id} deleted`,
      admin_user: req.admin?.username,
      ip_address: getClientIP(req)
    });

    res.json({ success: true, message: 'Student deleted successfully' });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete student' });
  }
};

// RESEND EMAIL
const resendEmail = async (req, res) => {
  try {
    const pool = getPool();

    const result = await pool.query(
      'SELECT * FROM students WHERE id=$1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const student = result.rows[0];
    await sendVotingCredentials(student);

    await pool.query(
      'UPDATE students SET email_sent=true WHERE id=$1',
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Voting credentials resent successfully'
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to resend email' });
  }
};

// DASHBOARD
const getDashboardStats = async (req, res) => {
  try {
    const pool = getPool();

    const [students, votes, candidates, election, logs] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE code_used=true) AS voted FROM students'),
      pool.query('SELECT COUNT(*) AS total FROM votes'),
      pool.query('SELECT COUNT(*) AS total FROM candidates'),
      pool.query('SELECT * FROM elections ORDER BY created_at DESC LIMIT 1'),
      pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 5'),
    ]);

    const totalStudents = Number(students.rows[0].total);
    const votedStudents = Number(students.rows[0].voted || 0);
    const turnoutPct = totalStudents > 0
      ? ((votedStudents / totalStudents) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        totalStudents,
        votedStudents,
        totalVotes: Number(votes.rows[0].total),
        totalCandidates: Number(candidates.rows[0].total),
        turnoutPct,
        currentElection: election.rows[0] || null,
        recentLogs: logs.rows
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

module.exports = {
  getAllStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  resendEmail,
  getDashboardStats
};