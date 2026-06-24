const express = require('express');
const router = express.Router();
const inspectionCriteriaController = require('../controllers/inspectionCriteriaController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const { validateInspectionCategory, validateInspectionSubitem, validateInspectionCategoryWithSubitems, validateUpdateCategoryWithSubitems, handleValidationErrors } = require('../middleware/validation');

// ==================== KALAB: CREATE CRITERIA ====================

// Create inspection category (kalab/teknisi)
router.post(
  '/category/create',
  verifyToken,
  authorizeRole('admin', 'kalab'),
  validateInspectionCategory,
  handleValidationErrors,
  inspectionCriteriaController.createInspectionCategory
);

// Create inspection subitem (kalab/teknisi)
router.post(
  '/subitem/create',
  verifyToken,
  authorizeRole('admin', 'kalab'),
  validateInspectionSubitem,
  handleValidationErrors,
  inspectionCriteriaController.createInspectionSubitem
);

// Create category with subitems in one request
router.post(
  '/category-with-subitems/create',
  verifyToken,
  authorizeRole('admin', 'kalab'),
  validateInspectionCategoryWithSubitems,
  handleValidationErrors,
  inspectionCriteriaController.createInspectionCategoryWithSubitems
);

// Update rejected category (kalab/admin)
router.put(
  '/category/:id/update',
  verifyToken,
  authorizeRole('admin', 'kalab'),
  validateInspectionCategory,
  handleValidationErrors,
  inspectionCriteriaController.updateCategory
);

// Update rejected subitem (kalab/admin)
router.put(
  '/subitem/:id/update',
  verifyToken,
  authorizeRole('admin', 'kalab'),
  validateInspectionSubitem,
  handleValidationErrors,
  inspectionCriteriaController.updateSubitem
);

// Update rejected category with subitems (kalab/admin)
router.put(
  '/category-with-subitems/:id/update',
  verifyToken,
  authorizeRole('admin', 'kalab'),
  validateUpdateCategoryWithSubitems,
  handleValidationErrors,
  inspectionCriteriaController.updateCategoryWithSubitems
);

// ==================== KALAB: VIEW OWN CRITERIA ====================

// Get my criteria with subitems (kalab yang membuat)
router.get(
  '/my',
  verifyToken,
  authorizeRole('admin', 'kalab'),
  inspectionCriteriaController.getMyCriteriaWithSubitems
);

// Get pending categories (admin only)
router.get(
  '/category/pending',
  verifyToken,
  authorizeRole('admin'),
  inspectionCriteriaController.getPendingCategories
);

// Get pending subitems (admin only)
router.get(
  '/subitem/pending',
  verifyToken,
  authorizeRole('admin'),
  inspectionCriteriaController.getPendingSubitems
);

// Approve category (admin only)
router.put(
  '/category/:id/approve',
  verifyToken,
  authorizeRole('admin'),
  inspectionCriteriaController.approveCategory
);

// Reject category (admin only)
router.put(
  '/category/:id/reject',
  verifyToken,
  authorizeRole('admin'),
  inspectionCriteriaController.rejectCategory
);

// Approve subitem (admin only)
router.put(
  '/subitem/:id/approve',
  verifyToken,
  authorizeRole('admin'),
  inspectionCriteriaController.approveSubitem
);

// Reject subitem (admin only)
router.put(
  '/subitem/:id/reject',
  verifyToken,
  authorizeRole('admin'),
  inspectionCriteriaController.rejectSubitem
);

// Bulk approve categories with subitems (admin only)
router.put(
  '/categories/bulk-approve',
  verifyToken,
  authorizeRole('admin'),
  inspectionCriteriaController.bulkApproveCategories
);

// Bulk reject categories with subitems (admin only)
router.put(
  '/categories/bulk-reject',
  verifyToken,
  authorizeRole('admin'),
  inspectionCriteriaController.bulkRejectCategories
);

// ==================== ADMIN: DELETE CRITERIA ====================

// Delete category (admin only) — cascades to subitems
router.delete(
  '/category/:id',
  verifyToken,
  authorizeRole('admin'),
  inspectionCriteriaController.deleteCategory
);

// Delete subitem (admin only)
router.delete(
  '/subitem/:id',
  verifyToken,
  authorizeRole('admin'),
  inspectionCriteriaController.deleteSubitem
);

// ==================== PUBLIC: GET APPROVED CRITERIA ====================

// Get categories with subitems by item ID
router.get(
  '/item/:itemId',
  verifyToken,
  inspectionCriteriaController.getCategoriesByItemId
);

// Get approved categories with subitems (for inspection forms)
router.get(
  '/approved',
  verifyToken,
  inspectionCriteriaController.getApprovedCategoriesWithSubitems
);

module.exports = router;
