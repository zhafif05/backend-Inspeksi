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
    const { nama_lab, lokasi, kalab_id, plp_id, teknisi_id, item_ids } = req.body;

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
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const [labData] = await connection.query(
      "SELECT item_ids FROM laboratories WHERE id = ?",
      [id]
    );

    if (labData.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Laboratorium tidak ditemukan",
      });
    }

    const itemIds = labData[0]?.item_ids
      ? labData[0].item_ids
        .split(",")
        .map((x) => Number(x.trim()))
        .filter((x) => !isNaN(x))
      : [];

    // Ambil semua inspection milik laboratorium
    const [inspections] = await connection.query(
      `
      SELECT id
      FROM inspections
      WHERE laboratory_id = ?
      `,
      [id]
    );

    const inspectionIds = inspections.map(i => i.id);

    if (inspectionIds.length > 0) {

      // Hapus hasil inspeksi
      await connection.query(
        `
    DELETE FROM inspection_results
    WHERE inspection_id IN (?)
    `,
        [inspectionIds]
      );

      // Hapus review bulanan
      await connection.query(
        `
    DELETE FROM inspection_monthly_reviews
    WHERE inspection_id IN (?)
    `,
        [inspectionIds]
      );

      // Hapus inspeksi
      await connection.query(
        `
    DELETE FROM inspections
    WHERE id IN (?)
    `,
        [inspectionIds]
      );
    }

    if (itemIds.length > 0) {

      await connection.query(
        `
    DELETE s
    FROM inspection_subitems s
    INNER JOIN inspection_categories c
        ON c.id = s.category_id
    WHERE c.item_id IN (?)
    `,
        [itemIds]
      );

      await connection.query(
        `
    DELETE FROM inspection_categories
    WHERE item_id IN (?)
    `,
        [itemIds]
      );

      await connection.query(
        `
    DELETE FROM items
    WHERE id IN (?)
    `,
        [itemIds]
      );
    }

    await connection.query(
      `
  DELETE FROM laboratories
  WHERE id = ?
  `,
      [id]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Laboratorium berhasil dihapus'
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllLaboratories,
  createLaboratory,
  updateLaboratory,
  deleteLaboratory
};
