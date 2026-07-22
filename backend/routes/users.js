const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

router.get('/profile', verifyToken, userController.getProfile);
router.post('/profile', verifyToken, userController.updateProfile); // Added route to handle onboarding save

module.exports = router;

