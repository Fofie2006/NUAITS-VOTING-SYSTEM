const { getPool, sql } = require('../config/database');
const { generateUniqueVotingCode } = require('../utils/codeGenerator');
const { sendVotingCredentials } = require('../utils/email');
const { auditLog, getClientIP } = require('../utils/auditLogger');

// GET all students
const getAllStudents = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT id, fullname, student_id, email, department, level, 
             voting_code, code_used, email_sent, created_at
      FROM students 
      ORDER BY created_at DESC
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch students' });
  }
};

// GET single student
const getStudent = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT id, fullname, student_id, email, department, level, voting_code, code_used, email_sent, created_at FROM students WHERE id = @id');

    if (!result.recordset.length) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch student' });
  }
};

// POST create student
const createStudent = async (req, res) => {
  try {
    const { fullname, student_id, email, department, level } = req.body;
    const pool = await getPool();

    // Check duplicates
    const existing = await pool.request()
      .input('student_id', sql.NVarChar, student_id)
      .input('email', sql.NVarChar, email)
      .query('SELECT id FROM students WHERE student_id = @student_id OR email = @email');

    if (existing.recordset.length) {
      return res.status(409).json({ success: false, message: 'Student ID or email already registered' });
    }

    const voting_code = await generateUniqueVotingCode();

    await pool.request()
      .input('fullname', sql.NVarChar, fullname)
      .input('student_id', sql.NVarChar, student_id)
      .input('email', sql.NVarChar, email)
      .input('department', sql.NVarChar, department)
      .input('level', sql.NVarChar, level)
      .input('voting_code', sql.NVarChar, voting_code)
      .query(`
        INSERT INTO students (fullname, student_id, email, department, level, voting_code)
        VALUES (@fullname, @student_id, @email, @department, @level, @voting_code)
      `);

    // Send email
    let emailSent = false;
    try {
      await sendVotingCredentials({ fullname, student_id, email, voting_code });
      await pool.request()
        .input('student_id', sql.NVarChar, student_id)
        .query('UPDATE students SET email_sent = 1 WHERE student_id = @student_id');
      emailSent = true;
    } catch (emailErr) {
      console.error('Email error:', emailErr.message);
    }

    await auditLog({
      action: 'STUDENT_REGISTERED',
      description: `Student registered: ${fullname} (${student_id})`,
      admin_user: req.admin?.username,
      ip_address: getClientIP(req),
    });

    res.status(201).json({
      success: true,
      message: `Student registered successfully. ${emailSent ? 'Voting credentials emailed.' : 'Email failed — credentials generated.'}`,
      data: { fullname, student_id, email, voting_code, emailSent },
    });
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ success: false, message: 'Failed to register student' });
  }
};

// PUT update student
const updateStudent = async (req, res) => {
  try {
    const { fullname, email, department, level } = req.body;
    const pool = await getPool();

    const existing = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT id FROM students WHERE id = @id');

    if (!existing.recordset.length) return res.status(404).json({ success: false, message: 'Student not found' });

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('fullname', sql.NVarChar, fullname)
      .input('email', sql.NVarChar, email)
      .input('department', sql.NVarChar, department)
      .input('level', sql.NVarChar, level)
      .query('UPDATE students SET fullname=@fullname, email=@email, department=@department, level=@level WHERE id=@id');

    await auditLog({ action: 'STUDENT_UPDATED', description: `Student #${req.params.id} updated`, admin_user: req.admin?.username, ip_address: getClientIP(req) });
    res.json({ success: true, message: 'Student updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update student' });
  }
};

// DELETE student
const deleteStudent = async (req, res) => {
  try {
    const pool = await getPool();
    const existing = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT id, student_id, code_used FROM students WHERE id = @id');

    if (!existing.recordset.length) return res.status(404).json({ success: false, message: 'Student not found' });
    if (existing.recordset[0].code_used) {
      return res.status(400).json({ success: false, message: 'Cannot delete student who has already voted' });
    }

    await pool.request().input('id', sql.Int, req.params.id).query('DELETE FROM students WHERE id = @id');
    await auditLog({ action: 'STUDENT_DELETED', description: `Student #${req.params.id} deleted`, admin_user: req.admin?.username, ip_address: getClientIP(req) });
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete student' });
  }
};

// POST resend email
const resendEmail = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM students WHERE id = @id');

    if (!result.recordset.length) return res.status(404).json({ success: false, message: 'Student not found' });

    const student = result.recordset[0];
    await sendVotingCredentials(student);
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('UPDATE students SET email_sent = 1 WHERE id = @id');

    res.json({ success: true, message: 'Voting credentials resent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to resend email' });
  }
};

// GET dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const pool = await getPool();

    const [students, votes, candidates, election, logs] = await Promise.all([
      pool.request().query('SELECT COUNT(*) as total, SUM(CAST(code_used AS INT)) as voted FROM students'),
      pool.request().query('SELECT COUNT(*) as total FROM votes'),
      pool.request().query('SELECT COUNT(*) as total FROM candidates'),
      pool.request().query('SELECT TOP 1 * FROM elections ORDER BY created_at DESC'),
      pool.request().query('SELECT TOP 5 * FROM audit_logs ORDER BY timestamp DESC'),
    ]);

    const totalStudents = students.recordset[0].total;
    const votedStudents = students.recordset[0].voted || 0;
    const turnoutPct = totalStudents > 0 ? ((votedStudents / totalStudents) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        totalStudents,
        votedStudents,
        totalVotes: votes.recordset[0].total,
        totalCandidates: candidates.recordset[0].total,
        turnoutPct,
        currentElection: election.recordset[0] || null,
        recentLogs: logs.recordset,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

module.exports = { getAllStudents, getStudent, createStudent, updateStudent, deleteStudent, resendEmail, getDashboardStats };
