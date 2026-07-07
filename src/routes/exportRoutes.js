const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const { exportDamagedEquipmentReport } = require('../controllers/exportController');

router.get(
  '/laporan-peralatan-rusak',
  verifyToken,
  authorizeRole('admin', 'kalab', 'teknisi', 'plp'),
  exportDamagedEquipmentReport
);

module.exports = router;
