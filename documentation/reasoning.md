# 🏥 MediFlow AI — Technical Reasoning Document

> **Project Analysis** | Full-Stack Healthcare Platform  
> **Date:** February 2026  
> **Stack:** React (Vite) + Node/Express + MongoDB + Python FastAPI  

---

## 📑 Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [End Users](#2-end-users)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [System Architecture Overview](#5-system-architecture-overview)
6. [Functional Full-Stack Flow](#6-functional-full-stack-flow)
7. [Feature Implementation](#7-feature-implementation)
8. [Proper Integration](#8-proper-integration)
9. [System Design Explanation](#9-system-design-explanation)
10. [Database Schema & Relationships](#10-database-schema--relationships)
11. [Security Implementation](#11-security-implementation)
12. [Organized GitHub Usage](#12-organized-github-usage)
13. [API Endpoint Reference](#13-api-endpoint-reference)
14. [Future Roadmap](#14-future-roadmap)

---

## 1. Problem Statement
In today's world, accessing quality healthcare is often a frustrating and time-consuming experience. Patients face multiple challenges:
**For Patients:**
- **Long waiting times** at clinics and hospitals, sometimes hours just for a 10-minute consultation
- **Difficulty finding the right specialist** — patients don't know which type of doctor they need
- **Lost medical records** — paper prescriptions get misplaced, and there's no central place to store health history
- **Pharmacy runs** — after getting a prescription, patients must physically visit a pharmacy, wait in line, and sometimes find that medicines are out of stock
- **Confusing lab reports** — patients receive lab test results with numbers and medical terms they don't understand
- **No follow-up tracking** — patients forget follow-up appointments or lose track of their treatment plans
**For Doctors:**
- **Paper-based workflows** — writing prescriptions by hand is slow and prone to errors
- **No patient history access** — when a patient visits, the doctor has no quick way to see their previous diagnoses, allergies, or medications
- **Manual scheduling** — managing appointment slots, cancellations, and rescheduling is tedious
- **Limited diagnostic support** — doctors must rely solely on their expertise without AI-assisted tools to help catch potential issues
**For Healthcare Administrators:**
- **No visibility into operations** — no way to see how many patients are being served, which doctors are busiest, or where bottlenecks exist
- **Security concerns** — sensitive patient data is scattered across systems with no audit trail of who accessed what

### Our Solution: MediFlow AI

**MediFlow AI** is a complete digital healthcare platform that connects patients, doctors, pharmacies, and diagnostic labs in one unified system. Instead of visiting multiple places and managing paper records, everything happens in one app:

1. **Patients** can find doctors, book appointments, join video consultations, receive digital prescriptions, order medicines, and book lab tests — all from their phone or computer.

2. **Doctors** get a smart dashboard showing their daily schedule, patient history, AI-powered diagnostic tools (like X-ray analysis), and digital prescription writing.

3. **The system uses AI** to analyze chest X-rays and detect potential issues like pneumonia, helping doctors make faster and more accurate diagnoses.

4. **All data is stored securely** in one place, so patients never lose their medical history, and doctors can always see a patient's complete health record.

### In Simple Terms

> *"MediFlow AI is like having a hospital, pharmacy, and diagnostic lab in your pocket — with an AI assistant that helps doctors catch diseases early and helps patients understand their health better."*

---

## 2. End Users

### Primary Users

| User Type | Description | Key Needs |
|-----------|-------------|-----------|
| **Patients** | Individuals seeking medical care, ranging from routine checkups to specialist consultations | Easy appointment booking, medicine ordering, understanding their health reports, video consultations from home |
| **Doctors** | Licensed medical practitioners including general physicians and specialists | Efficient patient management, quick access to patient history, AI-assisted diagnostics, digital prescription writing |
| **Super Administrators** | Hospital/clinic management and IT staff responsible for platform oversight | User monitoring, security audit logs, platform analytics, access control management |

### Secondary Users

| User Type | Description | Key Needs |
|-----------|-------------|-----------|
| **Pharmacy Staff** | Personnel managing medicine inventory and order fulfillment | Order management, stock tracking, prescription verification |
| **Lab Technicians** | Staff at diagnostic centers processing lab tests | Test scheduling, result upload, patient communication |
| **Caregivers/Family** | Family members helping elderly or young patients | Account access, appointment management on behalf of patient |

### User Personas

**Persona 1: Priya (Patient, Age 32)**
> *"I'm a working professional with little time to visit doctors. I want to consult a specialist during my lunch break without leaving my office."*
- Needs: Video consultation, digital prescription, medicine home delivery

**Persona 2: Dr. Sharma (Cardiologist, Age 45)**
> *"I see 30+ patients daily. I need quick access to their history and help catching things I might miss in a busy day."*
- Needs: Patient timeline, AI diagnostic support, efficient prescription writing

**Persona 3: Admin Raj (Hospital IT Head, Age 38)**
> *"I need to ensure patient data is secure and know exactly who accessed what records."*
- Needs: Audit logs, user management, security monitoring

---

## 3. Functional Requirements

### 3.1 User Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | Users must be able to register with email and password | High |
| FR-02 | Users must be able to login with email/password or Google account | High |
| FR-03 | System must support three roles: Patient, Doctor, Super Admin | High |
| FR-04 | Users must be able to logout, which marks them as offline | Medium |
| FR-05 | Patients must be able to view and edit their profile information | Medium |
| FR-06 | System must redirect users to role-appropriate dashboard after login | High |

### 3.2 Appointment Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-07 | Patients must be able to view list of available doctors | High |
| FR-08 | Patients must be able to filter doctors by specialization | High |
| FR-09 | Patients must be able to see available time slots for each doctor | High |
| FR-10 | Patients must be able to book an appointment with a selected time slot | High |
| FR-11 | System must prevent double-booking of the same slot | High |
| FR-12 | Patients must be able to attach lab reports (PDF) when booking | Medium |
| FR-13 | Patients must be able to cancel upcoming appointments | Medium |
| FR-14 | Patients must be able to join video consultations via meeting link | High |
| FR-15 | Doctors must see their daily appointment schedule | High |
| FR-16 | System must mark appointments as "completed" after prescription is issued | Medium |

### 3.3 Prescription System

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-17 | Doctors must be able to write digital prescriptions | High |
| FR-18 | Prescriptions must include diagnosis, medicines, dosage, and duration | High |
| FR-19 | Prescriptions must capture patient vitals (BP, temperature, pulse, weight) | Medium |
| FR-20 | Prescriptions must include doctor's digital signature | High |
| FR-21 | Prescriptions must be viewable and downloadable as PDF by patients | High |
| FR-22 | System must generate a unique verification hash for each prescription | Medium |

### 3.4 E-Pharmacy

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-23 | Patients must be able to browse medicines by category | High |
| FR-24 | Patients must be able to search for specific medicines | High |
| FR-25 | Patients must be able to add medicines to cart | High |
| FR-26 | Patients must be able to adjust quantity of items in cart | Medium |
| FR-27 | Cart must persist across browser sessions | Medium |
| FR-28 | Patients must be able to place orders | High |
| FR-29 | System must match prescription medicines to pharmacy products ("Magic Cart") | Low |

### 3.5 Lab Tests

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-30 | Patients must be able to view available lab tests | High |
| FR-31 | Patients must be able to book lab tests with home collection option | Medium |
| FR-32 | System must display estimated turnaround time for each test | Medium |
| FR-33 | System must analyze lab reports and highlight abnormal values | Medium |

### 3.6 AI Diagnostics

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-34 | Doctors must be able to upload chest X-ray images | High |
| FR-35 | System must analyze X-rays using AI and return prediction (Normal/Pneumonia) | High |
| FR-36 | System must display confidence score with AI prediction | High |
| FR-37 | AI results must be saved to patient's medical record | Medium |
| FR-38 | System must display appropriate disclaimer about AI-assisted diagnosis | High |

### 3.7 Clinical Reports

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-39 | Doctors must be able to write clinical reports in SOAP format | Medium |
| FR-40 | Clinical reports must be linked to patient and appointment | Medium |
| FR-41 | Reports must be saveable and retrievable from database | Medium |

### 3.8 Admin & Monitoring

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-42 | Super Admin must be able to view audit logs of all sensitive actions | High |
| FR-43 | Super Admin must be able to see currently online users | Medium |
| FR-44 | Super Admin must be able to view platform statistics | Medium |
| FR-45 | System must log when doctors access patient records | High |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Page load time must be under 3 seconds on standard broadband | < 3 sec |
| NFR-02 | API response time must be under 500ms for standard operations | < 500ms |
| NFR-03 | AI X-ray analysis must complete within 5 seconds | < 5 sec |
| NFR-04 | System must handle 100 concurrent users without degradation | 100 users |

### 4.2 Security

| ID | Requirement | Description |
|----|-------------|-------------|
| NFR-05 | All passwords must be hashed using bcrypt | Never store plain text passwords |
| NFR-06 | API endpoints must validate JWT tokens for protected routes | Token-based authentication |
| NFR-07 | Sensitive environment variables must never be committed to Git | Use .env files |
| NFR-08 | CORS must be configured to allow only whitelisted origins | Prevent unauthorized API access |
| NFR-09 | All sensitive actions must be logged in audit trail | Accountability and compliance |

### 4.3 Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-10 | System uptime must be 99.5% or higher | High availability |
| NFR-11 | Database must be backed up daily | Data protection |
| NFR-12 | System must gracefully handle API failures with user-friendly messages | Error handling |

### 4.4 Usability

| ID | Requirement | Description |
|----|-------------|-------------|
| NFR-13 | Interface must be responsive and work on mobile devices | Mobile-first design |
| NFR-14 | Color contrast must meet accessibility standards | WCAG compliance |
| NFR-15 | All actions must provide feedback (loading states, success/error toasts) | User experience |
| NFR-16 | Navigation must be intuitive with maximum 3 clicks to any feature | Easy navigation |

### 4.5 Scalability

| ID | Requirement | Description |
|----|-------------|-------------|
| NFR-17 | Architecture must support horizontal scaling of API servers | Add more servers as needed |
| NFR-18 | AI service must be independently deployable and scalable | Separate from main API |
| NFR-19 | Database must support sharding for future growth | MongoDB scalability |

### 4.6 Maintainability

| ID | Requirement | Description |
|----|-------------|-------------|
| NFR-20 | Code must follow consistent naming conventions | Readability |
| NFR-21 | Components must be modular and reusable | Code reuse |
| NFR-22 | API must follow RESTful conventions | Standard patterns |
| NFR-23 | Project must include documentation (README, reasoning.md) | Onboarding |

### 4.7 Compliance

| ID | Requirement | Description |
|----|-------------|-------------|
| NFR-24 | Medical data handling must follow basic privacy principles | Data protection |
| NFR-25 | AI diagnosis must always include disclaimer about clinical verification | Liability |
| NFR-26 | Prescriptions must include doctor verification details | Medical compliance |

---

## 5. System Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           MediFlow AI Architecture                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Patient   │    │   Doctor    │    │ Super Admin │    │  Lab Tech   │  │
│  │   Portal    │    │  Dashboard  │    │  (God Mode) │    │   Portal    │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │                  │         │
│         └──────────────────┴──────────────────┴──────────────────┘         │
│                                    │                                       │
│                          ┌─────────▼─────────┐                             │
│                          │  React Frontend   │   Port: 5173                │
│                          │  (Vite + Tailwind)│                             │
│                          └─────────┬─────────┘                             │
│                                    │ REST API Calls                        │
│         ┌──────────────────────────┼──────────────────────────┐            │
│         │                          │                          │            │
│  ┌──────▼──────┐           ┌───────▼───────┐          ┌───────▼───────┐    │
│  │   Node.js   │           │   Node.js     │          │   Python      │    │
│  │   Express   │◄──────────│   Express     │──────────►   FastAPI     │    │
│  │  Port: 5001 │           │  (Main API)   │          │  Port: 8000   │    │
│  └──────┬──────┘           └───────┬───────┘          └───────┬───────┘    │
│         │                          │                          │            │
│         │                  ┌───────▼───────┐          ┌───────▼───────┐    │
│         │                  │   MongoDB     │          │   PyTorch     │    │
│         └──────────────────►   Atlas       │          │  EfficientNet │    │
│                            │  (Cloud DB)   │          │   (X-Ray AI)  │    │
│                            └───────────────┘          └───────────────┘    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Three-Tier Architecture

| Tier | Technology | Port | Purpose |
|------|------------|------|---------|
| **Frontend** | React + Vite + Tailwind CSS | 5173 | User Interface Layer |
| **Backend API** | Node.js + Express | 5001 | Business Logic + REST API |
| **AI Microservice** | Python + FastAPI + PyTorch | 8000 | Medical Image Analysis |
| **Database** | MongoDB Atlas | Cloud | Persistent Data Storage |

---

## 6. Functional Full-Stack Flow

### 6.1 Patient Journey Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        PATIENT USER FLOW                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  1. AUTHENTICATION                                                         │
│     └──► LandingPage.jsx → Auth.jsx → POST /api/auth/login                 │
│         └──► JWT Token + User Data stored in localStorage                  │
│         └──► AuthContext.jsx manages global auth state                     │
│                                                                            │
│  2. BOOK APPOINTMENT                                                       │
│     └──► Dashboard.jsx → DoctorList.jsx → GET /api/doctors                 │
│         └──► Select Doctor → Select Slot → POST /api/appointments          │
│         └──► Optional: Attach Lab Report (Cloudinary URL)                  │
│                                                                            │
│  3. JOIN VIDEO CONSULTATION                                                │
│     └──► Dashboard.jsx → "Join Call" button → Opens meetingLink            │
│                                                                            │
│  4. VIEW PRESCRIPTION                                                      │
│     └──► Dashboard.jsx → PrescriptionViewer.jsx                            │
│         └──► GET /api/prescriptions/appointment/:appointmentId             │
│                                                                            │
│  5. PHARMACY PURCHASE                                                      │
│     └──► Pharmacy.jsx → ProductDetails.jsx → CartPage.jsx                  │
│         └──► CartContext.jsx manages cart state (localStorage)             │
│         └──► POST /api/orders → Order confirmation                         │
│                                                                            │
│  6. LAB TEST BOOKING                                                       │
│     └──► LabTests.jsx → GET /api/lab-tests                                 │
│         └──► Book with Home Collection or Lab Visit                        │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Doctor Journey Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        DOCTOR USER FLOW                                    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  1. AUTHENTICATION + ROLE CHECK                                            │
│     └──► Login → user.role === 'doctor' → Redirect to /doctor-dashboard   │
│                                                                            │
│  2. VIEW SCHEDULE                                                          │
│     └──► DoctorDashboard.jsx → GET /api/appointments/doctor/:doctorId     │
│         └──► ScheduleView shows today's appointments                       │
│                                                                            │
│  3. ACCESS PATIENT PROFILE                                                 │
│     └──► Click Patient Card → PatientProfileView component                │
│         └──► View attached lab reports (Cloudinary PDFs)                  │
│                                                                            │
│  4. AI X-RAY ANALYSIS                                                      │
│     └──► XRayScanner.jsx → Upload Image → POST to Python :8000            │
│         └──► Python FastAPI → EfficientNet-B0 → Returns prediction        │
│         └──► Result: { prediction: "PNEUMONIA", confidence: 0.94 }        │
│                                                                            │
│  5. WRITE CLINICAL REPORT (SOAP Notes)                                     │
│     └──► ClinicalReportBuilder.jsx → Fill SOAP form                       │
│         └──► POST /api/reports/save → MongoDB (clinicalReport model)      │
│                                                                            │
│  6. ISSUE PRESCRIPTION                                                     │
│     └──► PrescriptionModal.jsx → Fill diagnosis + medicines               │
│         └──► POST /api/prescriptions → Saves to MongoDB                   │
│         └──► Auto-updates appointment status to "completed"               │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Super Admin Journey Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                       SUPER ADMIN FLOW (GOD MODE)                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  1. ACCESS CONTROL                                                         │
│     └──► user.role === 'superadmin' → SuperAdminDashboard.jsx             │
│                                                                            │
│  2. SPY LOG (Audit Trail)                                                  │
│     └──► GET /api/admin/logs → Shows all sensitive actions                │
│         └──► "Dr. X viewed Patient Y's lab report at 14:32"               │
│                                                                            │
│  3. LIVE USER MAP                                                          │
│     └──► GET /api/users/online → Returns { isOnline: true } users         │
│         └──► Display on OpenStreetMap with real-time pins                 │
│                                                                            │
│  4. PLATFORM ANALYTICS                                                     │
│     └──► Total Revenue, Active Users, Server Health metrics              │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Feature Implementation

### 7.1 Authentication System

| Feature | Implementation |
|---------|---------------|
| **Registration** | `POST /api/auth/register` → bcrypt password hashing → JWT token |
| **Login** | `POST /api/auth/login` → Validate credentials → Return user + token |
| **Google OAuth** | `POST /api/auth/google` → Validate Google token → Create/login user |
| **Session Persistence** | `AuthContext.jsx` loads user from `localStorage` on mount |
| **Protected Routes** | `<ProtectedRoute>` HOC redirects to `/login` if no token |
| **Role-Based Routing** | Doctor auto-redirects to `/doctor-dashboard` via `useEffect` |

**Files Involved:**
- `client/src/context/AuthContext.jsx` — Global auth state management
- `server-node/controllers/auth.controller.js` — Auth logic
- `server-node/routes/auth.route.js` — Auth endpoints
- `server-node/models/user.model.js` — User schema with role enum

### 7.2 Appointment Booking System

| Feature | Implementation |
|---------|---------------|
| **Doctor Listing** | `GET /api/doctors` → Filters by specialization |
| **Slot Management** | `availableSlots[]` array in Doctor model |
| **Conflict Detection** | Check existing appointments before booking |
| **Attachment Upload** | Cloudinary integration for lab report PDFs |
| **Status Tracking** | `status: ["pending", "confirmed", "completed", "cancelled"]` |

**Data Flow:**
```
Patient selects Doctor → Chooses Date/Time → Optionally uploads PDF
    ↓
POST /api/appointments
    ↓
Server validates slot availability → Creates appointment
    ↓
Returns appointment with meetingLink for video call
```

### 7.3 E-Pharmacy Module

| Feature | Implementation |
|---------|---------------|
| **Product Catalog** | `Medicine` model with categories, pricing, stock |
| **Category Filtering** | Frontend filter + optional `?category=Vitamins` query |
| **Cart Management** | `CartContext.jsx` with localStorage persistence |
| **Quantity Control** | `updateQuantity(productId, 'increase'/'decrease')` |
| **Order Placement** | `POST /api/orders` → Creates Order with items snapshot |
| **Prescription Match** | `/magic-cart` endpoint fuzzy-matches Rx to pharmacy products |

**Cart State Structure:**
```javascript
{
  cart: [
    { _id, name, price, quantity, imageUrl }
  ],
  addToCart(product),
  removeFromCart(productId),
  updateQuantity(productId, action),
  clearCart(),
  totalItems, 
  totalPrice
}
```

### 7.4 AI Vision System (X-Ray Analysis)

| Component | Technology |
|-----------|------------|
| **Model** | EfficientNet-B0 (Transfer Learning) |
| **Framework** | PyTorch + torchvision |
| **API** | FastAPI (Python) |
| **Classes** | `['NORMAL', 'PNEUMONIA']` |
| **Training Data** | Chest X-Ray dataset (5,000+ images) |

**Integration Flow:**
```
React XRayScanner.jsx
    ↓ (FormData with image)
POST http://localhost:8000/api/vision/analyze
    ↓
Python FastAPI receives image bytes
    ↓
EfficientNet-B0 inference on MPS/CPU
    ↓
Returns: { prediction: "PNEUMONIA", confidence: 0.94, disclaimer: "..." }
    ↓
React displays result with clinical context
```

**AI Service Files:**
- `ai-service/main.py` — FastAPI server
- `ai-service/predict.py` — PyTorch inference logic
- `ai-service/model.py` — ResNet50 base (deprecated)
- `ai-service/mediflow_lungs_best.pth` — Trained model weights

### 7.5 Lab Report Analysis (Rule-Based)

| Panel | Analyzer File | Metrics Analyzed |
|-------|---------------|------------------|
| **CBC** | `cbc.analyzer.js` | Hemoglobin, WBC, RBC, Platelets |
| **RFT** | `rft.analyzer.js` | Creatinine, Urea, BUN, Uric Acid |
| **LFT** | `lft.analyzer.js` | ALT, AST, Bilirubin, Alkaline Phosphatase |
| **Lipid** | `lipid.analyzer.js` | Total Cholesterol, HDL, LDL, Triglycerides |

**Orchestrator Pattern:**
```javascript
// orchestrator.service.js
if (text.match(/Hemoglobin|WBC|RBC/i)) {
    analyzerPromises.push(analyzeCBC(text, patientMeta));
}
if (text.match(/Creatinine|Urea|BUN/i)) {
    analyzerPromises.push(analyzeRFT(text, patientMeta));
}
// ... etc
const results = await Promise.all(analyzerPromises);
```

### 7.6 Prescription System

| Feature | Implementation |
|---------|---------------|
| **SOAP Notes** | Structured format: Subjective, Objective, Assessment, Plan |
| **Medicine Table** | Linked to `Medicine` model for Magic Cart matching |
| **Digital Signature** | Base64 hash generated on pre-save hook |
| **PDF Generation** | Browser `window.print()` with print-specific CSS |
| **Verification** | Doctor license number + hospital registration stored |

**Prescription Schema Structure:**
```javascript
{
  appointmentId: ObjectId,
  doctorId: ObjectId,
  patientId: ObjectId,
  diagnosis: String,
  medicines: [{ name, strengthForm, frequency, days, route, instructions }],
  vitals: { bp, temp, pulse, weight },
  signature: String,
  verification: { licenseNumber, hospitalRegNumber, signatureHash }
}
```

---

## 8. Proper Integration

### 8.1 Frontend ↔ Backend Integration

| Integration Point | Method | Endpoint |
|-------------------|--------|----------|
| Auth | POST | `/api/auth/login`, `/api/auth/register` |
| Doctors | GET | `/api/doctors`, `/api/doctors/:id` |
| Appointments | GET/POST | `/api/appointments/*` |
| Prescriptions | GET/POST | `/api/prescriptions/*` |
| Pharmacy | GET | `/api/medicines` |
| Orders | POST | `/api/orders` |
| Lab Tests | GET | `/api/lab-tests` |
| Reports | POST | `/api/reports/save` |
| Vision AI | POST | `/api/vision/*` (proxied to Python) |

### 8.2 Node.js ↔ Python AI Integration

```javascript
// server-node/routes/image.route.js
const FormData = require('form-data');
const fetch = require('node-fetch');

router.post('/analyze', upload.single('image'), async (req, res) => {
    const formData = new FormData();
    formData.append('file', req.file.buffer, { filename: 'xray.jpg' });
    
    const aiResponse = await fetch('http://localhost:8000/api/vision/analyze', {
        method: 'POST',
        body: formData
    });
    
    const result = await aiResponse.json();
    res.json(result);
});
```

### 8.3 Context Providers (State Management)

```jsx
// App.jsx
<AuthProvider>      {/* Global auth state */}
  <CartProvider>    {/* Shopping cart state */}
    <Routes>
      {/* All routes have access to both contexts */}
    </Routes>
  </CartProvider>
</AuthProvider>
```

### 8.4 CORS Configuration

```javascript
// server-node/server.js
const allowedOrigins = [
  "http://localhost:5173",   // Vite dev server
  "http://127.0.0.1:5173",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

---

## 9. System Design Explanation

### 9.1 Why This Architecture?

| Decision | Reasoning |
|----------|-----------|
| **Microservice for AI** | Python has superior ML libraries (PyTorch). Separating AI allows independent scaling and updates without affecting main API. |
| **MongoDB (NoSQL)** | Flexible schema for medical data that varies by specialty. Easy embedding of nested objects (vitals, medicines array). |
| **JWT Authentication** | Stateless authentication allows horizontal scaling. Token contains user ID and role for quick validation. |
| **Context API over Redux** | Simpler for this scale. Auth and Cart are the only global states needed. |
| **Tailwind CSS** | Rapid UI development with utility classes. Consistent design system. Print-specific classes (`print:hidden`). |
| **Vite over CRA** | 10x faster HMR, native ES modules, better DX. |

### 9.2 Design Patterns Used

| Pattern | Usage |
|---------|-------|
| **MVC** | Models (Mongoose) + Controllers + Routes |
| **Repository Pattern** | Controllers abstract database operations |
| **Factory Pattern** | `orchestrator.service.js` dynamically selects analyzers |
| **Provider Pattern** | React Context for global state |
| **Protected Route HOC** | Authorization wrapper component |
| **Pre-save Hooks** | Mongoose middleware for data transformation |

### 9.3 Scalability Considerations

```
                    Load Balancer
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     Node Server    Node Server    Node Server
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                  MongoDB Atlas
                  (Auto-scaling)
                  
     ┌───────────────────────────────────────┐
     │       AI Service (Separate)           │
     │  Can be deployed on GPU instances     │
     │  Independent scaling from main API    │
     └───────────────────────────────────────┘
```

---

## 10. Database Schema & Relationships

### 10.1 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Doctor    │       │   Medicine  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ _id         │◄──────│ userId (FK) │       │ _id         │
│ fullName    │       │ name        │       │ name        │
│ email       │       │ specialization      │ price       │
│ password    │       │ experience  │       │ category    │
│ role        │       │ consultationFee     │ stock       │
│ subscription│       │ availableSlots      │ imageUrl    │
└──────┬──────┘       └──────┬──────┘       └──────┬──────┘
       │                     │                     │
       │    ┌────────────────┴────────┐            │
       │    ▼                         ▼            │
       │  ┌─────────────┐    ┌─────────────┐      │
       │  │ Appointment │    │Prescription │      │
       │  ├─────────────┤    ├─────────────┤      │
       └──► patientId   │    │ appointmentId◄─────┤
          │ doctorId ◄──┘    │ doctorId    │      │
          │ date        │    │ patientId   │      │
          │ timeSlot    │    │ medicines[] ◄──────┘
          │ status      │    │ diagnosis   │
          │ meetingLink │    │ signature   │
          └─────────────┘    └─────────────┘

┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Order     │       │ LabTest     │       │ClinicalReport
├─────────────┤       ├─────────────┤       ├─────────────┤
│ patientId   │       │ name        │       │ patientId   │
│ items[]     │       │ category    │       │ doctorId    │
│ totalAmount │       │ price       │       │ soap{}      │
│ status      │       │ turnaroundTime      │ status      │
└─────────────┘       └─────────────┘       └─────────────┘

┌─────────────┐       ┌─────────────┐
│ImagingReport│       │  AccessLog  │
├─────────────┤       ├─────────────┤
│ patientId   │       │ actorId     │
│ prediction  │       │ action      │
│ confidence  │       │ targetId    │
│ scanType    │       │ timestamp   │
└─────────────┘       └─────────────┘
```

### 10.2 Model Files Summary

| Model | File | Purpose |
|-------|------|---------|
| User | `user.model.js` | Patients, Doctors, Admins (role-based) |
| Doctor | `doctor.model.js` | Doctor profile extending User |
| Appointment | `appointment.model.js` | Consultation bookings |
| Prescription | `prescription.model.js` | Medical prescriptions |
| Medicine | `medicine.model.js` | Pharmacy products |
| Order | `order.model.js` | Pharmacy orders |
| LabTest | `labTest.model.js` | Lab test catalog |
| LabReport | `labReport.model.js` | Patient lab results |
| ClinicalReport | `clinicalReport.model.js` | SOAP notes from doctors |
| ImagingReport | `imagingReport.model.js` | AI X-ray analysis results |
| AccessLog | `accessLog.model.js` | Audit trail for Super Admin |

---

## 11. Security Implementation

### 11.1 Authentication Security

| Measure | Implementation |
|---------|---------------|
| **Password Hashing** | bcrypt with salt rounds |
| **JWT Tokens** | Signed with `JWT_SECRET`, stored in localStorage |
| **Token Verification** | `verifyToken.js` middleware on protected routes |
| **Role-Based Access** | Middleware checks `user.role` before controller execution |

### 11.2 Data Protection

| Measure | Implementation |
|---------|---------------|
| **Environment Variables** | `.env` file for secrets (not committed) |
| **CORS Whitelist** | Only allowed origins can access API |
| **Input Validation** | Mongoose schema validation + required fields |
| **Audit Logging** | AccessLog model tracks sensitive actions |

### 11.3 .gitignore Security

```gitignore
# Secrets
.env
.env.*
!.env.example
serviceAccountKey.json

# Large files that shouldn't be in repo
ai-service/dataset/
node_modules/
venv/
```

---

## 12. Organized GitHub Usage

### 12.1 Repository Structure

```
mediflow-ai/
├── .gitignore              # Comprehensive ignore rules
├── LICENSE                 # MIT License
├── README.md               # Project overview & setup
├── reasoning.md            # This technical document
├── design.md               # UI/UX design specifications
│
├── client/                 # React Frontend
│   ├── src/
│   │   ├── pages/          # Route components
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context providers
│   │   └── lib/            # Utility functions
│   ├── package.json
│   └── vite.config.js
│
├── server-node/            # Node.js Backend
│   ├── controllers/        # Business logic
│   ├── routes/             # API endpoints
│   ├── models/             # Mongoose schemas
│   ├── services/           # Lab analyzers, orchestrator
│   ├── middleware/         # Auth verification
│   ├── config/             # Cloudinary config
│   ├── utils/              # Helper functions
│   ├── package.json
│   └── server.js           # Entry point
│
└── ai-service/             # Python AI Microservice
    ├── main.py             # FastAPI server
    ├── predict.py          # PyTorch inference
    ├── model.py            # Model architecture
    ├── train_model.py      # Training script
    └── mediflow_lungs_best.pth  # Trained weights
```

### 12.2 Commit Convention

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature implementation |
| `fix:` | Bug fixes |
| `docs:` | Documentation updates |
| `style:` | Code formatting (no logic change) |
| `refactor:` | Code restructuring |
| `chore:` | Build/config changes |

**Example Commits:**
```
feat: add .gitignore, remove venv/dataset/.env from tracking
feat: complete ecosystem - pharmacy, lab tests, super admin spy mode
fix: resolve Mongoose 9 pre-save hook async compatibility
```

### 12.3 Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `feature/*` | New feature development |
| `fix/*` | Bug fix branches |

### 12.4 Files NOT Committed (Protected by .gitignore)

- `.env` files (secrets)
- `node_modules/` (dependencies)
- `venv/` (Python virtual environment)
- `ai-service/dataset/` (5GB+ training images)
- `.DS_Store` (macOS system files)
- `*.log` files

---

## 13. API Endpoint Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new user |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/google` | Google OAuth login |
| POST | `/api/auth/logout` | Set user offline |
| POST | `/api/auth/promote` | Promote user to doctor |
| POST | `/api/auth/demote` | Demote doctor to patient |

### Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List all doctors |
| GET | `/api/doctors/:id` | Get doctor by ID |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments/patient/:patientId` | Patient's appointments |
| GET | `/api/appointments/doctor/:doctorId` | Doctor's appointments |
| POST | `/api/appointments` | Create appointment |
| PUT | `/api/appointments/cancel/:id` | Cancel appointment |

### Prescriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/prescriptions` | Create prescription |
| GET | `/api/prescriptions/appointment/:id` | Get by appointment |
| POST | `/api/prescriptions/appointment/:id/magic-cart` | Match Rx to pharmacy |

### Pharmacy
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/medicines` | List products |
| GET | `/api/medicines/:id` | Product details |
| POST | `/api/orders` | Place order |

### Lab Tests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lab-tests` | List available tests |
| POST | `/api/labs/analyze` | AI analysis of lab PDF |

### Vision AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/vision/analyze` | X-Ray AI analysis |
| POST | `/api/vision/save` | Save imaging report |
| GET | `/api/vision/patient/:id` | Patient's imaging reports |

### Clinical Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports/save` | Save SOAP clinical report |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/logs` | Audit trail logs |
| GET | `/api/users/online` | List online users |

---

## 14. Future Roadmap

### Phase 1: Enhanced AI (Q2 2026)
- [ ] Multi-class X-Ray detection (COVID, Tuberculosis, Cardiomegaly)
- [ ] Integration with Google Gemini for prescription OCR
- [ ] Voice-to-text for clinical notes

### Phase 2: Payment & Notifications (Q3 2026)
- [ ] Stripe/Razorpay payment gateway
- [ ] Email notifications via Nodemailer
- [ ] SMS alerts for appointment reminders

### Phase 3: Mobile & Scaling (Q4 2026)
- [ ] React Native mobile app
- [ ] Kubernetes deployment
- [ ] Real-time chat with WebSockets

### Phase 4: Advanced Analytics (2027)
- [ ] GraphRAG integration for clinical knowledge graphs
- [ ] Predictive analytics dashboard
- [ ] Insurance claim automation

---

## Summary

MediFlow AI demonstrates a **production-grade healthcare platform** with:

✅ **Complete Authentication** — JWT + Role-based access (Patient/Doctor/Admin)  
✅ **Real-time Appointment System** — Conflict detection, video call links  
✅ **E-Pharmacy** — Full cart management with order tracking  
✅ **AI-Powered Diagnostics** — PyTorch EfficientNet for X-Ray analysis  
✅ **Structured Clinical Data** — SOAP notes ready for future RAG/ML pipelines  
✅ **Super Admin Oversight** — Audit logs and live user monitoring  
✅ **Clean Codebase** — Organized folders, proper .gitignore, documented APIs  

The architecture separates concerns effectively, allowing each component (frontend, API, AI) to scale independently while maintaining clean integration points.

---

*Document generated: February 2026*  
*Author: MediFlow AI Development Team*
