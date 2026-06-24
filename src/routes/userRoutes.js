const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} = require('../controllers/userController');

const router = express.Router();

// All user routes require authentication and admin role
router.get('/', verifyToken, authorizeRole('admin'), getAllUsers);
router.post('/', verifyToken, authorizeRole('admin'), createUser);
router.put('/:id', verifyToken, authorizeRole('admin'), updateUser);
router.delete('/:id', verifyToken, authorizeRole('admin'), deleteUser);

module.exports = router;
