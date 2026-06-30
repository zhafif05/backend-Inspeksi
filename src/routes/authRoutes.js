const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const { 
  validateLogin,
  handleValidationErrors 
} = require('../middleware/validation');
const { 
  login, 
  getProfile,
  updateProfile
} = require('../controllers/authController');
const { loginLimiter } = require("../middleware/rateLimit");
const router = express.Router();

// Public routes
router.post('/login', validateLogin, handleValidationErrors, loginLimiter, login);

// Protected routes
router.get('/profile', verifyToken, getProfile);

router.put("/profile", verifyToken, updateProfile);

module.exports = router;
