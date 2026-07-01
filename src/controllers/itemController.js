const pool = require('../config/database');

const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [items] = await pool.query('SELECT * FROM items WHERE id = ?', [id]);
    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Barang tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      data: items[0]
    });
  } catch (err) {
    next(err);
  }
};

const getAllItems = async (req, res, next) => {
  try {
    const [items] = await pool.query(
      `SELECT * FROM items ORDER BY created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: items,
      total: items.length
    });
  } catch (err) {
    next(err);
  }
};

const getItemsByLab = async (req, res, next) => {
  try {
    const { laboratoryId } = req.params;

    const [labs] = await pool.query(
      'SELECT item_ids FROM laboratories WHERE id = ?',
      [laboratoryId]
    );
    if (labs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorium tidak ditemukan'
      });
    }

    const itemIds = labs[0].item_ids ? labs[0].item_ids.split(',').map(Number) : [];
    if (itemIds.length === 0) {
      return res.status(200).json({ success: true, data: [], total: 0 });
    }

    const [items] = await pool.query(
      `SELECT * FROM items WHERE id IN (?) ORDER BY created_at DESC`,
      [itemIds]
    );

    res.status(200).json({
      success: true,
      data: items,
      total: items.length
    });
  } catch (err) {
    next(err);
  }
};

const getMyItems = async (req, res, next) => {
  try {
    if (!req.user.laboratory_id) {
      return res.status(200).json({ success: true, data: [], total: 0 });
    }

    const [labs] = await pool.query(
      'SELECT item_ids FROM laboratories WHERE id = ?',
      [req.user.laboratory_id]
    );
    if (labs.length === 0) {
      return res.status(200).json({ success: true, data: [], total: 0 });
    }

    const itemIds = labs[0].item_ids ? labs[0].item_ids.split(',').map(Number) : [];
    if (itemIds.length === 0) {
      return res.status(200).json({ success: true, data: [], total: 0 });
    }

    const [items] = await pool.query(
      `SELECT * FROM items WHERE id IN (?) ORDER BY created_at DESC`,
      [itemIds]
    );

    res.status(200).json({
      success: true,
      data: items,
      total: items.length
    });
  } catch (err) {
    next(err);
  }
};

const createItem = async (req, res, next) => {
  try {
    const { nama_barang, kode_barang, pembuat_alat, tanggal_pembelian, laboratory_id, tanggal_kalibrasi_terakhir,tanggal_kalibrasi_berikutnya } = req.body;

    if (!kode_barang) {
      return res.status(400).json({
        success: false,
        message: 'Kode barang harus diisi'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO items (nama_barang, kode_barang, pembuat_alat, tanggal_pembelian, tanggal_kalibrasi_terakhir, tanggal_kalibrasi_berikutnya) VALUES (?, ?, ?, ?, ?, ?)',
      [nama_barang, kode_barang, pembuat_alat || null, tanggal_pembelian || null, tanggal_kalibrasi_terakhir || null, tanggal_kalibrasi_berikutnya || null]
    );

    const newItemId = result.insertId;

    // Otomatis tambahkan item ke lab (prioritas dari body, fallback ke JWT)
    const targetLabId = laboratory_id || req.user.laboratory_id;
    if (targetLabId) {
      const [labs] = await pool.query('SELECT item_ids FROM laboratories WHERE id = ?', [targetLabId]);
      if (labs.length > 0) {
        const currentIds = labs[0].item_ids ? labs[0].item_ids.split(',').map(Number).filter(Boolean) : [];
        if (!currentIds.includes(newItemId)) {
          currentIds.push(newItemId);
          await pool.query('UPDATE laboratories SET item_ids = ? WHERE id = ?', [currentIds.join(','), targetLabId]);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Barang berhasil dibuat',
      data: {
        id: newItemId,
        nama_barang,
        kode_barang,
        pembuat_alat: pembuat_alat || null,
        tanggal_pembelian: tanggal_pembelian || null,
        tanggal_kalibrasi_terakhir: tanggal_kalibrasi_terakhir || null,
        tanggal_kalibrasi_berikutnya: tanggal_kalibrasi_berikutnya || null
      }
    });
  } catch (err) {
    next(err);
  }
};

// Update item (admin only)
const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nama_barang, kode_barang, pembuat_alat, tanggal_pembelian, tanggal_kalibrasi_terakhir, tanggal_kalibrasi_berikutnya } = req.body;

    // Check if item exists
    const [items] = await pool.query('SELECT id FROM items WHERE id = ?', [id]);
    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Barang tidak ditemukan'
      });
    }

    // Update item
    await pool.query(
      'UPDATE items SET nama_barang = ?, kode_barang = ?, pembuat_alat = ?, tanggal_pembelian = ?, tanggal_kalibrasi_terakhir = ?, tanggal_kalibrasi_berikutnya = ? WHERE id = ?',
      [nama_barang, kode_barang, pembuat_alat || null, tanggal_pembelian || null, tanggal_kalibrasi_terakhir || null, tanggal_kalibrasi_berikutnya || null, id]
    );

    res.status(200).json({
      success: true,
      message: 'Barang berhasil diperbarui'
    });
  } catch (err) {
    next(err);
  }
};

// Delete item (admin only)
const deleteItem = async (req, res, next) => {
  const conn = await pool.getConnection();

  try {
    const { id } = req.params;

    await conn.beginTransaction();

    // Cek item
    const [items] = await conn.query(
      'SELECT id FROM items WHERE id = ?',
      [id]
    );

    if (items.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: 'Barang tidak ditemukan'
      });
    }

    // Hapus item_id dari seluruh laboratorium
    const [labs] = await conn.query(
      'SELECT id, item_ids FROM laboratories WHERE item_ids IS NOT NULL'
    );

    for (const lab of labs) {
      const ids = lab.item_ids
        .split(',')
        .map(Number)
        .filter(Boolean);

      const filtered = ids.filter(i => i !== Number(id));

      if (filtered.length !== ids.length) {
        await conn.query(
          'UPDATE laboratories SET item_ids = ? WHERE id = ?',
          [filtered.join(','), lab.id]
        );
      }
    }

    // ==========================
    // HAPUS CATEGORY & SUBITEM
    // ==========================

    const [categories] = await conn.query(
      `SELECT id
       FROM inspection_categories
       WHERE item_id = ?`,
      [id]
    );

    for (const category of categories) {
      await conn.query(
        `DELETE FROM inspection_subitems
         WHERE category_id = ?`,
        [category.id]
      );
    }

    await conn.query(
      `DELETE FROM inspection_categories
       WHERE item_id = ?`,
      [id]
    );

    // ==========================
    // OPTIONAL
    // ==========================

    // Kalau punya tabel inspections
    await conn.query(
      `DELETE FROM inspections
       WHERE item_id = ?`,
      [id]
    );

    // Kalau punya tabel inspection_results
    // (hapus jika memang ada relasi)
    await conn.query(`
      DELETE ir
      FROM inspection_results ir
      JOIN inspections i
      ON ir.inspection_id = i.id
      WHERE i.item_id = ?
    `, [id]);

    // ==========================
    // HAPUS ITEM
    // ==========================

    await conn.query(
      'DELETE FROM items WHERE id = ?',
      [id]
    );

    await conn.commit();

    res.status(200).json({
      success: true,
      message: 'Barang berhasil dihapus'
    });

  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

module.exports = {
  getAllItems,
  getItemsByLab,
  getMyItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
};
