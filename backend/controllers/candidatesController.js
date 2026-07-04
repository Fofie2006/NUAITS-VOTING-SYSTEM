const path = require('path');
const { getPool } = require('../config/database');
const { auditLog, getClientIP } = require('../utils/auditLogger');
const { deletePhoto } = require('../middleware/upload');

const buildPhotoUrl = (req, filename) => {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  return `${req.protocol}://${req.get('host')}/uploads/candidates/${filename}`;
};

// GET ALL
const getAllCandidates = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM candidates ORDER BY position, fullname`
    );

    const rows = result.rows.map(c => ({
      ...c,
      photo: c.photo ? buildPhotoUrl(req, c.photo) : null
    }));

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch candidates' });
  }
};

// GET ONE
const getCandidate = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM candidates WHERE id=$1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    const c = result.rows[0];

    res.json({
      success: true,
      data: {
        ...c,
        photo: c.photo ? buildPhotoUrl(req, c.photo) : null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch candidate' });
  }
};

// CREATE
const createCandidate = async (req, res) => {
  try {
    const { fullname, position, department, manifesto } = req.body;
    const photoFilename = req.file ? req.file.filename : null;

    const pool = getPool();

    const result = await pool.query(
      `INSERT INTO candidates (fullname, position, department, manifesto, photo)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id`,
      [fullname, position, department || null, manifesto || null, photoFilename]
    );

    const newId = result.rows[0].id;

    await auditLog({
      action: 'CANDIDATE_ADDED',
      description: `Candidate added: ${fullname}`,
      admin_user: req.admin?.username,
      ip_address: getClientIP(req),
    });

    res.status(201).json({
      success: true,
      message: 'Candidate added successfully',
      data: {
        id: newId,
        photo: photoFilename ? buildPhotoUrl(req, photoFilename) : null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add candidate' });
  }
};

// UPDATE
const updateCandidate = async (req, res) => {
  try {
    const { fullname, position, department, manifesto } = req.body;
    const pool = getPool();

    const existing = await pool.query(
      `SELECT photo FROM candidates WHERE id=$1`,
      [req.params.id]
    );

    if (!existing.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    let photoFilename = existing.rows[0].photo;

    if (req.file) {
      if (photoFilename) deletePhoto(photoFilename);
      photoFilename = req.file.filename;
    }

    await pool.query(
      `UPDATE candidates
       SET fullname=$1, position=$2, department=$3, manifesto=$4, photo=$5
       WHERE id=$6`,
      [
        fullname,
        position,
        department || null,
        manifesto || null,
        photoFilename,
        req.params.id
      ]
    );

    await auditLog({
      action: 'CANDIDATE_UPDATED',
      description: `Candidate updated`,
      admin_user: req.admin?.username,
      ip_address: getClientIP(req),
    });

    res.json({
      success: true,
      message: 'Candidate updated successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update candidate' });
  }
};

// DELETE
const deleteCandidate = async (req, res) => {
  try {
    const pool = getPool();

    const votes = await pool.query(
      `SELECT COUNT(*) as cnt FROM votes WHERE candidate_id=$1`,
      [req.params.id]
    );

    if (parseInt(votes.rows[0].cnt) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete candidate with votes'
      });
    }

    const existing = await pool.query(
      `SELECT photo FROM candidates WHERE id=$1`,
      [req.params.id]
    );

    if (existing.rows.length && existing.rows[0].photo) {
      deletePhoto(existing.rows[0].photo);
    }

    await pool.query(
      `DELETE FROM candidates WHERE id=$1`,
      [req.params.id]
    );

    await auditLog({
      action: 'CANDIDATE_DELETED',
      description: `Candidate deleted`,
      admin_user: req.admin?.username,
      ip_address: getClientIP(req),
    });

    res.json({
      success: true,
      message: 'Candidate deleted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete candidate' });
  }
};

module.exports = {
  getAllCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate
};