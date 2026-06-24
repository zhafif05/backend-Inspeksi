const pool = require('../config/database');

// ==================== KALAB: CREATE CRITERIA ====================

// Create inspection category (kalab/teknisi)
const createInspectionCategory = async (req, res, next) => {
  try {
    const { nama_kategori, deskripsi, urutan, item_id } = req.body;
    const kalabId = req.user.id;

    let laboratoryId;
    if (req.user.role === 'admin') {
      if (!req.body.laboratory_id) {
        return res.status(400).json({
          success: false,
          message: 'Admin harus mengisi laboratory_id'
        });
      }
      laboratoryId = req.body.laboratory_id;
    } else {
      laboratoryId = req.user.laboratory_id || null;
    }

    // Check duplicate
    const [existing] = await pool.query(
      `SELECT id FROM inspection_categories
       WHERE nama_kategori = ? AND (laboratory_id = ? OR (laboratory_id IS NULL AND created_by = ?))`,
      [nama_kategori, laboratoryId, kalabId]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Kategori "${nama_kategori}" sudah ada`
      });
    }

    const [result] = await pool.query(
      `INSERT INTO inspection_categories (nama_kategori, deskripsi, urutan, status, created_by, laboratory_id, item_id)
       VALUES (?, ?, ?, 'PENDING', ?, ?, ?)`,
      [nama_kategori, deskripsi, urutan, kalabId, laboratoryId, item_id || null]
    );

    res.status(201).json({
      success: true,
      message: 'Kategori inspeksi berhasil dibuat (Menunggu Persetujuan Admin)',
      data: {
        id: result.insertId,
        nama_kategori,
        deskripsi,
        urutan,
        status: 'PENDING',
        item_id: item_id || null,
        created_by: kalabId
      }
    });
  } catch (err) {
    next(err);
  }
};

// Create inspection subitem (kalab/teknisi)
const createInspectionSubitem = async (req, res, next) => {
  try {
    const { category_id, nama_subitem, deskripsi, urutan } = req.body;
    const kalabId = req.user.id;

    // Check if category exists
    const [categories] = await pool.query(
      'SELECT id FROM inspection_categories WHERE id = ?',
      [category_id]
    );
    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kategori tidak ditemukan'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO inspection_subitems (category_id, nama_subitem, deskripsi, urutan, status, created_by)
       VALUES (?, ?, ?, ?, 'PENDING', ?)`,
      [category_id, nama_subitem, deskripsi, urutan, kalabId]
    );

    res.status(201).json({
      success: true,
      message: 'Sub-item inspeksi berhasil dibuat (Menunggu Persetujuan Admin)',
      data: {
        id: result.insertId,
        category_id,
        nama_subitem,
        deskripsi,
        urutan,
        status: 'PENDING'
      }
    });
  } catch (err) {
    next(err);
  }
};

