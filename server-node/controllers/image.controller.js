const ImagingReport = require("../models/imagingReport.model");
const axios = require("axios");
const FormData = require("form-data");

const analyzeImage = async (req, res) => {
    // Legacy endpoint — kept for backward compatibility
};

const analyzeImageV2 = async (req, res) => {
    try {
        const file = req.file;
        // 🟢 FIX #1: Extract clinical data sent from React (default to empty JSON string)
        const clinicalData = req.body.clinical_data || "{}";

        if (!file) return res.status(400).json({ message: "No image uploaded." });

        const formData = new FormData();
        formData.append("file", file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype
        });

        // 🟢 FIX #1: Append clinical data to the form sent to Python
        formData.append("clinical_data", clinicalData);

        const pythonResponse = await axios.post("http://127.0.0.1:8000/api/vision/analyze", formData, {
            headers: formData.getHeaders()
        });

        res.status(200).json({
            message: "Multimodal Analysis Completed",
            data: pythonResponse.data
        });

    } catch (error) {
        const rawError = String(error);
        const detailedStack = error.response?.data || error.stack || "No stack trace available";
        console.error("Multimodal Bridge Error:", rawError);

        res.status(500).json({
            message: `Multimodal analysis failed: ${rawError}`,
            details: detailedStack
        });
    }
};

// 🟢 FIX #4: Cleaned up saveReport to match Python's multimodal payload keys exactly
const saveReport = async (req, res) => {
    try {
        const {
            primary_flag,
            flag_confidence,
            patientId,
            high_priority_findings,
            secondary_anomalies,
            evaluated_negative,
            risk_score,
            overall_status,
            clinical_suggestion,
            notes
        } = req.body;

        const newReport = new ImagingReport({
            patientId,
            prediction: primary_flag,
            confidence: flag_confidence,
            high_priority_findings,
            secondary_anomalies,
            evaluated_negative,
            risk_score,
            overall_status,
            clinical_suggestion,
            radiologistNotes: notes || "AI-assisted multimodal triage. Awaiting physician validation."
        });

        await newReport.save();
        console.log(`💾 Multimodal Report Saved: ${newReport._id}`);

        res.status(201).json({
            message: "Multimodal triage report finalized and securely saved.",
            report: newReport
        });

    } catch (error) {
        console.error("Database Save Error:", error);
        res.status(500).json({ message: "Failed to save clinical report." });
    }
};

const getPatientReports = async (req, res) => {
    try {
        const { patientId } = req.params;
        const reports = await ImagingReport.find({ patientId }).sort({ createdAt: -1 });
        res.status(200).json(reports);
    } catch (error) {
        console.error("Error fetching patient reports:", error);
        res.status(500).json({ message: "Failed to fetch medical records." });
    }
};

module.exports = { analyzeImage, analyzeImageV2, saveReport, getPatientReports };