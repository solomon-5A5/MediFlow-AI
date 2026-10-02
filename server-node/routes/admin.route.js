const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const Order = require("../models/order.model");
const Appointment = require("../models/appointment.model");
const AccessLog = require("../models/accessLog.model");
const Doctor = require("../models/doctor.model"); // 👈 Import Doctor Model
const LabAppointment = require("../models/labAppointment.model");

// 1. GET AUDIT LOGS
router.get("/logs", async (req, res) => {
  try {
    const logs = await AccessLog.find()
      .populate("doctorId", "name hospital image") // Get Doctor Name
      .populate("patientId", "fullName email")     // Get Patient Name
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching logs" });
  }
});

// 2. LOG AN ACTION (The Spy Route) 🕵️‍♂️
router.post("/log-access", async (req, res) => {
  try {
    const { doctorId, patientId, details } = req.body;

    // 🔍 SMART LOOKUP: Check if 'doctorId' is actually a User ID
    // We try to find the Doctor Profile associated with this User ID
    let finalDoctorId = doctorId;
    const doctorProfile = await Doctor.findOne({ userId: doctorId });

    if (doctorProfile) {
      finalDoctorId = doctorProfile._id; // Use the real Doctor Profile ID
    }

    // Create the log
    await AccessLog.create({
      doctorId: finalDoctorId,
      patientId, // In a real app, ensure this is a valid MongoDB ID
      details
    });

    res.status(201).json({ message: "Access recorded" });
  } catch (err) {
    console.error("Spy Error:", err);
    res.status(500).json({ message: "Logging failed" });
  }
});

// 3. GET ALL ORDERS
router.get("/all-orders", async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "fullName").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders" });
  }
});
// 4. GET ALL APPOINTMENTS
router.get("/all-appointments", async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patientId", "fullName")
      .populate("doctorId", "name hospital")
      .sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: "Error fetching appointments" });
  }
});
// 5. GET ALL LAB APPOINTMENTS
router.get("/all-lab-appointments", async (req, res) => {
  try {
    const labAppts = await LabAppointment.find()
      .populate("patientId", "fullName email")
      // .populate("labAdminId", "name") // If you link to a specific lab tech
      .sort({ date: -1 });
    res.json(labAppts);
  } catch (error) {
    console.error("Fetch Lab Appointments Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;