// Create category with subitems in one request
const createInspectionCategoryWithSubitems = async (req, res, next) => {
  try {
    const { categories, item_id } = req.body;
    const userId = req.user.id;

    let laboratoryId;
    if (req.user.role === 'admin') {
      if (!req.body.laboratory_id) {
        return res.status(400).json({
          success: false,
          message: 'Admin harus mengisi laboratory_id'
        });
      }
      laboratoryId = req.body.laboratory_id;
    } else {
      laboratoryId = req.user.laboratory_id || null;
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const createdCategories = [];

      for (const cat of categories) {
        const [catResult] = await connection.query(
          `INSERT INTO inspection_categories (nama_kategori, deskripsi, urutan, status, created_by, laboratory_id, item_id)
           VALUES (?, ?, ?, 'PENDING', ?, ?, ?)`,
          [cat.nama_kategori, cat.deskripsi || null, cat.urutan, userId, laboratoryId, item_id || null]
        );
        const categoryId = catResult.insertId;

        const subitemValues = cat.subitems.map(s => [
          categoryId, s.nama_subitem, s.deskripsi || null, s.urutan, 'PENDING', userId
        ]);
        await connection.query(
          `INSERT INTO inspection_subitems (category_id, nama_subitem, deskripsi, urutan, status, created_by)
           VALUES ?`,
          [subitemValues]
        );

        createdCategories.push({
          id: categoryId,
          nama_kategori: cat.nama_kategori,
          deskripsi: cat.deskripsi || null,
          urutan: cat.urutan,
          status: 'PENDING',
          item_id: item_id || null,
          subitems: cat.subitems.map((s, i) => ({
            id: categoryId + i + 1,
            category_id: categoryId,
            nama_subitem: s.nama_subitem,
            deskripsi: s.deskripsi || null,
            urutan: s.urutan,
            status: 'PENDING'
          }))
        });
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        message: `${categories.length} kategori dan sub-item berhasil dibuat (Menunggu Persetujuan Admin)`,
        data: createdCategories,
        total: createdCategories.length
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    next(err);
  }
};

// Update rejected category (kalab/admin)
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nama_kategori, deskripsi, urutan } = req.body;
    const userId = req.user.id;

    const [categories] = await pool.query(
      'SELECT id, status, created_by, laboratory_id FROM inspection_categories WHERE id = ?',
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    const cat = categories[0];

    if (req.user.role !== 'admin' && cat.created_by !== userId && req.user.laboratory_id !== cat.laboratory_id) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses' });
    }

    if (cat.status !== 'REJECTED') {
      return res.status(400).json({ success: false, message: 'Hanya kategori REJECTED yang bisa diperbarui' });
    }

    await pool.query(
      `UPDATE inspection_categories SET nama_kategori = ?, deskripsi = ?, urutan = ?, status = 'PENDING', alasan_penolakan = NULL WHERE id = ?`,
      [nama_kategori, deskripsi || null, urutan, id]
    );

    res.status(200).json({
      success: true,
      message: 'Kategori berhasil diperbarui (Menunggu Persetujuan Admin)'
    });
  } catch (err) {
    next(err);
  }
};

// Update rejected subitem (kalab/admin)
const updateSubitem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nama_subitem, deskripsi, urutan } = req.body;
    const userId = req.user.id;

    const [subitems] = await pool.query(
      `SELECT si.id, si.status, si.created_by, ic.id as category_id
       FROM inspection_subitems si
       JOIN inspection_categories ic ON si.category_id = ic.id
       WHERE si.id = ?`,
      [id]
    );

    if (subitems.length === 0) {
      return res.status(404).json({ success: false, message: 'Sub-item tidak ditemukan' });
    }

    const sub = subitems[0];

    if (req.user.role !== 'admin' && sub.created_by !== userId) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses' });
    }

    if (sub.status !== 'REJECTED') {
      return res.status(400).json({ success: false, message: 'Hanya sub-item REJECTED yang bisa diperbarui' });
    }

    await pool.query(
      `UPDATE inspection_subitems SET nama_subitem = ?, deskripsi = ?, urutan = ?, status = 'PENDING', alasan_penolakan = NULL WHERE id = ?`,
      [nama_subitem, deskripsi || null, urutan, id]
    );

    res.status(200).json({
      success: true,
      message: 'Sub-item berhasil diperbarui (Menunggu Persetujuan Admin)'
    });
  } catch (err) {
    next(err);
  }
};

