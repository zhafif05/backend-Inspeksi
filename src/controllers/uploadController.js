const pool = require("../config/database");
const fs = require("fs");
const path = require("path");
const drive = require("../config/googleDrive");
const { Readable } = require("stream");

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
    const oldReport = labs[0].report_file;
    const fileUrl = `/uploads/${req.file.filename}`;

    await pool.query(
      "UPDATE laboratories SET report_file = ? WHERE id = ?",
      [fileUrl, lab_id]
    );

    if (oldReport) {
      const oldFile = path.join(
        __dirname,
        "../../uploads",
        path.basename(oldReport)
      );

      if (fs.existsSync(oldFile)) {
        fs.unlinkSync(oldFile);
        console.log("File lama dihapus:", oldFile);
      }
    }

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

const uploadLabReportToDrive = async (req, res, next) => {
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

    const [labs] = await pool.query(
      "SELECT * FROM laboratories WHERE id = ?",
      [lab_id]
    );

    if (labs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Laboratorium tidak ditemukan",
      });
    }

    const stream = Readable.from(req.file.buffer);

    const upload = await drive.files.create({
      requestBody: {
        name: req.file.originalname,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: req.file.mimetype,
        body: stream,
      },
      fields: "id",
    });

    const fileId = upload.data.id;

    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    const file = await drive.files.get({
      fileId,
      fields: "webViewLink",
    });

    await pool.query(
      "UPDATE laboratories SET report_file = ? WHERE id = ?",
      [file.data.webViewLink, lab_id]
    );

    res.status(200).json({
      success: true,
      url: file.data.webViewLink,
      message: "Upload berhasil ke Google Drive",
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadLabReport,
  uploadLabReportToDrive,
};