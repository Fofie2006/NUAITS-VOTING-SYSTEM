const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Controllers
const { login, changePassword } = require('../controllers/authController');
const { getAllStudents, getStudent, createStudent, updateStudent, deleteStudent, resendEmail, getDashboardStats } = require('../controllers/studentsController');
const { getAllCandidates, getCandidate, createCandidate, updateCandidate, deleteCandidate } = require('../controllers/candidatesController');
const { getAllElections, getActiveElection, createElection, updateElectionStatus, getElectionResults } = require('../controllers/electionsController');
const { validateCredentials, submitVotes } = require('../controllers/votingController');
const { getLogs, getInvalidAttempts } = require('../controllers/logsController');

// AUTH
router.post('/auth/login',
  [body('username').notEmpty(), body('password').notEmpty()],
  login
);

router.put('/auth/change-password',
  authenticateAdmin,
  changePassword
);

// PUBLIC
router.get('/election/active', getActiveElection);
router.get('/candidates', getAllCandidates);

// VOTING
router.post('/vote/validate',
  [body('student_id').notEmpty(), body('voting_code').notEmpty()],
  validateCredentials
);

router.post('/vote/submit',
  [
    body('student_id').notEmpty(),
    body('voting_code').notEmpty(),
    body('election_id').isInt(),
    body('votes').isArray({ min: 1 })
  ],
  submitVotes
);

// ADMIN DASHBOARD
router.get('/admin/dashboard', authenticateAdmin, getDashboardStats);

// STUDENTS
router.get('/admin/students', authenticateAdmin, getAllStudents);
router.get('/admin/students/:id', authenticateAdmin, getStudent);

router.post('/admin/students',
  authenticateAdmin,
  [
    body('fullname').notEmpty(),
    body('student_id').notEmpty(),
    body('email').isEmail(),
    body('department').notEmpty(),
    body('level').notEmpty()
  ],
  createStudent
);

router.put('/admin/students/:id', authenticateAdmin, updateStudent);
router.delete('/admin/students/:id', authenticateAdmin, deleteStudent);
router.post('/admin/students/:id/resend-email', authenticateAdmin, resendEmail);

// CANDIDATES (WITH UPLOADS)
router.get('/admin/candidates', authenticateAdmin, getAllCandidates);
router.get('/admin/candidates/:id', authenticateAdmin, getCandidate);

router.post(
  '/admin/candidates',
  authenticateAdmin,
  upload.single('photo'),
  createCandidate
);

router.put(
  '/admin/candidates/:id',
  authenticateAdmin,
  upload.single('photo'),
  updateCandidate
);

router.delete('/admin/candidates/:id', authenticateAdmin, deleteCandidate);

// ELECTIONS
router.get('/admin/elections', authenticateAdmin, getAllElections);

router.post('/admin/elections',
  authenticateAdmin,
  [body('title').notEmpty()],
  createElection
);

router.put('/admin/elections/:id/status', authenticateAdmin, updateElectionStatus);
router.get('/admin/elections/:id/results', authenticateAdmin, getElectionResults);
router.get('/elections/:id/results', getElectionResults);

// LOGS
router.get('/admin/logs', authenticateAdmin, getLogs);
router.get('/admin/logs/invalid-attempts', authenticateAdmin, getInvalidAttempts);

// HEALTH
router.get('/health', (req, res) =>
  res.json({ success: true, status: 'online', timestamp: new Date() })
);

module.exports = router;