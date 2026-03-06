const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },

  // 🟢 IMPORTANT: Store as String (e.g., "2026-02-18")
  date: {
    type: String,
    required: true
  },

  timeSlot: { type: String, required: true },
  status: { type: String, default: "pending" },
  meetLink: { type: String, default: "" },
  reason: { type: String, default: "General Checkup" },
  attachedReportUrl: { type: String, default: null },
  attachedReportName: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model("Appointment", appointmentSchema);