const pool = require('../config/database');

// Get all schedules
const getAllSchedules = async (req, res, next) => {
  try {
    const [schedules] = await pool.query(
      `SELECT s.*, l.nama_lab FROM schedules s 
       LEFT JOIN laboratories l ON s.laboratory_id = l.id 
       ORDER BY s.tanggal DESC`
    );

    res.status(200).json({
      success: true,
      data: schedules,
      total: schedules.length
    });
  } catch (err) {
    next(err);
  }
};

// Get schedules by laboratory
const getSchedulesByLab = async (req, res, next) => {
  try {
    const { laboratoryId } = req.params;

    const [schedules] = await pool.query(
      `SELECT s.*, l.nama_lab FROM schedules s 
       LEFT JOIN laboratories l ON s.laboratory_id = l.id 
       WHERE s.laboratory_id = ? ORDER BY s.tanggal DESC`,
      [laboratoryId]
    );

    res.status(200).json({
      success: true,
      data: schedules,
      total: schedules.length
    });
  } catch (err) {
    next(err);
  }
};

// Create schedule (admin only)
const createSchedule = async (req, res, next) => {
  try {
    const { laboratory_id, tanggal, keterangan } = req.body;

    // Check if laboratory exists
    const [labs] = await pool.query(
      'SELECT id FROM laboratories WHERE id = ?',
      [laboratory_id]
    );
    if (labs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorium tidak ditemukan'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO schedules (laboratory_id, tanggal, keterangan) VALUES (?, ?, ?)',
      [laboratory_id, tanggal, keterangan]
    );

    res.status(201).json({
      success: true,
      message: 'Jadwal berhasil dibuat',
      data: {
        id: result.insertId,
        laboratory_id,
        tanggal,
        keterangan
      }
    });
  } catch (err) {
    next(err);
  }
};

// Update schedule (admin only)
const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tanggal, keterangan } = req.body;

    // Check if schedule exists
    const [schedules] = await pool.query(
      'SELECT id FROM schedules WHERE id = ?',
      [id]
    );
    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tidak ditemukan'
      });
    }

    // Update schedule
    await pool.query(
      'UPDATE schedules SET tanggal = ?, keterangan = ? WHERE id = ?',
      [tanggal, keterangan, id]
    );

    res.status(200).json({
      success: true,
      message: 'Jadwal berhasil diperbarui'
    });
  } catch (err) {
    next(err);
  }
};

// Delete schedule (admin only)
const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if schedule exists
    const [schedules] = await pool.query(
      'SELECT id FROM schedules WHERE id = ?',
      [id]
    );
    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tidak ditemukan'
      });
    }

    // Delete schedule
    await pool.query('DELETE FROM schedules WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Jadwal berhasil dihapus'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllSchedules,
  getSchedulesByLab,
  createSchedule,
  updateSchedule,
  deleteSchedule
};
