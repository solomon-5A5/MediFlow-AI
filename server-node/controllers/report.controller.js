const ClinicalReport = require("../models/clinicalReport.model");

// 1. Doctor saves a new report
const createReport = async (req, res) => {
    try {
        const newReport = new ClinicalReport(req.body);
        await newReport.save();
        res.status(201).json({ message: "Clinical Report securely saved.", report: newReport });
    } catch (error) {
        console.error("Report Save Error:", error);
        res.status(500).json({ message: "Failed to save clinical report." });
    }
};

// 2. Superadmin views ALL reports across the platform
const getAllReportsForAdmin = async (req, res) => {
    try {
        // Populating patient and doctor names for the admin dashboard
        const reports = await ClinicalReport.find()
            .populate("patientId", "fullName email")
            .populate("doctorId", "fullName specialization")
            .sort({ createdAt: -1 });
            
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve platform reports." });
    }
};

// 3. Patient views their specific reports
const getPatientReports = async (req, res) => {
    try {
        const { patientId } = req.params;
        const reports = await ClinicalReport.find({ patientId }).sort({ createdAt: -1 });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve patient reports." });
    }
};

module.exports = { createReport, getAllReportsForAdmin, getPatientReports };