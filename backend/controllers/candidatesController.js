const { getPool, sql } = require('../config/database');
const { auditLog, getClientIP } = require('../utils/auditLogger');

const getAllCandidates = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM candidates ORDER BY position, fullname');
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch candidates' });
  }
};

const getCandidate = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM candidates WHERE id = @id');
    if (!result.recordset.length) return res.status(404).json({ success: false, message: 'Candidate not found' });
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch candidate' });
  }
};

const createCandidate = async (req, res) => {
  try {
    const { fullname, position, department, manifesto, photo } = req.body;
    const pool = await getPool();

    const result = await pool.request()
      .input('fullname', sql.NVarChar, fullname)
      .input('position', sql.NVarChar, position)
      .input('department', sql.NVarChar, department || null)
      .input('manifesto', sql.NVarChar, manifesto || null)
      .input('photo', sql.NVarChar, photo || null)
      .query(`
        INSERT INTO candidates (fullname, position, department, manifesto, photo)
        OUTPUT INSERTED.id
        VALUES (@fullname, @position, @department, @manifesto, @photo)
      `);

    const newId = result.recordset[0].id;
    await auditLog({ action: 'CANDIDATE_ADDED', description: `Candidate added: ${fullname} for ${position}`, admin_user: req.admin?.username, ip_address: getClientIP(req) });
    res.status(201).json({ success: true, message: 'Candidate added successfully', data: { id: newId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add candidate' });
  }
};

const updateCandidate = async (req, res) => {
  try {
    const { fullname, position, department, manifesto, photo } = req.body;
    const pool = await getPool();

    const existing = await pool.request().input('id', sql.Int, req.params.id).query('SELECT id FROM candidates WHERE id = @id');
    if (!existing.recordset.length) return res.status(404).json({ success: false, message: 'Candidate not found' });

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('fullname', sql.NVarChar, fullname)
      .input('position', sql.NVarChar, position)
      .input('department', sql.NVarChar, department || null)
      .input('manifesto', sql.NVarChar, manifesto || null)
      .input('photo', sql.NVarChar, photo || null)
      .query('UPDATE candidates SET fullname=@fullname, position=@position, department=@department, manifesto=@manifesto, photo=@photo WHERE id=@id');

    await auditLog({ action: 'CANDIDATE_UPDATED', description: `Candidate #${req.params.id} updated`, admin_user: req.admin?.username, ip_address: getClientIP(req) });
    res.json({ success: true, message: 'Candidate updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update candidate' });
  }
};

const deleteCandidate = async (req, res) => {
  try {
    const pool = await getPool();
    // Check if candidate has votes
    const votes = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT COUNT(*) as cnt FROM votes WHERE candidate_id = @id');

    if (votes.recordset[0].cnt > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete candidate with existing votes' });
    }

    await pool.request().input('id', sql.Int, req.params.id).query('DELETE FROM candidates WHERE id = @id');
    await auditLog({ action: 'CANDIDATE_DELETED', description: `Candidate #${req.params.id} deleted`, admin_user: req.admin?.username, ip_address: getClientIP(req) });
    res.json({ success: true, message: 'Candidate deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete candidate' });
  }
};

module.exports = { getAllCandidates, getCandidate, createCandidate, updateCandidate, deleteCandidate };
