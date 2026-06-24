const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const {
  validateSchedule,
  handleValidationErrors
} = require('../middleware/validation');
const {
  getAllSchedules,
  getSchedulesByLab,
  createSchedule,
  updateSchedule,
  deleteSchedule
} = require('../controllers/scheduleController');

const router = express.Router();

// Get all schedules (accessible to both admin and kalab)
router.get('/', verifyToken, getAllSchedules);

// Get schedules by laboratory
router.get('/lab/:laboratoryId', verifyToken, getSchedulesByLab);

// Create schedule (admin only)
router.post('/',
  verifyToken,
  authorizeRole('admin'),
  validateSchedule,
  handleValidationErrors,
  createSchedule
);

// Update schedule (admin only)
router.put('/:id',
  verifyToken,
  authorizeRole('admin'),
  validateSchedule,
  handleValidationErrors,
  updateSchedule
);

// Delete schedule (admin only)
router.delete('/:id',
  verifyToken,
  authorizeRole('admin'),
  deleteSchedule
);

module.exports = router;
