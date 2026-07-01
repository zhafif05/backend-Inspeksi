const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const pdfMemoryUpload = require("../middleware/pdfMemoryUpload");
const { uploadLabReport,uploadLabReportToDrive, } = require("../controllers/uploadController");


const router = express.Router();

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
}
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },

  filename(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post(
  "/lab",
  upload.single("file"),
  uploadLabReport
);

router.post(
  "/lab/drive",
  pdfMemoryUpload.single("file"),
  uploadLabReportToDrive
);

module.exports = router;