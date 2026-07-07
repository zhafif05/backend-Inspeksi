const pool = require("../config/database");

/**
 * CREATE / UPDATE
 */
const saveDamageReport = async (req, res, next) => {
  try {
    const {
      inspection_result_id,
      inspection_id,
      laboratory_id,
      item_id,
      category_id,
      subitem_id,
      kondisi_kerusakan,
      penyebab_kerusakan,
      status_peralatan,
    } = req.body;

    const foto = req.file ? req.file.filename : null;

    // cek apakah sudah ada
    const [exist] = await pool.query(
      `
      SELECT id,foto
      FROM inspection_damage_reports
      WHERE inspection_result_id = ?
      `,
      [inspection_result_id]
    );

    if (exist.length > 0) {
      await pool.query(
        `
        UPDATE inspection_damage_reports
        SET
          kondisi_kerusakan=?,
          penyebab_kerusakan=?,
          status_peralatan=?,
          foto=COALESCE(?,foto),
          updated_at=NOW()
        WHERE inspection_result_id=?
        `,
        [
          kondisi_kerusakan,
          penyebab_kerusakan,
          status_peralatan,
          foto,
          inspection_result_id,
        ]
      );

      return res.json({
        success: true,
        message: "Damage report berhasil diupdate",
      });
    }

    await pool.query(
      `
      INSERT INTO inspection_damage_reports
      (
        inspection_result_id,
        inspection_id,
        laboratory_id,
        item_id,
        category_id,
        subitem_id,
        kondisi_kerusakan,
        penyebab_kerusakan,
        status_peralatan,
        foto
      )
      VALUES (?,?,?,?,?,?,?,?,?,?)
      `,
      [
        inspection_result_id,
        inspection_id,
        laboratory_id,
        item_id,
        category_id,
        subitem_id,
        kondisi_kerusakan,
        penyebab_kerusakan,
        status_peralatan,
        foto,
      ]
    );

    res.json({
      success: true,
      message: "Damage report berhasil disimpan",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET BY RESULT
 */
const getDamageReport = async (req, res, next) => {
  try {
    const { inspectionResultId } = req.params;

    const [rows] = await pool.query(
      `
      SELECT *
      FROM inspection_damage_reports
      WHERE inspection_result_id=?
      LIMIT 1
      `,
      [inspectionResultId]
    );

    res.json({
      success: true,
      data: rows.length ? rows[0] : null,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE
 */
const deleteDamageReport = async (req, res, next) => {
  try {
    const { inspectionResultId } = req.params;

    await pool.query(
      `
      DELETE
      FROM inspection_damage_reports
      WHERE inspection_result_id=?
      `,
      [inspectionResultId]
    );

    res.json({
      success: true,
      message: "Damage report berhasil dihapus",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  saveDamageReport,
  getDamageReport,
  deleteDamageReport,
};