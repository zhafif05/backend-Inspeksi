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
    const { nama_barang, kode_barang, pembuat_alat, tanggal_pembelian, laboratory_id } = req.body;

    if (!kode_barang) {
      return res.status(400).json({
        success: false,
        message: 'Kode barang harus diisi'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO items (nama_barang, kode_barang, pembuat_alat, tanggal_pembelian) VALUES (?, ?, ?, ?)',
      [nama_barang, kode_barang, pembuat_alat || null, tanggal_pembelian || null]
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
        tanggal_pembelian: tanggal_pembelian || null
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
    const { nama_barang, kode_barang, pembuat_alat, tanggal_pembelian } = req.body;

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
      'UPDATE items SET nama_barang = ?, kode_barang = ?, pembuat_alat = ?, tanggal_pembelian = ? WHERE id = ?',
      [nama_barang, kode_barang, pembuat_alat || null, tanggal_pembelian || null, id]
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
  try {
    const { id } = req.params;

    // Check if item exists
    const [items] = await pool.query('SELECT id FROM items WHERE id = ?', [id]);
    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Barang tidak ditemukan'
      });
    }

    // Hapus item_id dari semua lab yang mereferensi
    const [labs] = await pool.query('SELECT id, item_ids FROM laboratories WHERE item_ids IS NOT NULL');
    for (const lab of labs) {
      const ids = lab.item_ids.split(',').map(Number).filter(Boolean);
      const filtered = ids.filter((iid) => iid !== Number(id));
      if (filtered.length !== ids.length) {
        await pool.query('UPDATE laboratories SET item_ids = ? WHERE id = ?', [filtered.join(','), lab.id]);
      }
    }

    // Delete item
    await pool.query('DELETE FROM items WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Barang berhasil dihapus'
    });
  } catch (err) {
    next(err);
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
