const { getPool, sql } = require('../config/database');
const { auditLog, getClientIP } = require('../utils/auditLogger');

const getAllElections = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM elections ORDER BY created_at DESC');
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch elections' });
  }
};

const getActiveElection = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(
      "SELECT TOP 1 * FROM elections WHERE status IN ('active', 'pending') ORDER BY created_at DESC"
    );
    res.json({ success: true, data: result.recordset[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch active election' });
  }
};

const createElection = async (req, res) => {
  try {
    const { title, description } = req.body;
    const pool = await getPool();

    // Check for active election
    const active = await pool.request().query("SELECT id FROM elections WHERE status = 'active'");
    if (active.recordset.length) {
      return res.status(400).json({ success: false, message: 'An active election already exists' });
    }

    const result = await pool.request()
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description || null)
      .query(`
        INSERT INTO elections (title, description, status)
        OUTPUT INSERTED.id
        VALUES (@title, @description, 'pending')
      `);

    const newId = result.recordset[0].id;
    await auditLog({ action: 'ELECTION_CREATED', description: `Election created: ${title}`, admin_user: req.admin?.username, ip_address: getClientIP(req) });
    res.status(201).json({ success: true, message: 'Election created', data: { id: newId } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create election' });
  }
};

const updateElectionStatus = async (req, res) => {
  try {
    const { status, voting_enabled } = req.body;
    const pool = await getPool();
    const validStatuses = ['pending', 'active', 'ended'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    let query = 'UPDATE elections SET ';
    const updates = [];
    const req2 = pool.request().input('id', sql.Int, req.params.id);

    if (status !== undefined) {
      updates.push('status = @status');
      req2.input('status', sql.NVarChar, status);
      if (status === 'active') { updates.push('start_time = GETDATE()'); }
      if (status === 'ended') { updates.push('end_time = GETDATE()', 'voting_enabled = 0'); }
    }

    if (voting_enabled !== undefined && status !== 'ended') {
      updates.push('voting_enabled = @voting_enabled');
      req2.input('voting_enabled', sql.Bit, voting_enabled ? 1 : 0);
    }

    query += updates.join(', ') + ' WHERE id = @id';
    await req2.query(query);

    const actionMap = { active: 'ELECTION_STARTED', ended: 'ELECTION_ENDED', pending: 'ELECTION_RESET' };
    const action = status ? (actionMap[status] || 'ELECTION_UPDATED') : 'ELECTION_VOTING_TOGGLED';
    await auditLog({ action, description: `Election #${req.params.id} status updated`, admin_user: req.admin?.username, ip_address: getClientIP(req) });

    res.json({ success: true, message: 'Election updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update election' });
  }
};

const getElectionResults = async (req, res) => {
  try {
    const pool = await getPool();
    const electionId = req.params.id;

    const [election, candidateVotes, totalVoters] = await Promise.all([
      pool.request().input('id', sql.Int, electionId).query('SELECT * FROM elections WHERE id = @id'),
      pool.request().input('id', sql.Int, electionId).query(`
        SELECT c.id, c.fullname, c.position, c.photo, c.department,
               COUNT(v.id) as vote_count
        FROM candidates c
        LEFT JOIN votes v ON v.candidate_id = c.id AND v.election_id = @id
        GROUP BY c.id, c.fullname, c.position, c.photo, c.department
        ORDER BY c.position, vote_count DESC
      `),
      pool.request().input('id', sql.Int, electionId).query(
        'SELECT COUNT(DISTINCT student_db_id) as total FROM votes WHERE election_id = @id'
      ),
    ]);

    if (!election.recordset.length) return res.status(404).json({ success: false, message: 'Election not found' });

    // Group by position
    const positions = {};
    candidateVotes.recordset.forEach(c => {
      if (!positions[c.position]) positions[c.position] = [];
      positions[c.position].push(c);
    });

    // Add vote percentages and winner per position
    const results = Object.entries(positions).map(([position, candidates]) => {
      const totalInPosition = candidates.reduce((sum, c) => sum + c.vote_count, 0);
      const withPct = candidates.map(c => ({
        ...c,
        percentage: totalInPosition > 0 ? ((c.vote_count / totalInPosition) * 100).toFixed(1) : '0.0',
      }));
      const winner = withPct[0]; // Already sorted by votes DESC
      return { position, candidates: withPct, winner, totalVotes: totalInPosition };
    });

    const totalStudents = (await pool.request().query('SELECT COUNT(*) as total FROM students')).recordset[0].total;
    const turnout = totalStudents > 0 ? ((totalVoters.recordset[0].total / totalStudents) * 100).toFixed(1) : '0.0';

    res.json({
      success: true,
      data: {
        election: election.recordset[0],
        results,
        totalVoters: totalVoters.recordset[0].total,
        totalStudents,
        turnout,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch results' });
  }
};

module.exports = { getAllElections, getActiveElection, createElection, updateElectionStatus, getElectionResults };
