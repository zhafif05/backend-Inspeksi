const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const { 
  validateLogin,
  handleValidationErrors 
} = require('../middleware/validation');
const { 
  login, 
  getProfile 
} = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/login', validateLogin, handleValidationErrors, login);

// Protected routes
router.get('/profile', verifyToken, getProfile);

module.exports = router;
