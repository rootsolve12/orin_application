const express = require('express');
const router = express.Router();
const collabController = require('../controllers/collabController');

router.post('/team/create', collabController.createTeam);
router.post('/team/join', collabController.joinTeam);
router.get('/team/user/:userId', collabController.getMyTeam);

router.get('/messages/:userId', collabController.getMessages);
router.post('/messages/send', collabController.sendMessage);

module.exports = router;
