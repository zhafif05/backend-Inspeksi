const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const {
  validateLaboratory,
  handleValidationErrors
} = require('../middleware/validation');
const {
  getAllLaboratories,
  createLaboratory,
  updateLaboratory,
  deleteLaboratory
} = require('../controllers/laboratoryController');

const router = express.Router();

// Get all laboratories (accessible to both admin and kalab)
router.get('/', verifyToken, getAllLaboratories);

// Create laboratory (admin only)
router.post('/', 
  verifyToken, 
  authorizeRole('admin'),
  validateLaboratory,
  handleValidationErrors,
  createLaboratory
);

// Update laboratory (admin only)
router.put('/:id',
  verifyToken,
  authorizeRole('admin'),
  validateLaboratory,
  handleValidationErrors,
  updateLaboratory
);

// Delete laboratory (admin only)
router.delete('/:id',
  verifyToken,
  authorizeRole('admin'),
  deleteLaboratory
);

module.exports = router;
