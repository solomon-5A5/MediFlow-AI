const express = require("express");
const { createReport, getAllReportsForAdmin, getPatientReports } = require("../controllers/report.controller");

const router = express.Router();

// Route for doctors to save
router.post("/save", createReport);

// Route for Superadmin to audit
router.get("/admin/all", getAllReportsForAdmin);

// Route for Patients to view their history
router.get("/patient/:patientId", getPatientReports);

module.exports = router;