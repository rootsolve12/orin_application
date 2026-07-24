const express = require('express');
const router = express.Router();
const collabController = require('../controllers/collabController');
const { verifyToken } = require('../middleware/auth');

router.post('/team/create', verifyToken, collabController.createTeam);
router.post('/team/join', verifyToken, collabController.joinTeam);
router.get('/team/user/:userId', verifyToken, collabController.getMyTeam);
router.post('/team/leave/:userId', verifyToken, collabController.leaveTeam);
router.delete('/team/:teamId', verifyToken, collabController.deleteTeam);

router.get('/messages/:userId', verifyToken, collabController.getMessages);
router.post('/messages/send', verifyToken, collabController.sendMessage);

module.exports = router;
