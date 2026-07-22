const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Public routes
router.get('/', eventsController.getEvents);
router.get('/:id', eventsController.getEventById);

// Protected routes (Any auth user)
router.post('/:eventId/register', verifyToken, eventsController.registerForEvent);
router.get('/user/:userId/registrations', verifyToken, eventsController.getUserRegistrations);
router.post('/:id/submit-assessment', verifyToken, eventsController.submitAssessment);
router.post('/:id/submit-project', verifyToken, eventsController.submitProject);

// Organizer/Admin only routes
router.post('/', verifyToken, requireRole(['organizer', 'admin']), eventsController.createEvent);
router.get('/organizer/stats', verifyToken, requireRole(['organizer', 'admin']), eventsController.getOrganizerStats);
router.post('/:id/advance', verifyToken, requireRole(['organizer', 'admin']), eventsController.advanceRound);
router.get('/:id/submissions', verifyToken, requireRole(['organizer', 'admin']), eventsController.getEventSubmissions);
router.post('/:id/submissions/:submissionId/evaluate', verifyToken, requireRole(['organizer', 'admin']), eventsController.evaluateSubmission);

module.exports = router;

