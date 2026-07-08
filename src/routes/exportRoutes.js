const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const { exportDamagedEquipmentReport, exportRepairEquipmentReport,getExportReportStatus } = require('../controllers/exportController');

router.get(
  '/laporan-peralatan-rusak',
  verifyToken,
  authorizeRole('admin', 'kalab', 'teknisi', 'plp'),
  exportDamagedEquipmentReport
);

router.get(
  '/repair-equipment',
  verifyToken,
  authorizeRole('admin', 'kalab', 'teknisi', 'plp'),
  exportRepairEquipmentReport
);

router.get(
  "/report-status",
  verifyToken,
  getExportReportStatus
);

module.exports = router;
