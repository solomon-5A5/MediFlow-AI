const crypto = require("crypto"); // 🟢 Import built-in crypto module
const Appointment = require("../models/appointment.model");
const Doctor = require("../models/doctor.model");
const cloudinary = require('cloudinary').v2;

// 🟢 UPGRADED: Now accepts the original filename to extract the extension
const streamUpload = (buffer, originalName) => {
  // Extract 'pdf', 'jpg', 'png' from the filename
  const ext = originalName.split('.').pop();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "mediflow_patient_reports",
        format: ext // 🟢 FORCES Cloudinary to add .pdf to the final URL
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(buffer);
  });
};

const bookAppointment = async (req, res) => {
  try {
    // Now that Multer is in the route, req.body will exist!
    const { patientId, doctorId, date, timeSlot, reason } = req.body;

    let attachedReportUrl = null;
    let attachedReportName = null;

    // Check if Multer caught a file
    // Check if Multer caught a file
    if (req.file) {
      console.log("📄 File detected! Uploading to Cloudinary...");
      // 🟢 Pass the originalname to the function
      const uploadResult = await streamUpload(req.file.buffer, req.file.originalname);
      attachedReportUrl = uploadResult.secure_url;
      attachedReportName = req.file.originalname;
      console.log("✅ Upload successful:", attachedReportUrl);
    }

    // 🟢 Generate a secure, unique Room ID for Jitsi
    const uniqueString = crypto.randomBytes(8).toString('hex');
    const meetLink = `https://meet.jit.si/MediFlow_Consult_${uniqueString}`;

    const newAppointment = new Appointment({
      patientId,
      doctorId,
      date,
      timeSlot,
      reason,
      attachedReportUrl,
      attachedReportName,
      meetLink // 🟢 Save the link to the database!
    });

    await newAppointment.save();
    res.status(201).json({ message: "Appointment booked successfully", appointment: newAppointment });

  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ message: "Failed to book appointment" });
  }
};

// 2. GET BOOKED SLOTS
const getBookedSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    // console.log(`🔎 Checking: ${doctorId} on ${date}`);

    const appointments = await Appointment.find({
      doctorId,
      date: date, // Exact String Match
      status: { $ne: "cancelled" }
    });

    const slots = appointments.map(app => app.timeSlot);
    res.json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching slots" });
  }
};

// 3. GET PATIENT HISTORY
const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.params.userId })
      .populate({ path: "doctorId", populate: { path: "userId", select: "fullName" } })
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching history" });
  }
};

// 3. GET APPOINTMENTS FOR DOCTOR DASHBOARD
const getDoctorAppointments = async (req, res) => {
  try {
    // The frontend is sending the logged-in User's ID in the URL.
    // We named the parameter ":doctorId" in the route, so it's inside req.params.doctorId
    const loggedInUserId = req.params.doctorId;

    // Step 1: Find the actual Doctor profile linked to this User account
    const doctorProfile = await Doctor.findOne({ userId: loggedInUserId });

    if (!doctorProfile) {
      return res.status(404).json({ message: "Doctor profile not found for this user." });
    }

    // Step 2: Use the REAL Doctor ID to find the appointments
    const appointments = await Appointment.find({ doctorId: doctorProfile._id })
      .populate("patientId", "fullName email") // Get patient details
      .sort({ date: 1 }); // Sort chronologically

    res.json(appointments);
  } catch (error) {
    console.error("Fetch Doctor Appointments Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getAllDoctors = async (req, res) => {
  try {
    const docs = await Doctor.find().populate("userId", "fullName email");
    res.json(docs);
  } catch (e) { res.status(500).json({ message: "Error" }); }
};

// CANCEL APPOINTMENT
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: "cancelled" },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment cancelled successfully", appointment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error cancelling appointment" });
  }
};

module.exports = {
  bookAppointment,
  getBookedSlots,
  getMyAppointments,
  getDoctorAppointments,
  getAllDoctors,
  cancelAppointment
};