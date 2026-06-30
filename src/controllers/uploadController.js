const pool = require("../config/database");
const fs = require("fs");
const path = require("path");

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
    
    const [labs] = await pool.query("SELECT * FROM laboratories WHERE id = ?", [lab_id]);

    if (labs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Laboratorium tidak ditemukan"
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

      if (req.file) {
    const filePath = path.join(__dirname, "../../uploads", req.file.filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
    next(err);
  }
};

module.exports = {
  uploadLabReport,
};