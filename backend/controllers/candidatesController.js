const path   = require('path');
const { getPool, sql } = require('../config/database');
const { auditLog, getClientIP } = require('../utils/auditLogger');
const { deletePhoto } = require('../middleware/upload');

// Build photo URL from filename
const buildPhotoUrl = (req, filename) => {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  const protocol = req.protocol;
  const host     = req.get('host');
  return `${protocol}://${host}/uploads/candidates/${filename}`;
};

const getAllCandidates = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(
      'SELECT * FROM candidates ORDER BY position, fullname'
    );
    // Attach full photo URLs
    const rows = result.recordset.map(c => ({
      ...c,
      photo: c.photo ? buildPhotoUrl(req, c.photo) : null,
    }));
    res.json({ success: true, data: rows });
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
    if (!result.recordset.length)
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    const c = result.recordset[0];
    res.json({ success: true, data: { ...c, photo: c.photo ? buildPhotoUrl(req, c.photo) : null } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch candidate' });
  }
};

const createCandidate = async (req, res) => {
  try {
    const { fullname, position, department, manifesto } = req.body;
    // photo is stored as just the filename (relative)
    const photoFilename = req.file ? req.file.filename : null;

    const pool = await getPool();
    const result = await pool.request()
      .input('fullname',   sql.NVarChar, fullname)
      .input('position',   sql.NVarChar, position)
      .input('department', sql.NVarChar, department || null)
      .input('manifesto',  sql.NVarChar, manifesto  || null)
      .input('photo',      sql.NVarChar, photoFilename)
      .query(`
        INSERT INTO candidates (fullname, position, department, manifesto, photo)
        OUTPUT INSERTED.id
        VALUES (@fullname, @position, @department, @manifesto, @photo)
      `);

    const newId = result.recordset[0].id;
    await auditLog({
      action:     'CANDIDATE_ADDED',
      description:`Candidate added: ${fullname} for ${position}`,
      admin_user: req.admin?.username,
      ip_address: getClientIP(req),
    });

    res.status(201).json({
      success: true,
      message: 'Candidate added successfully',
      data: {
        id:    newId,
        photo: photoFilename ? buildPhotoUrl(req, photoFilename) : null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add candidate' });
  }
};

const updateCandidate = async (req, res) => {
  try {
    const { fullname, position, department, manifesto } = req.body;
    const pool = await getPool();

    // Get existing candidate to handle photo replacement
    const existing = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT id, photo FROM candidates WHERE id = @id');
    if (!existing.recordset.length)
      return res.status(404).json({ success: false, message: 'Candidate not found' });

    const oldPhoto = existing.recordset[0].photo;

    // If a new file was uploaded, delete the old one
    let photoFilename = oldPhoto; // keep existing by default
    if (req.file) {
      if (oldPhoto) deletePhoto(oldPhoto);
      photoFilename = req.file.filename;
    }

    await pool.request()
      .input('id',         sql.Int,      req.params.id)
      .input('fullname',   sql.NVarChar, fullname)
      .input('position',   sql.NVarChar, position)
      .input('department', sql.NVarChar, department || null)
      .input('manifesto',  sql.NVarChar, manifesto  || null)
      .input('photo',      sql.NVarChar, photoFilename)
      .query(`
        UPDATE candidates
        SET fullname=@fullname, position=@position,
            department=@department, manifesto=@manifesto, photo=@photo
        WHERE id=@id
      `);

    await auditLog({
      action:     'CANDIDATE_UPDATED',
      description:`Candidate #${req.params.id} updated`,
      admin_user: req.admin?.username,
      ip_address: getClientIP(req),
    });

    res.json({
      success: true,
      message: 'Candidate updated successfully',
      data: { photo: photoFilename ? buildPhotoUrl(req, photoFilename) : null },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update candidate' });
  }
};

const deleteCandidate = async (req, res) => {
  try {
    const pool = await getPool();
    const votes = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT COUNT(*) as cnt FROM votes WHERE candidate_id = @id');
    if (votes.recordset[0].cnt > 0)
      return res.status(400).json({ success: false, message: 'Cannot delete candidate with existing votes' });

    // Delete photo file
    const existing = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT photo FROM candidates WHERE id = @id');
    if (existing.recordset.length && existing.recordset[0].photo) {
      deletePhoto(existing.recordset[0].photo);
    }

    await pool.request().input('id', sql.Int, req.params.id)
      .query('DELETE FROM candidates WHERE id = @id');

    await auditLog({
      action:     'CANDIDATE_DELETED',
      description:`Candidate #${req.params.id} deleted`,
      admin_user: req.admin?.username,
      ip_address: getClientIP(req),
    });

    res.json({ success: true, message: 'Candidate deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete candidate' });
  }
};

module.exports = { getAllCandidates, getCandidate, createCandidate, updateCandidate, deleteCandidate };
