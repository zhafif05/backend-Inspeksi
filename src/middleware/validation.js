const { body, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validasi input gagal',
      errors: errors.array()
    });
  }
  next();
};

// Auth Validations
const validateLogin = [
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').notEmpty().withMessage('Password harus diisi')
];

// Laboratory Validations
const validateLaboratory = [
  body('nama_lab').trim().notEmpty().withMessage('Nama laboratorium harus diisi'),
  body('lokasi').trim().notEmpty().withMessage('Lokasi harus diisi'),
  body('kalab_id').optional().isInt().withMessage('Kalab ID harus angka')
];

// Item Validations
const validateItem = [
  body('nama_barang').trim().notEmpty().withMessage('Nama barang harus diisi'),
  body('kode_barang').trim().notEmpty().withMessage('Kode barang harus diisi'),
  body('pembuat_alat').trim().optional(),
  body('tanggal_pembelian').optional({ checkFalsy: true }).isDate().withMessage('Tanggal pembelian format tidak valid (YYYY-MM-DD)')
];

// Inspection Validations
const validateInspection = [
  body('laboratory_id').isInt().withMessage('Laboratory ID harus angka'),
  body('item_id').isInt().withMessage('Item ID harus angka'),
  body('bulan_ke').isInt({ min: 1, max: 6 }).withMessage('Bulan ke harus 1-6 (1 semester)'),
  body('status').isIn(['B', 'K', 'N/A']).withMessage('Status harus B, K, atau N/A'),
  body('kondisi').trim().notEmpty().withMessage('Kondisi harus diisi'),
  body('catatan').trim().notEmpty().withMessage('Catatan harus diisi')
];

// Schedule Validations
const validateSchedule = [
  body('laboratory_id').isInt().withMessage('Laboratory ID harus angka'),
  body('tanggal').isISO8601().withMessage('Tanggal tidak valid'),
  body('keterangan').trim().notEmpty().withMessage('Keterangan harus diisi')
];

// Inspection Criteria Validations
const validateInspectionCategory = [
  body('nama_kategori').trim().notEmpty().withMessage('Nama kategori harus diisi'),
  body('deskripsi').trim().optional(),
  body('urutan').isInt({ min: 1 }).withMessage('Urutan harus angka positif'),
  body('laboratory_id').optional().isInt().withMessage('Laboratory ID harus angka'),
  body('item_id').optional().isInt().withMessage('Item ID harus angka')
];

const validateInspectionSubitem = [
  body('category_id').isInt().withMessage('Category ID harus angka'),
  body('nama_subitem').trim().notEmpty().withMessage('Nama sub-item harus diisi'),
  body('deskripsi').trim().optional(),
  body('urutan').isInt({ min: 1 }).withMessage('Urutan harus angka positif')
];

const validateInspectionCategoryWithSubitems = [
  body('categories').isArray({ min: 1 }).withMessage('Minimal 1 kategori'),
  body('categories.*.nama_kategori').trim().notEmpty().withMessage('Nama kategori harus diisi'),
  body('categories.*.deskripsi').trim().optional(),
  body('categories.*.urutan').isInt({ min: 1 }).withMessage('Urutan kategori harus angka positif'),
  body('categories.*.subitems').isArray({ min: 1 }).withMessage('Minimal 1 sub-item per kategori'),
  body('item_id').optional().isInt().withMessage('Item ID harus angka'),
  body('categories.*.subitems.*.nama_subitem').trim().notEmpty().withMessage('Nama sub-item harus diisi'),
  body('categories.*.subitems.*.deskripsi').trim().optional(),
  body('categories.*.subitems.*.urutan').isInt({ min: 1 }).withMessage('Urutan sub-item harus angka positif'),
  body('laboratory_id').optional().isInt().withMessage('Laboratory ID harus angka')
];

const validateUpdateCategoryWithSubitems = [
  body('nama_kategori').trim().notEmpty().withMessage('Nama kategori harus diisi'),
  body('deskripsi').trim().optional(),
  body('urutan').isInt({ min: 1 }).withMessage('Urutan harus angka positif'),
  body('subitems').isArray({ min: 1 }).withMessage('Minimal 1 sub-item'),
  body('subitems.*.nama_subitem').trim().notEmpty().withMessage('Nama sub-item harus diisi'),
  body('subitems.*.deskripsi').trim().optional(),
  body('subitems.*.urutan').isInt({ min: 1 }).withMessage('Urutan sub-item harus angka positif'),
  body('subitems.*.id').optional().isInt().withMessage('ID sub-item harus angka')
];

// Review Validations
const validateRejectReview = [
  body('alasan_penolakan').trim().notEmpty().withMessage('Alasan penolakan harus diisi')
];

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateLaboratory,
  validateItem,
  validateInspection,
  validateSchedule,
  validateInspectionCategory,
  validateInspectionSubitem,
  validateInspectionCategoryWithSubitems,
  validateUpdateCategoryWithSubitems,
  validateRejectReview
};
