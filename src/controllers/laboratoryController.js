const pool = require('../config/database');

const getAllLaboratories = async (req, res, next) => {
  try {
    const [labs] = await pool.query(
      `SELECT l.id, l.nama_lab, l.lokasi, l.kalab_id,l.plp_id, l.teknisi_id,
              u.name as penanggung_jawab, u.name as kalab_name, u.nip as nip_penanggung_jawab,plp.name AS plp_name,teknisi.name AS teknisi_name,
              l.item_ids, l.report_file, l.created_at, l.updated_at
       FROM laboratories l
       LEFT JOIN users u ON l.kalab_id = u.id
       LEFT JOIN users plp ON l.plp_id = plp.id
       LEFT JOIN users teknisi ON l.teknisi_id = teknisi.id  
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
    const { nama_lab, lokasi, kalab_id, plp_id,   teknisi_id, item_ids } = req.body;

    if (kalab_id) {
      const [users] = await pool.query(
        'SELECT id FROM users WHERE id = ? AND role = ?',
        [kalab_id, 'kalab']
      );
      // Validasi PLP 1
      if (plp_id) {

        const [users] = await pool.query(
          'SELECT id FROM users WHERE id = ? AND role = ?',
          [plp_id, 'plp']
        );

        if (users.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'PLP 1 tidak ditemukan'
          });
        }

      }

      // Validasi PLP 2
      if (teknisi_id) {

        const [users] = await pool.query(
          'SELECT id FROM users WHERE id = ? AND role = ?',
          [teknisi_id, 'teknisi']
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
      'INSERT INTO laboratories (nama_lab, lokasi, kalab_id, plp_id, teknisi_id, item_ids) VALUES (?, ?, ?, ?, ?, ?)',
      [nama_lab, lokasi, kalab_id || null, plp_id || null, teknisi_id || null, itemIds]
    );

    res.status(201).json({
      success: true,
      message: 'Laboratorium berhasil dibuat',
      data: {
        id: result.insertId,
        nama_lab,
        lokasi,
        kalab_id: kalab_id || null,
        plp_id: plp_id || null,
        teknisi_id: teknisi_id || null,
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
    const { nama_lab, lokasi, kalab_id, plp_id, teknisi_id, item_ids } = req.body;

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
      if (plp_id) {

        const [users] = await pool.query(
          'SELECT id FROM users WHERE id = ? AND role = ?',
          [plp_id, 'plp']
        );

        if (users.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'PLP tidak ditemukan'
          });
        }

      }

      // Validasi PLP 2
      if (teknisi_id) {

        const [users] = await pool.query(
          'SELECT id FROM users WHERE id = ? AND role = ?',
          [teknisi_id, 'teknisi']
        );

        if (users.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Teknisi tidak ditemukan'
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
        'UPDATE laboratories SET nama_lab = ?, lokasi = ?, kalab_id = ?, plp_id = ?, teknisi_id = ?, item_ids = ? WHERE id = ?',
        [nama_lab, lokasi, kalab_id || null, plp_id || null, teknisi_id || null, itemIds, id]
      );
    } else {
      await pool.query(
        'UPDATE laboratories SET nama_lab = ?, lokasi = ?, kalab_id = ?, plp_id = ?, teknisi_id = ? WHERE id = ?',
        [nama_lab, lokasi, kalab_id || null, plp_id || null, teknisi_id || null, id]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Laboratorium berhasil diperbarui',
      data: {
        kalab_id: kalab_id || null,
        plp_id: plp_id || null,
        teknisi_id: teknisi_id || null,
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
