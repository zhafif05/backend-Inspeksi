const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const {
  validateItem,
  handleValidationErrors
} = require('../middleware/validation');
const {
  getAllItems,
  getItemsByLab,
  getMyItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getCalibrationAlerts
} = require('../controllers/itemController');

const router = express.Router();

// Get all items
router.get('/', verifyToken, getAllItems);

// Get items by laboratory
router.get('/lab/:laboratoryId', verifyToken, getItemsByLab);

// Get my items (items created by logged-in user)
router.get('/my', verifyToken, getMyItems);

router.get(
    "/calibration-alerts",
    verifyToken,
    authorizeRole("admin"),
    getCalibrationAlerts
);

// Get item by ID
router.get('/:id', verifyToken, getItemById);

// Create item (admin & kalab)
router.post('/',
  verifyToken,
  authorizeRole('admin', 'kalab', 'teknisi', 'plp'),
  createItem
);

// Update item (admin & kalab)
router.put('/:id',
  verifyToken,
  authorizeRole('admin', 'kalab', 'teknisi', 'plp'),
  updateItem
);

// Delete item (admin & kalab)
router.delete('/:id',
  verifyToken,
  authorizeRole('admin', 'kalab', 'teknisi', 'plp'),
  deleteItem
);


module.exports = router;
