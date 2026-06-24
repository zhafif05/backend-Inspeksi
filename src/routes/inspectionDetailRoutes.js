const express = require('express');
const router = express.Router();
const inspectionDetailController = require('../controllers/inspectionDetailController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const { validateRejectReview, handleValidationErrors } = require('../middleware/validation');
const multerUpload = require('../middleware/multerConfig');
const { exportInspection, exportAllCompleted, checkLabInspectionsStatus, exportLabItems } = require('../controllers/exportController');

// Create inspection with checklist (kalab + admin)
router.post(
  '/create',
  verifyToken,
  authorizeRole('admin', 'kalab'),
  multerUpload.single('foto'),
  inspectionDetailController.createInspectionWithChecklist
);

// Get inspection detail with results
router.get('/detail/:id', verifyToken, inspectionDetailController.getInspectionDetail);

// Get inspections by month
router.get('/month/:bulan_ke', verifyToken, inspectionDetailController.getInspectionsByMonth);

// Update all inspection results at once (bulk)
router.put(
  '/:id/results',
  verifyToken,
  authorizeRole('admin', 'kalab'),
  inspectionDetailController.updateInspectionResults
);

// Update inspection result
router.put(
  '/result/:resultId',
  verifyToken,
  authorizeRole('admin', 'kalab'),
  inspectionDetailController.updateInspectionResult
);

// Get all results by approval status (admin only)
router.get(
  '/results/status',
  verifyToken,
  authorizeRole('admin'),
  inspectionDetailController.getResultsByStatus
);

// Approve monthly results (admin only)
router.put(
  '/:id/approve-month/:bulan_ke',
  verifyToken,
  authorizeRole('admin'),
  inspectionDetailController.approveMonthlyResults
);

// Reject monthly results (admin only)
router.put(
  '/:id/reject-month/:bulan_ke',
  verifyToken,
  authorizeRole('admin'),
  validateRejectReview,
  handleValidationErrors,
  inspectionDetailController.rejectMonthlyResults
);

// Get distinct (tahun, semester) pairs for a lab
router.get(
  '/lab/:laboratoryId/semesters',
  verifyToken,
  inspectionDetailController.getLabSemesters
);

// Get all pending reviews (admin only)
router.get(
  '/pending-reviews',
  verifyToken,
  authorizeRole('admin'),
  inspectionDetailController.getPendingReviews
);

// ==================== PER-ITEM APPROVAL ====================

// Approve individual result item (admin only)
router.put(
  '/result/:resultId/approve',
  verifyToken,
  authorizeRole('admin'),
  inspectionDetailController.approveResultItem
);

// Reject individual result item (admin only)
router.put(
  '/result/:resultId/reject',
  verifyToken,
  authorizeRole('admin'),
  inspectionDetailController.rejectResultItem
);

// ==================== BULK APPROVAL ====================

// Bulk approve multiple result items (admin only)
router.put(
  '/results/bulk-approve',
  verifyToken,
  authorizeRole('admin'),
  inspectionDetailController.bulkApproveResults
);

// Bulk reject multiple result items (admin only)
router.put(
  '/results/bulk-reject',
  verifyToken,
  authorizeRole('admin'),
  inspectionDetailController.bulkRejectResults
);

// Check if inspection exists by item ID
router.get(
  '/by-item/:item_id',
  verifyToken,
  inspectionDetailController.checkInspectionByItemId
);

// ==================== KALAB DASHBOARD ====================

// Get my pending/rejected inspections (kalab)
router.get(
  '/my-pending',
  verifyToken,
  inspectionDetailController.getMyPendingInspections
);

// Delete inspection
router.delete(
  '/:id',
  verifyToken,
  authorizeRole('admin'),
  inspectionDetailController.deleteInspection
);

// ==================== EXPORT ====================

// Check lab inspections status before export
router.get(
  '/check-lab-status',
  verifyToken,
  checkLabInspectionsStatus
);

// Export single inspection to Excel
router.get(
  '/export/:id',
  verifyToken,
  authorizeRole('admin', 'kalab'),
  exportInspection
);

// Export all items in lab to multiple sheets
router.get(
  '/export-lab',
  verifyToken,
  authorizeRole('admin', 'kalab'),
  exportLabItems
);

// Export all completed inspections (6 months) to Excel
router.get(
  '/export-all',
  verifyToken,
  authorizeRole('admin', 'kalab'),
  exportAllCompleted
);


module.exports = router;
