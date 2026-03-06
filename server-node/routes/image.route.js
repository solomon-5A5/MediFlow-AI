const express = require("express");
const multer = require("multer");
const { analyzeImage, analyzeImageV2, saveReport, getPatientReports } = require("../controllers/image.controller");

const router = express.Router();

// Store the uploaded X-ray in RAM
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for X-rays
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed!"), false);
        }
    }
});

// POST /api/vision/analyze
router.post("/analyze", upload.single("xray"), analyzeImage);

// 🟢 NEW: Multi-disease analysis endpoint
router.post("/analyze-v2", upload.single("xray"), analyzeImageV2);

// 🟢 NEW: Save to MongoDB Route
// 🟢 NEW: Save to MongoDB Route
router.post("/save", saveReport);

// 🟢 NEW: Get reports by patient ID
router.get("/patient/:patientId", getPatientReports);

module.exports = router;