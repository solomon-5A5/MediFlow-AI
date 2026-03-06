const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema({
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // 🟢 4. CLINICAL DATA SECTION
    symptoms: { type: String },
    diagnosis: { type: String, required: true },
    vitals: {
        bp: { type: String, default: "" },
        temp: { type: String, default: "" },
        pulse: { type: String, default: "" },
        weight: { type: String, default: "" }
    },
    allergies: { type: String, default: "None Known" },
    medicalHistory: { type: String, default: "" },
    followUpDate: { type: Date },

    // 🟢 1. UPGRADED MEDICINE TABLE
    medicines: [{
        medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
        name: { type: String, required: true },
        strengthForm: { type: String, required: true }, // e.g., "500mg Tablet"
        frequency: { type: String, required: true },    // e.g., "1-0-1"
        days: { type: String, required: true },         // e.g., "5"
        route: { type: String, default: "Oral" },       // e.g., "Oral", "IV"
        instructions: { type: String }
    }],

    advice: { type: String },
    signature: { type: String, required: true },

    // 🟢 2. DOCTOR VERIFICATION (Can also be pulled from Doctor profile, but storing here freezes it in time)
    verification: {
        licenseNumber: { type: String, default: "MED-0000" },
        hospitalRegNumber: { type: String, default: "HOSP-0000" },
        signatureHash: { type: String } // Will be generated on save
    }

}, { timestamps: true });

// Pre-save hook to generate a security hash
prescriptionSchema.pre('save', async function () {
    if (!this.verification.signatureHash) {
        this.verification.signatureHash = Buffer.from(`${this._id}-${this.doctorId}-${Date.now()}`).toString('base64');
    }
});

module.exports = mongoose.model("Prescription", prescriptionSchema);