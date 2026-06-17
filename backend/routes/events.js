const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');

router.get('/', eventsController.getEvents);
router.get('/:id', eventsController.getEventById);
router.post('/', eventsController.createEvent); // Organizer creation
router.get('/organizer/stats', eventsController.getOrganizerStats); // Organizer Dashboard
router.post('/:id/advance', eventsController.advanceRound);
router.post('/:eventId/register', eventsController.registerForEvent);
router.get('/user/:userId/registrations', eventsController.getUserRegistrations);

// Execution Engine
router.post('/:id/submit-assessment', eventsController.submitAssessment);
router.post('/:id/submit-project', eventsController.submitProject);
router.get('/:id/submissions', eventsController.getEventSubmissions);
router.post('/:id/submissions/:submissionId/evaluate', eventsController.evaluateSubmission);

module.exports = router;
