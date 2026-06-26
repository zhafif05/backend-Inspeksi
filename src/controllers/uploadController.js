const pool = require("../config/database");

const uploadLabReport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { lab_id } = req.body;

    if (!lab_id) {
      return res.status(400).json({
        success: false,
        message: "Lab ID wajib diisi",
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    await pool.query(
      "UPDATE laboratories SET report_file = ? WHERE id = ?",
      [fileUrl, lab_id]
    );

    res.status(200).json({
      success: true,
      url: fileUrl,
      message: "Upload berhasil",
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadLabReport,
};