// Update rejected category with subitems (kalab/admin)
const updateCategoryWithSubitems = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nama_kategori, deskripsi, urutan, subitems } = req.body;
    const userId = req.user.id;

    const [categories] = await pool.query(
      'SELECT id, status, created_by, laboratory_id FROM inspection_categories WHERE id = ?',
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    const cat = categories[0];

    if (req.user.role !== 'admin' && cat.created_by !== userId && req.user.laboratory_id !== cat.laboratory_id) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses' });
    }

    if (cat.status !== 'REJECTED') {
      return res.status(400).json({ success: false, message: 'Hanya kategori REJECTED yang bisa diperbarui' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE inspection_categories SET nama_kategori = ?, deskripsi = ?, urutan = ?, status = 'PENDING', alasan_penolakan = NULL WHERE id = ?`,
        [nama_kategori, deskripsi || null, urutan, id]
      );

      const existingIds = [];
      for (const s of subitems) {
        if (s.id) {
          await connection.query(
            `UPDATE inspection_subitems SET nama_subitem = ?, deskripsi = ?, urutan = ?, status = 'PENDING', alasan_penolakan = NULL WHERE id = ? AND category_id = ?`,
            [s.nama_subitem, s.deskripsi || null, s.urutan, s.id, id]
          );
          existingIds.push(s.id);
        } else {
          const [result] = await connection.query(
            `INSERT INTO inspection_subitems (category_id, nama_subitem, deskripsi, urutan, status, created_by) VALUES (?, ?, ?, ?, 'PENDING', ?)`,
            [id, s.nama_subitem, s.deskripsi || null, s.urutan, userId]
          );
          existingIds.push(result.insertId);
        }
      }

      await connection.query(
        `DELETE FROM inspection_subitems WHERE category_id = ? AND id NOT IN (?)`,
        [id, existingIds.length > 0 ? existingIds : [0]]
      );

      await connection.commit();

      res.status(200).json({
        success: true,
        message: 'Kategori dan sub-item berhasil diperbarui (Menunggu Persetujuan Admin)'
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    next(err);
  }
};

// ==================== KALAB: VIEW OWN CRITERIA ====================

// Get my categories with subitems (kalab yang membuat)
const getMyCriteriaWithSubitems = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [categories] = await pool.query(
      `SELECT id, nama_kategori, deskripsi, urutan, status, alasan_penolakan, item_id
       FROM inspection_categories
       WHERE created_by = ?
       ORDER BY urutan ASC`,
      [userId]
    );

    const categoriesWithItems = await Promise.all(
      categories.map(async (cat) => {
        const [subitems] = await pool.query(
          `SELECT id, nama_subitem, deskripsi, urutan, status, alasan_penolakan
           FROM inspection_subitems
           WHERE category_id = ?
           ORDER BY urutan ASC`,
          [cat.id]
        );
        return { ...cat, subitems };
      })
    );

    res.status(200).json({
      success: true,
      data: categoriesWithItems,
      total: categoriesWithItems.length
    });
  } catch (err) {
    next(err);
  }
};

// Get pending categories (admin only)
const getPendingCategories = async (req, res, next) => {
  try {
    const [categories] = await pool.query(
      `SELECT c.*, u.name as created_by_name, l.nama_lab
       FROM inspection_categories c
       LEFT JOIN users u ON c.created_by = u.id
       LEFT JOIN laboratories l ON c.laboratory_id = l.id
       WHERE c.status = 'PENDING'
       ORDER BY c.created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: categories,
      total: categories.length
    });
  } catch (err) {
    next(err);
  }
};

