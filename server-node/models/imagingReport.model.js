const mongoose = require("mongoose");

const imagingReportSchema = new mongoose.Schema({
    // Patient link (optional for testing, required in production)
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: false },

    scanType: { type: String, default: "Chest X-Ray (PA View)" },

    // Triage-Focused AI Results
    prediction: { type: String, required: true },   // primary_flag from Python
    confidence: { type: Number, required: true },    // flag_confidence from Python

    // Clinical Confidence Buckets
    high_priority_findings: [{
        disease: String,
        confidence: Number,
        severity: String
    }],
    secondary_anomalies: [{
        disease: String,
        confidence: Number,
        severity: String
    }],
    evaluated_negative: [{
        disease: String,
        confidence: Number
    }],

    // Composite Risk Score (from multimodal pipeline)
    risk_score: {
        value: Number,
        level: String,
        scale: { type: String, default: "1-10" },
        interpretation: String,
        urgency: String,
        active_findings: Number
    },

    // Clinical Suggestion (auto-generated from top finding)
    clinical_suggestion: { type: String },

    // Clinical Status & Notes
    overall_status: { type: String, enum: ["Review Recommended", "Normal Evaluation"], default: "Normal Evaluation" },
    status: { type: String, enum: ["Pending Review", "Finalized"], default: "Finalized" },
    radiologistNotes: { type: String, default: "AI-assisted multimodal triage. Awaiting physician validation." }

}, { timestamps: true });

module.exports = mongoose.model("ImagingReport", imagingReportSchema);