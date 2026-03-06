const mongoose = require("mongoose");

const clinicalReportSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    
    // The structured SOAP data for the RAG Model
    soap: {
        subjective: { type: String, default: "" },
        objective: { type: String, default: "" },
        assessment: { type: String, required: true },
        plan: { type: String, required: true }
    },
    
    status: { type: String, enum: ["draft", "finalized"], default: "finalized" }
}, { timestamps: true });

module.exports = mongoose.model("ClinicalReport", clinicalReportSchema);