// Get pending subitems (admin only)
const getPendingSubitems = async (req, res, next) => {
  try {
    const [subitems] = await pool.query(
       `SELECT si.*, ic.nama_kategori, ic.laboratory_id, u.name as created_by_name
        FROM inspection_subitems si
        JOIN inspection_categories ic ON si.category_id = ic.id
        LEFT JOIN users u ON si.created_by = u.id
        WHERE si.status = 'PENDING'
       ORDER BY si.created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: subitems,
      total: subitems.length
    });
  } catch (err) {
    next(err);
  }
};

// Approve category (admin only)
const approveCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category exists and pending
    const [categories] = await pool.query(
      'SELECT id, status FROM inspection_categories WHERE id = ?',
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kategori tidak ditemukan'
      });
    }

    if (!['PENDING', 'REJECTED'].includes(categories[0].status)) {
      return res.status(400).json({
        success: false,
        message: `Kategori sudah memiliki status: ${categories[0].status}`
      });
    }

    // Update status to APPROVED
    await pool.query(
      'UPDATE inspection_categories SET status = ?, alasan_penolakan = NULL WHERE id = ?',
      ['APPROVED', id]
    );

    res.status(200).json({
      success: true,
      message: 'Kategori inspeksi berhasil disetujui'
    });
  } catch (err) {
    next(err);
  }
};

// Reject category (admin only)
const rejectCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { alasan_penolakan } = req.body;

    // Check if category exists and pending
    const [categories] = await pool.query(
      'SELECT id, status FROM inspection_categories WHERE id = ?',
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kategori tidak ditemukan'
      });
    }

    if (!['PENDING', 'APPROVED'].includes(categories[0].status)) {
      return res.status(400).json({
        success: false,
        message: `Kategori sudah memiliki status: ${categories[0].status}`
      });
    }

    // Update status to REJECTED
    await pool.query(
      'UPDATE inspection_categories SET status = ?, alasan_penolakan = ? WHERE id = ?',
      ['REJECTED', alasan_penolakan || null, id]
    );

    res.status(200).json({
      success: true,
      message: 'Kategori inspeksi berhasil ditolak',
      alasan: alasan_penolakan
    });
  } catch (err) {
    next(err);
  }
};

// Approve subitem (admin only)
const approveSubitem = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if subitem exists and pending
    const [subitems] = await pool.query(
      'SELECT id, status FROM inspection_subitems WHERE id = ?',
      [id]
    );

    if (subitems.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sub-item tidak ditemukan'
      });
    }

    if (subitems[0].status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Sub-item sudah memiliki status: ${subitems[0].status}`
      });
    }

    // Update status to APPROVED
    await pool.query(
      'UPDATE inspection_subitems SET status = ? WHERE id = ?',
      ['APPROVED', id]
    );

    res.status(200).json({
      success: true,
      message: 'Sub-item inspeksi berhasil disetujui'
    });
  } catch (err) {
    next(err);
  }
};

