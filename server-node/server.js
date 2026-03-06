const express = require("express");
const dotenv = require("dotenv");

// 🟢 CRITICAL FIX: Load .env BEFORE importing any routes or database models
dotenv.config();

const mongoose = require("mongoose");
const cors = require("cors");

// Now it is safe to import routes (because .env is loaded)
const medicineRoutes = require("./routes/medicine.route");
const orderRoutes = require("./routes/order.route");
const imageRoutes = require("./routes/image.route");

const app = express();

// --- STEP 0: THE "SPY" LOGGER ---
app.use((req, res, next) => {
  console.log("-----------------------------------------");
  console.log(`📨 NEW REQUEST: ${req.method} ${req.url}`);
  console.log(`📍 Origin: ${req.headers.origin}`);
  console.log("-----------------------------------------");
  next();
});

// --- STEP 1: DYNAMIC CORS ---
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`❌ BLOCKED BY CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

// --- STEP 2: BODY PARSER ---
app.use(express.json());

// --- STEP 3: DATABASE ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// --- STEP 4: ROUTES ---
app.use("/api/auth", require("./routes/auth.route"));
const doctorRoutes = require("./routes/doctor.route");
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", require("./routes/appointment.route"));
app.use("/api/labs", require("./routes/lab.route"));
app.use("/api/medicines", medicineRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", require("./routes/admin.route"));
app.use("/api/lab-tests", require("./routes/labTest.route"));
app.use("/api/users", require("./routes/user.route"));
app.use("/api/prescriptions", require("./routes/prescription.route")); // 🟢 Prescriptions Route
app.use("/api/vision", imageRoutes);
app.use("/api/reports", require("./routes/report.route")); // 🟢 Clinical Reports Route

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));