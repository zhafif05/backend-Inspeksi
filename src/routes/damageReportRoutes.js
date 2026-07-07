const express = require("express");
const router = express.Router();

const damageReportController = require("../controllers/damageReportController");

const { verifyToken } = require("../middleware/authMiddleware");

const multerUpload = require("../middleware/multerConfig");

router.post(
  "/",
  verifyToken,
  multerUpload.single("foto"),
  damageReportController.saveDamageReport
);

router.get(
  "/result/:inspectionResultId",
  verifyToken,
  damageReportController.getDamageReport
);

router.delete(
  "/result/:inspectionResultId",
  verifyToken,
  damageReportController.deleteDamageReport
);

module.exports = router;