// Reject subitem (admin only)
const rejectSubitem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { alasan_penolakan } = req.body;

    // Check if subitem exists and pending
    const [subitems] = await pool.query(
      'SELECT id, status FROM inspection_subitems WHERE id = ?',
      [id]
    );

    if (subitems.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sub-item tidak ditemukan'
      });
    }

    if (subitems[0].status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Sub-item sudah memiliki status: ${subitems[0].status}`
      });
    }

    // Update status to REJECTED
    await pool.query(
      'UPDATE inspection_subitems SET status = ?, alasan_penolakan = ? WHERE id = ?',
      ['REJECTED', alasan_penolakan || null, id]
    );

    res.status(200).json({
      success: true,
      message: 'Sub-item inspeksi berhasil ditolak',
      alasan: alasan_penolakan
    });
  } catch (err) {
    next(err);
  }
};

// ==================== PUBLIC: GET APPROVED CRITERIA ====================

// Get approved categories with subitems (for inspection forms)
const getApprovedCategoriesWithSubitems = async (req, res, next) => {
  try {
    const laboratoryId = req.user.laboratory_id;

    let categoryQuery;
    let queryParams;

    if (laboratoryId) {
      categoryQuery = `SELECT c.id, c.nama_kategori, c.deskripsi, c.urutan, c.item_id
       FROM inspection_categories c
       WHERE c.status = 'APPROVED' AND (c.laboratory_id = ? OR c.laboratory_id IS NULL)
       ORDER BY c.urutan ASC`;
      queryParams = [laboratoryId];
    } else {
      categoryQuery = `SELECT c.id, c.nama_kategori, c.deskripsi, c.urutan, c.item_id
       FROM inspection_categories c
       WHERE c.status = 'APPROVED'
       ORDER BY c.urutan ASC`;
      queryParams = [];
    }

    const [categories] = await pool.query(categoryQuery, queryParams);

    // Get approved subitems for each category
    const categoriesWithItems = await Promise.all(
      categories.map(async (cat) => {
        const [subitems] = await pool.query(
          `SELECT id, nama_subitem, deskripsi, urutan
           FROM inspection_subitems
           WHERE category_id = ? AND status = 'APPROVED'
           ORDER BY urutan ASC`,
          [cat.id]
        );
        return { ...cat, subitems };
      })
    );

    res.status(200).json({
      success: true,
      data: categoriesWithItems,
      total: categoriesWithItems.length
    });
  } catch (err) {
    next(err);
  }
};

// Get categories with subitems by item ID
const getCategoriesByItemId = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const [categories] = await pool.query(
      `SELECT id, nama_kategori, deskripsi, urutan, item_id, status, alasan_penolakan
       FROM inspection_categories
       WHERE item_id = ?
       ORDER BY urutan ASC`,
      [itemId]
    );

    const categoriesWithItems = await Promise.all(
      categories.map(async (cat) => {
        const [subitems] = await pool.query(
          `SELECT id, nama_subitem, deskripsi, urutan, status, alasan_penolakan
           FROM inspection_subitems
           WHERE category_id = ?
           ORDER BY urutan ASC`,
          [cat.id]
        );
        return { ...cat, subitems };
      })
    );

    res.status(200).json({
      success: true,
      data: categoriesWithItems,
      total: categoriesWithItems.length
    });
  } catch (err) {
    next(err);
  }
};

// Bulk approve categories with subitems (admin only)
const bulkApproveCategories = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Daftar ID kategori harus diisi'
      });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update categories
      const [catResult] = await connection.query(
        `UPDATE inspection_categories SET status = 'APPROVED'
         WHERE id IN (?) AND status = 'PENDING'`,
        [ids]
      );

      // Update subitems under those categories
      await connection.query(
        `UPDATE inspection_subitems SET status = 'APPROVED'
         WHERE category_id IN (?) AND status = 'PENDING'`,
        [ids]
      );

      await connection.commit();

      res.status(200).json({
        success: true,
        message: `${catResult.affectedRows} kategori dan sub-item berhasil disetujui`
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    next(err);
  }
};

// Bulk reject categories with subitems (admin only)
const bulkRejectCategories = async (req, res, next) => {
  try {
    const { ids, alasan_penolakan } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Daftar ID kategori harus diisi'
      });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update categories
      const [catResult] = await connection.query(
        `UPDATE inspection_categories SET status = 'REJECTED', alasan_penolakan = ?
         WHERE id IN (?) AND status = 'PENDING'`,
        [alasan_penolakan || null, ids]
      );

      // Update subitems under those categories
      await connection.query(
        `UPDATE inspection_subitems SET status = 'REJECTED', alasan_penolakan = ?
         WHERE category_id IN (?) AND status = 'PENDING'`,
        [alasan_penolakan || null, ids]
      );

      await connection.commit();

      res.status(200).json({
        success: true,
        message: `${catResult.affectedRows} kategori dan sub-item berhasil ditolak`,
        alasan: alasan_penolakan
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    next(err);
  }
};

// Delete category (admin only) — cascades to subitems
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [categories] = await pool.query(
      'SELECT id FROM inspection_categories WHERE id = ?',
      [id]
    );
    if (categories.length === 0) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    await pool.query('DELETE FROM inspection_categories WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Kategori beserta sub-item berhasil dihapus'
    });
  } catch (err) {
    next(err);
  }
};

// Delete subitem (admin only)
const deleteSubitem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [subitems] = await pool.query(
      'SELECT id FROM inspection_subitems WHERE id = ?',
      [id]
    );
    if (subitems.length === 0) {
      return res.status(404).json({ success: false, message: 'Sub-item tidak ditemukan' });
    }

    await pool.query('DELETE FROM inspection_subitems WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Sub-item berhasil dihapus'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createInspectionCategory,
  createInspectionSubitem,
  createInspectionCategoryWithSubitems,
  updateCategory,
  updateSubitem,
  getMyCriteriaWithSubitems,
  getPendingCategories,
  getPendingSubitems,
  approveCategory,
  rejectCategory,
  approveSubitem,
  rejectSubitem,
  getApprovedCategoriesWithSubitems,
  getCategoriesByItemId,
  bulkApproveCategories,
  bulkRejectCategories,
  updateCategoryWithSubitems,
  deleteCategory,
  deleteSubitem
};
