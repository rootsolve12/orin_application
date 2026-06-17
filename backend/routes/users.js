const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/profile', userController.getProfile);
router.post('/profile', userController.updateProfile); // Added route to handle onboarding save

module.exports = router;
