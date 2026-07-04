<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateAdmin } = require('../middleware/auth');

// Controllers
const { login, changePassword } = require('../controllers/authController');
const { getAllStudents, getStudent, createStudent, updateStudent, deleteStudent, resendEmail, getDashboardStats } = require('../controllers/studentsController');
const { getAllCandidates, getCandidate, createCandidate, updateCandidate, deleteCandidate } = require('../controllers/candidatesController');
const { getAllElections, getActiveElection, createElection, updateElectionStatus, getElectionResults } = require('../controllers/electionsController');
const { validateCredentials, submitVotes } = require('../controllers/votingController');
const { getLogs, getInvalidAttempts } = require('../controllers/logsController');

// =====================================================
// AUTH ROUTES
// =====================================================
router.post('/auth/login', [
  body('username').notEmpty().trim(),
  body('password').notEmpty(),
], login);

router.put('/auth/change-password', authenticateAdmin, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], changePassword);

// =====================================================
// PUBLIC ROUTES (no auth required)
// =====================================================
router.get('/election/active', getActiveElection);
router.get('/candidates', getAllCandidates);

// Voting flow
router.post('/vote/validate', [
  body('student_id').notEmpty().trim(),
  body('voting_code').notEmpty().trim(),
], validateCredentials);

router.post('/vote/submit', [
  body('student_id').notEmpty(),
  body('voting_code').notEmpty(),
  body('election_id').isInt(),
  body('votes').isArray({ min: 1 }),
], submitVotes);

// =====================================================
// ADMIN ROUTES (auth required)
// =====================================================

// Dashboard
router.get('/admin/dashboard', authenticateAdmin, getDashboardStats);

// Students
router.get('/admin/students', authenticateAdmin, getAllStudents);
router.get('/admin/students/:id', authenticateAdmin, getStudent);
router.post('/admin/students', authenticateAdmin, [
  body('fullname').notEmpty().trim(),
  body('student_id').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('department').notEmpty().trim(),
  body('level').notEmpty().trim(),
], createStudent);
router.put('/admin/students/:id', authenticateAdmin, updateStudent);
router.delete('/admin/students/:id', authenticateAdmin, deleteStudent);
router.post('/admin/students/:id/resend-email', authenticateAdmin, resendEmail);

// Candidates
router.get('/admin/candidates', authenticateAdmin, getAllCandidates);
router.get('/admin/candidates/:id', authenticateAdmin, getCandidate);
router.post('/admin/candidates', authenticateAdmin, [
  body('fullname').notEmpty().trim(),
  body('position').notEmpty().trim(),
], createCandidate);
router.put('/admin/candidates/:id', authenticateAdmin, updateCandidate);
router.delete('/admin/candidates/:id', authenticateAdmin, deleteCandidate);

// Elections
router.get('/admin/elections', authenticateAdmin, getAllElections);
router.post('/admin/elections', authenticateAdmin, [
  body('title').notEmpty().trim(),
], createElection);
router.put('/admin/elections/:id/status', authenticateAdmin, updateElectionStatus);
router.get('/admin/elections/:id/results', authenticateAdmin, getElectionResults);
router.get('/elections/:id/results', getElectionResults); // Public results (if needed)

// Logs
router.get('/admin/logs', authenticateAdmin, getLogs);
router.get('/admin/logs/invalid-attempts', authenticateAdmin, getInvalidAttempts);

// Health check
router.get('/health', (req, res) => res.json({ success: true, status: 'online', timestamp: new Date() }));
=======
const express   = require('express');
const path      = require('path');
const router    = express.Router();
const { body }  = require('express-validator');
const { authenticateAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Controllers
const { login, changePassword }                = require('../controllers/authController');
const { getAllStudents, getStudent, createStudent, updateStudent, deleteStudent, resendEmail, getDashboardStats } = require('../controllers/studentsController');
const { getAllCandidates, getCandidate, createCandidate, updateCandidate, deleteCandidate } = require('../controllers/candidatesController');
const { getAllElections, getActiveElection, createElection, updateElectionStatus, getElectionResults } = require('../controllers/electionsController');
const { validateCredentials, submitVotes }     = require('../controllers/votingController');
const { getLogs, getInvalidAttempts }          = require('../controllers/logsController');

// ── Auth ─────────────────────────────────────────────
router.post('/auth/login', [body('username').notEmpty(), body('password').notEmpty()], login);
router.put('/auth/change-password', authenticateAdmin, changePassword);

// ── Public ───────────────────────────────────────────
router.get('/election/active', getActiveElection);
router.get('/candidates',      getAllCandidates);   // public — home page + voting page

// Voting
router.post('/vote/validate', [body('student_id').notEmpty(), body('voting_code').notEmpty()], validateCredentials);
router.post('/vote/submit',   [body('student_id').notEmpty(), body('voting_code').notEmpty(), body('election_id').isInt(), body('votes').isArray({ min:1 })], submitVotes);

// ── Admin ─────────────────────────────────────────────
router.get('/admin/dashboard', authenticateAdmin, getDashboardStats);

// Students
router.get ('/admin/students',              authenticateAdmin, getAllStudents);
router.get ('/admin/students/:id',          authenticateAdmin, getStudent);
router.post('/admin/students',              authenticateAdmin, [body('fullname').notEmpty(), body('student_id').notEmpty(), body('email').isEmail(), body('department').notEmpty(), body('level').notEmpty()], createStudent);
router.put ('/admin/students/:id',          authenticateAdmin, updateStudent);
router.delete('/admin/students/:id',        authenticateAdmin, deleteStudent);
router.post('/admin/students/:id/resend-email', authenticateAdmin, resendEmail);

// Candidates — use multer for image upload
router.get ('/admin/candidates',     authenticateAdmin, getAllCandidates);
router.get ('/admin/candidates/:id', authenticateAdmin, getCandidate);
router.post('/admin/candidates',     authenticateAdmin, upload.single('photo'), createCandidate);
router.put ('/admin/candidates/:id', authenticateAdmin, upload.single('photo'), updateCandidate);
router.delete('/admin/candidates/:id', authenticateAdmin, deleteCandidate);

// Elections
router.get ('/admin/elections',                    authenticateAdmin, getAllElections);
router.post('/admin/elections',                    authenticateAdmin, [body('title').notEmpty()], createElection);
router.put ('/admin/elections/:id/status',         authenticateAdmin, updateElectionStatus);
router.get ('/admin/elections/:id/results',        authenticateAdmin, getElectionResults);
router.get ('/elections/:id/results',              getElectionResults); // public

// Logs
router.get('/admin/logs',                 authenticateAdmin, getLogs);
router.get('/admin/logs/invalid-attempts',authenticateAdmin, getInvalidAttempts);

// Health
router.get('/health', (req, res) => res.json({ success:true, status:'online', timestamp:new Date() }));
>>>>>>> a01f1c1 (Initial commit - NUAITS Voting System)

module.exports = router;
