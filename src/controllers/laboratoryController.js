const pool = require('../config/database');

const getAllLaboratories = async (req, res, next) => {
  try {
    const [labs] = await pool.query(
      `SELECT l.id, l.nama_lab, l.lokasi, l.kalab_id,
              u.name as penanggung_jawab, u.name as kalab_name, u.nip as nip_penanggung_jawab,
              l.item_ids, l.created_at, l.updated_at
       FROM laboratories l
       LEFT JOIN users u ON l.kalab_id = u.id
       ORDER BY l.created_at DESC`
    );

    // Ambil detail items dari item_ids (CSV)
    for (const lab of labs) {
      const ids = lab.item_ids ? lab.item_ids.split(',').map(Number) : [];
      if (ids.length > 0) {
        const [items] = await pool.query(
          `SELECT id, nama_barang, kode_barang
            FROM items WHERE id IN (?) ORDER BY nama_barang`,
          [ids]
        );
        lab.items = items;
      } else {
        lab.items = [];
      }
    }

    res.status(200).json({
      success: true,
      data: labs,
      total: labs.length
    });
  } catch (err) {
    next(err);
  }
};

const createLaboratory = async (req, res, next) => {
  try {
    const { nama_lab, lokasi, kalab_id, plp1_id, plp2_id, item_ids } = req.body;

    if (kalab_id) {
      const [users] = await pool.query(
        'SELECT id FROM users WHERE id = ? AND role = ?',
        [kalab_id, 'kalab']
      );
      // Validasi PLP 1
      if (plp1_id) {

        const [users] = await pool.query(
          'SELECT id FROM users WHERE id = ? AND role = ?',
          [plp1_id, 'plp']
        );

        if (users.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'PLP 1 tidak ditemukan'
          });
        }

      }

      // Validasi PLP 2
      if (plp2_id) {

        const [users] = await pool.query(
          'SELECT id FROM users WHERE id = ? AND role = ?',
          [plp2_id, 'plp']
        );

        if (users.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'PLP 2 tidak ditemukan'
          });
        }

      }
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User kalab tidak ditemukan'
        });
      }
    }

    const itemIds = Array.isArray(item_ids) ? item_ids.join(',') : (item_ids || null);

    const [result] = await pool.query(
      'INSERT INTO laboratories (nama_lab, lokasi, kalab_id, plp1_id, plp2_id, item_ids) VALUES (?, ?, ?, ?, ?, ?)',
      [nama_lab, lokasi, kalab_id || null, plp1_id || null, plp2_id || null, itemIds]
    );

    res.status(201).json({
      success: true,
      message: 'Laboratorium berhasil dibuat',
      data: {
        id: result.insertId,
        nama_lab,
        lokasi,
        kalab_id: kalab_id || null,
        plp1_id: plp1_id || null,
        plp2_id: plp2_id || null,
        item_ids: itemIds
      }
    });
  } catch (err) {
    next(err);
  }
};

const updateLaboratory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nama_lab, lokasi, kalab_id, plp1_id, plp2_id, item_ids } = req.body;

    const [labs] = await pool.query(
      'SELECT id FROM laboratories WHERE id = ?',
      [id]
    );
    if (labs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorium tidak ditemukan'
      });
    }

    if (kalab_id) {
      const [users] = await pool.query(
        'SELECT id FROM users WHERE id = ? AND role = ?',
        [kalab_id, 'kalab']
      );
      // Validasi PLP 1
      if (plp1_id) {

        const [users] = await pool.query(
          'SELECT id FROM users WHERE id = ? AND role = ?',
          [plp1_id, 'plp']
        );

        if (users.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'PLP 1 tidak ditemukan'
          });
        }

      }

      // Validasi PLP 2
      if (plp2_id) {

        const [users] = await pool.query(
          'SELECT id FROM users WHERE id = ? AND role = ?',
          [plp2_id, 'plp']
        );

        if (users.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'PLP 2 tidak ditemukan'
          });
        }

      }
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User kalab tidak ditemukan'
        });
      }
    }

    const itemIds = item_ids !== undefined
      ? (Array.isArray(item_ids) ? item_ids.join(',') : item_ids)
      : null;

    if (itemIds !== null) {
      await pool.query(
        'UPDATE laboratories SET nama_lab = ?, lokasi = ?, kalab_id = ?, plp1_id = ?, plp2_id = ?, item_ids = ? WHERE id = ?',
        [nama_lab, lokasi, kalab_id || null, plp1_id || null, plp2_id || null, itemIds, id]
      );
    } else {
      await pool.query(
        'UPDATE laboratories SET nama_lab = ?, lokasi = ?, kalab_id = ?, plp1_id = ?, plp2_id = ? WHERE id = ?',
        [nama_lab, lokasi, kalab_id || null, plp1_id || null, plp2_id || null, id]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Laboratorium berhasil diperbarui',
      data: {
        kalab_id: kalab_id || null,
        plp1_id: plp1_id || null,
        plp2_id: plp2_id || null,
        item_ids: item_ids || []
      }
    });
  } catch (err) {
    next(err);
  }
};

const deleteLaboratory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [labs] = await pool.query(
      'SELECT id FROM laboratories WHERE id = ?',
      [id]
    );
    if (labs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorium tidak ditemukan'
      });
    }

    await pool.query('DELETE FROM laboratories WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Laboratorium berhasil dihapus'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllLaboratories,
  createLaboratory,
  updateLaboratory,
  deleteLaboratory
};
