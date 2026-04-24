<div align="center">

# 🧬 MediFlow AI

### *Intelligent Healthcare Ecosystem Powered by Multi-Modal AI*

[![Version](https://img.shields.io/badge/Version-4.0-0d6efd?style=for-the-badge&logo=semanticrelease&logoColor=white)](https://github.com/solomonpattapu/mediflow-ai)
[![Stack](https://img.shields.io/badge/MERN_+_FastAPI-Full_Stack-6f42c1?style=for-the-badge&logo=stackblitz&logoColor=white)](#-architecture)
[![AI](https://img.shields.io/badge/PyTorch-Ensemble_Vision-ee4c2c?style=for-the-badge&logo=pytorch&logoColor=white)](#-ai-engine)
[![Graph](https://img.shields.io/badge/Neo4j-Graph_RAG-4581c3?style=for-the-badge&logo=neo4j&logoColor=white)](#-graph-rag-pipeline)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](LICENSE)

<br/>

> **MediFlow AI** is a production-grade, tri-service healthcare platform that unifies **patient management**, **e-pharmacy**, **smart diagnostics**, and a **dual-architecture deep learning ensemble** into a single, cohesive medical ecosystem. It features a **Graph-RAG knowledge pipeline** backed by Neo4j, **Grad-CAM explainability**, and **real-time clinical risk stratification** — all orchestrated through a React-based intelligent interface.

<br/>

---

**[🚀 Quick Start](#-quick-start)** · **[🧠 AI Engine](#-ai-engine--dual-brain-ensemble)** · **[📐 Architecture](#-system-architecture)** · **[🩺 Modules](#-platform-modules)** · **[📊 API Reference](#-api-reference)**

---

</div>

<br/>

## ✨ Highlights

| Capability | Description |
|---|---|
| 🧠 **Dual-Brain Ensemble** | DenseNet-121 (texture) + ResNet-50 (structural) with max-confidence ensembling |
| 🔬 **14-Class Pathology Detection** | From Pneumonia to Nodule/Mass — multi-label chest X-ray analysis |
| 🗺️ **Grad-CAM Heatmaps** | Visual explainability overlaid on the original radiograph |
| 💎 **Gemini Vision Synthesis** | Google Gemini 2.5 Flash provides natural-language clinical interpretation |
| 🕸️ **Graph-RAG Pipeline** | Neo4j knowledge graph + vector search + Groq LLM for patient-specific medical Q&A |
| 🏥 **Complete Healthcare Suite** | E-Pharmacy, Lab Booking, Appointments, Prescriptions, Payments (Razorpay) |
| 🕵️ **Super Admin Observatory** | Audit trails, live user maps, and global platform analytics |
| 🔐 **Enterprise Auth** | Firebase + JWT with Role-Based Access Control (Patient / Doctor / Admin / Super Admin) |

<br/>

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      MediFlow AI — Tri-Service Architecture        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐   ┌────────────────┐ │
│  │   React Client   │◄──►│  Node.js / Express│◄──►│   MongoDB     │ │
│  │   (Vite + TW)    │    │   REST API Server │   │   Atlas        │ │
│  │   Port: 5173     │    │   Port: 5001      │   │   (Mongoose)   │ │
│  └──────┬───────────┘    └──────┬───────────┘   └────────────────┘ │
│         │                       │                                   │
│         │  ┌────────────────────┴──────────────────────┐           │
│         │  │          FastAPI · AI Microservice         │           │
│         └──►       Python · PyTorch · Port: 8000       │           │
│            │                                           │           │
│            │  ┌─────────────┐   ┌──────────────────┐  │           │
│            │  │ DenseNet-121│   │   ResNet-50      │  │           │
│            │  │  (Texture)  │   │  (Structural)    │  │           │
│            │  └──────┬──────┘   └───────┬──────────┘  │           │
│            │         └──────┬───────────┘              │           │
│            │     Max-Confidence Ensemble               │           │
│            │         ┌──────┴──────────┐               │           │
│            │         │ Gemini 2.5 Flash│               │           │
│            │         │ (VLM Synthesis) │               │           │
│            │         └─────────────────┘               │           │
│            │                                           │           │
│            │  ┌────────────┐   ┌───────────────────┐  │           │
│            │  │  Neo4j DB  │◄──►│ Sentence-BERT    │  │           │
│            │  │  (Graph)   │   │ + Groq LLaMA 3.1 │  │           │
│            │  └────────────┘   └───────────────────┘  │           │
│            │       ▲ Graph-RAG Pipeline                │           │
│            └───────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

| Service | Stack | Responsibilities |
|---|---|---|
| **Client** | React 18, Vite, Tailwind CSS, Lucide Icons, Firebase | SPA with role-based dashboards, real-time UI |
| **API Server** | Node.js, Express 5, Mongoose 9, JWT, Cloudinary, Razorpay | RESTful API, auth, data models, payments, file storage |
| **AI Service** | Python, FastAPI, PyTorch, Neo4j, Groq, Google GenAI | Vision inference, Graph-RAG, chatbot, PDF ingestion |

<br/>

## 🧠 AI Engine — Dual-Brain Ensemble

MediFlow's diagnostic core uses a **dual-architecture ensemble** that combines two complementary deep learning models to analyze chest X-rays against **14 pathology classes**:

### Pathology Classes
```
No Finding · Pneumonia · Cardiomegaly · Pleural Effusion · Pneumothorax
Atelectasis · Consolidation · Lung Opacity · Nodule/Mass · Infiltration
Fibrosis · Pleural Thickening · Calcification · Other Lesion
```

### Model Pipeline

```
                         ┌──────────────────────┐
        Input Image ────►│  224×224 Normalized   │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼                               ▼
          ┌─────────────────┐             ┌─────────────────┐
          │  DenseNet-121   │             │    ResNet-50     │
          │  ImageBranch    │             │   ResNetBranch   │
          │  1024-d embed   │             │   2048-d embed   │
          └────────┬────────┘             └────────┬────────┘
                   │                               │
          ┌────────┴────────┐             ┌────────┴────────┐
          │ ClinicalBranch  │             │ ClinicalBranch  │
          │ 15 → 32 → 16-d │             │ 15 → 32 → 16-d │
          │   (LayerNorm)   │             │   (LayerNorm)   │
          └────────┬────────┘             └────────┬────────┘
                   │                               │
          ┌────────┴────────┐             ┌────────┴────────┐
          │  Fusion Head    │             │  Fusion Head    │
          │ 1040 → 256 → 14│             │ 2064 → 256 → 14│
          └────────┬────────┘             └────────┬────────┘
                   │                               │
                   ▼ σ(logits/T)                   ▼ σ(logits/T)
              probs_densenet                  probs_resnet
                   │                               │
                   └───────────┬───────────────────┘
                               ▼
                   max(probs_d, probs_r)
                     Max-Confidence
                      Ensembling
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
              Risk Score   Heatmap   Gemini VLM
              (1-10)      (Grad-CAM) (Clinical
                                      Synthesis)
```

### Clinical Feature Ingestion (15-Dimensional Vector)

| Index | Feature | Normalization |
|---|---|---|
| 0 | Age | `/100.0` |
| 1 | Sex | Binary (M=1, F=0) |
| 2 | Temperature | `(T - 36.0) / 4.0` |
| 3 | SpO₂ | `(O₂ - 80.0) / 20.0` |
| 4 | Heart Rate | `(HR - 40.0) / 160.0` |
| 5–14 | Symptoms | Binary flags (cough, fever, SOB, chest pain, fatigue, wheezing, night sweats, weight loss, hemoptysis, sputum) |

### Risk Stratification Engine

| Risk Score | Level | Urgency | Action |
|---|---|---|---|
| **8.0–10.0** | 🔴 Critical | STAT | Immediate physician review |
| **6.0–7.9** | 🟠 High | Urgent | Review within 1 hour |
| **4.0–5.9** | 🟡 Moderate | Semi-Urgent | Review within 4 hours |
| **2.5–3.9** | 🟢 Low | Routine | Standard 24-hour workflow |
| **1.0–2.4** | ⚪ Minimal | Non-Urgent | No abnormalities flagged |

<br/>

## 🕸️ Graph-RAG Pipeline

MediFlow implements a **Retrieval-Augmented Generation** pipeline backed by a **Neo4j knowledge graph** for personalized patient Q&A:

```
                   ┌─────────────────┐
                   │  PDF Upload     │
  Patient Report   │  (Medical Doc)  │
  ────────────────►│                 │
                   └────────┬────────┘
                            │ PyPDF2
                            ▼
                   ┌─────────────────┐
                   │ Text Extraction │
                   │ & Chunking      │
                   │ (300 chars,     │
                   │  50 overlap)    │
                   └────────┬────────┘
                            │
              ┌─────────────┼──────────────┐
              ▼                            ▼
    ┌──────────────────┐        ┌──────────────────┐
    │ Groq LLaMA 3.1   │        │ Sentence-BERT    │
    │ Entity Extraction│        │ all-MiniLM-L6-v2 │
    │ (Disease / Focus)│        │ Vector Embedding  │
    └────────┬─────────┘        └────────┬─────────┘
             │                           │
             └───────────┬───────────────┘
                         ▼
              ┌──────────────────┐
              │     Neo4j DB     │
              │                  │
              │ (Patient)──HAS──►│
              │    DIAGNOSIS     │
              │ (Event)──FOR──►  │
              │    DISEASE       │
              └──────────────────┘
                         │
          User Question  │ Vector Similarity Search
          ──────────────►│ (cosine, threshold ≥ 0.70)
                         ▼
              ┌──────────────────┐
              │  Groq LLaMA 3.1  │
              │  Context-Aware   │
              │  Response Gen    │
              └──────────────────┘
```

<br/>

## 🩺 Platform Modules

### 👤 Patient Portal
- **Smart Appointment Booking** — Real-time slot availability with conflict detection
- **E-Pharmacy** — Full e-commerce flow with cart, categories, search, and Razorpay checkout
- **Smart Lab Tests** — Home Collection vs. Lab Visit with geo-based filtering
- **AI X-Ray Scanner** — Upload chest X-rays for instant AI diagnostic analysis
- **AI Chat Assistant** — Graph-RAG powered medical Q&A with personal health context
- **Prescription Management** — Digital prescriptions with PDF generation and viewer
- **Clinical Reports** — Structured report builder and viewer

### 👨‍⚕️ Doctor Dashboard
- **Live Appointment Feed** — Real-time schedule with patient queue management
- **Patient Records** — Complete medical history, imaging reports, and clinical notes
- **AI Co-Pilot Chatbot** — Context-aware assistant for clinical decision support
- **Prescription Writer** — Digital prescription creation with medication database
- **Video Consultation** — Integrated telehealth interface

### 🕵️ Super Admin — Observatory Mode
- **Audit Trail ("Spy Log")** — Every sensitive action logged with actor, target, and timestamp
- **Live User Map** — Real-time geographic tracking of active platform users
- **Global Analytics** — Revenue metrics, server health, user demographics
- **Platform Administration** — User management, role assignment, content moderation

### 🛡️ Admin Panel
- **Medicine Catalog Management** — CRUD operations with Cloudinary image upload
- **Lab Test Configuration** — Service and pricing management
- **Doctor Onboarding** — Profile creation and credential verification

<br/>

## 📊 API Reference

### AI Service (FastAPI — Port 8000)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/vision/analyze` | Multimodal X-ray analysis (image + clinical JSON) |
| `POST` | `/api/chat` | Doctor AI co-pilot chatbot |
| `POST` | `/api/chat-title` | Auto-generate chat session titles |
| `POST` | `/api/graph-chat` | Graph-RAG patient Q&A |
| `POST` | `/api/ingest-patient-report` | PDF ingestion into knowledge graph |

### Node.js API Server (Express — Port 5001)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | User registration with role assignment |
| `POST` | `/api/auth/login` | JWT authentication |
| `GET` | `/api/doctors` | List / filter doctors |
| `POST` | `/api/appointments` | Book appointment with conflict check |
| `GET/POST` | `/api/medicines` | Medicine catalog CRUD |
| `POST` | `/api/orders` | Place pharmacy order |
| `GET/POST` | `/api/labs` | Lab test management |
| `GET/POST` | `/api/prescriptions` | Prescription CRUD with PDF support |
| `POST` | `/api/vision/upload` | X-ray upload proxy to AI service |
| `GET` | `/api/admin/*` | Admin analytics and management |
| `POST` | `/api/payments/*` | Razorpay payment integration |
| `GET/POST` | `/api/chats` | Chat history persistence |
| `GET/POST` | `/api/reports` | Clinical report management |

<br/>

## 🗄️ Data Models

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│     User     │────►│    Doctor     │────►│ Appointment  │
│  (RBAC)      │     │  (Profile)   │     │ (Scheduling) │
└──────┬───────┘     └──────────────┘     └──────────────┘
       │
       ├──►┌──────────────┐     ┌──────────────┐
       │   │    Order     │────►│   Medicine   │
       │   │  (Pharmacy)  │     │  (Catalog)   │
       │   └──────────────┘     └──────────────┘
       │
       ├──►┌──────────────┐     ┌──────────────┐
       │   │ Prescription │────►│   Chat       │
       │   │  (Digital Rx)│     │  (History)   │
       │   └──────────────┘     └──────────────┘
       │
       ├──►┌──────────────┐     ┌──────────────┐
       │   │  Lab Appt    │────►│   Lab Test   │
       │   │  (Booking)   │     │  (Catalog)   │
       │   └──────────────┘     └──────────────┘
       │
       ├──►┌──────────────┐     ┌──────────────┐
       │   │ Lab Report   │     │ Lab Reference│
       │   │              │     │  (Standards) │
       │   └──────────────┘     └──────────────┘
       │
       ├──►┌──────────────┐     ┌──────────────┐
       │   │Clinical Rpt  │     │ Imaging Rpt  │
       │   │  (Structured)│     │ (AI Results) │
       │   └──────────────┘     └──────────────┘
       │
       └──►┌──────────────┐
           │  Access Log  │
           │  (Audit)     │
           └──────────────┘
```

<br/>

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18.x |
| Python | ≥ 3.10 |
| MongoDB | Atlas (cloud) or local |
| Neo4j | Aura (cloud) or local |

### 1️⃣ Clone & Setup

```bash
git clone https://github.com/solomonpattapu/mediflow-ai.git
cd mediflow-ai
```

### 2️⃣ Node.js API Server

```bash
cd server-node
npm install
```

Create `.env`:
```env
PORT=5001
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/mediflow
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

```bash
npm run dev   # Starts on port 5001
```

### 3️⃣ React Client

```bash
cd client
npm install
```

Configure Firebase in `src/firebase.js`, then:

```bash
npm run dev   # Starts on port 5173
```

### 4️⃣ AI Microservice

```bash
cd ai-service
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.md
```

Create `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key
NEO4J_URI=neo4j+s://your-instance.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
GROQ_API_KEY=your_groq_api_key
```

```bash
uvicorn main:app --reload --port 8000
```

### 5️⃣ Seed Data (Optional)

```bash
cd server-node
node seed-doctor.js       # Populate doctor profiles
node seed-lab-tests.js    # Populate lab test catalog
node create-admin.js      # Create admin account
```

<br/>

## 📁 Project Structure

```
mediflow-ai/
├── client/                          # React SPA (Vite)
│   └── src/
│       ├── components/
│       │   ├── AuthCard.jsx         # Login / Register forms
│       │   ├── ClinicalReportBuilder.jsx
│       │   ├── ClinicalReportViewer.jsx
│       │   ├── CreativeFooter.jsx
│       │   ├── DoctorList.jsx
│       │   ├── MedicalChatbot.jsx
│       │   ├── PrescriptionModal.jsx
│       │   ├── PrescriptionViewer.jsx
│       │   ├── PricingSection.jsx
│       │   ├── VideoConsultation.jsx
│       │   └── ui/                  # Reusable UI primitives
│       ├── context/
│       │   ├── AuthContext.jsx      # Firebase auth provider
│       │   └── CartContext.jsx      # Shopping cart state
│       ├── pages/
│       │   ├── LandingPage.jsx      # Public hero + features
│       │   ├── Dashboard.jsx        # Patient portal
│       │   ├── DoctorDashboard.jsx  # Doctor workspace
│       │   ├── SuperAdminDashboard.jsx
│       │   ├── Pharmacy.jsx         # E-commerce store
│       │   ├── CartPage.jsx         # Cart + checkout
│       │   ├── LabTests.jsx         # Lab booking
│       │   ├── XRayScanner.jsx      # AI diagnostic interface
│       │   ├── PatientChatPortal.jsx # Graph-RAG chat UI
│       │   ├── AdminUpload.jsx      # Content management
│       │   └── ProductDetails.jsx   # Medicine detail view
│       └── firebase.js
│
├── server-node/                     # Express REST API
│   ├── controllers/                 # Business logic (9 controllers)
│   ├── models/                      # Mongoose schemas (14 models)
│   ├── routes/                      # API routes (14 route files)
│   ├── middleware/
│   │   └── verifyToken.js           # JWT authentication guard
│   ├── services/
│   │   ├── orchestrator.service.js  # Multi-service coordination
│   │   └── summary.service.js      # AI-powered summaries
│   ├── server.js                    # Express app entry point
│   └── seed-*.js                    # Database seeders
│
├── ai-service/                      # FastAPI AI Microservice
│   ├── main.py                      # API endpoints + Graph-RAG
│   ├── predict_multimodal.py        # Ensemble inference pipeline
│   ├── predict_multilabel.py        # Multi-label classifier
│   ├── model.py                     # Legacy model definitions
│   ├── train_model.py               # Training scripts
│   ├── init_graph.py                # Neo4j schema initialization
│   ├── mediflow_production_v1.pth   # DenseNet-121 weights
│   ├── mediflow_resnet_production.pth # ResNet-50 weights
│   └── dataset/                     # Training data
│
├── documentation/                   # IEEE paper, design docs, analysis
├── LICENSE
└── README.md
```

<br/>

## 🛠️ Tech Stack Deep Dive

<table>
<tr>
<td width="50%" valign="top">

### Frontend
- **React 18** — Component-driven UI
- **Vite** — Lightning-fast HMR & builds
- **Tailwind CSS** — Utility-first styling
- **Lucide React** — Beautiful icon library
- **React Router v6** — Client-side routing
- **React Hot Toast** — Notification system
- **Firebase** — Authentication provider

</td>
<td width="50%" valign="top">

### Backend (Node.js)
- **Express 5** — Web framework
- **Mongoose 9** — MongoDB ODM
- **JWT** — Token-based auth
- **Cloudinary** — Image CDN & upload
- **Multer** — Multipart file handling
- **Razorpay** — Payment processing
- **bcryptjs** — Password hashing

</td>
</tr>
<tr>
<td width="50%" valign="top">

### AI & ML
- **PyTorch** — Deep learning framework
- **DenseNet-121** — Texture feature extraction
- **ResNet-50** — Structural feature extraction
- **OpenCV** — Image processing & Grad-CAM
- **Google Gemini 2.5 Flash** — Vision LLM
- **Groq (LLaMA 3.1)** — Fast LLM inference
- **Sentence-BERT** — Semantic embeddings

</td>
<td width="50%" valign="top">

### Infrastructure
- **MongoDB Atlas** — Cloud database
- **Neo4j Aura** — Graph database
- **FastAPI** — Async Python API
- **Pydantic** — Data validation
- **LangChain** — Text chunking
- **PyPDF2** — Document parsing
- **CORS** — Cross-origin security

</td>
</tr>
</table>

<br/>

## 🔒 Security

| Layer | Implementation |
|---|---|
| **Authentication** | Firebase Auth + JWT token verification middleware |
| **Authorization** | Role-Based Access Control (Patient, Doctor, Admin, Super Admin) |
| **API Security** | CORS whitelisting with origin validation |
| **Password Storage** | bcryptjs hashing with salt rounds |
| **Audit Logging** | Every sensitive operation logged with actor + timestamp |
| **Token Management** | Short-lived JWTs with secure cookie handling |
| **Input Validation** | Server-side validation on all API endpoints |

<br/>

## 🗺️ Roadmap

- [x] Dual-Brain Ensemble (DenseNet + ResNet)
- [x] Grad-CAM Visual Explainability
- [x] Graph-RAG Knowledge Pipeline
- [x] Gemini Vision LLM Integration
- [x] E-Pharmacy with Cart & Checkout
- [x] Lab Test Booking with Geolocation
- [x] Razorpay Payment Gateway
- [x] Doctor AI Co-Pilot Chatbot
- [x] Super Admin Audit System
- [x] PDF Report Ingestion to Knowledge Graph
- [ ] MC Dropout Uncertainty Quantification
- [ ] Per-Class Threshold Optimization (Youden Index)
- [ ] Temperature Scaling Calibration
- [ ] Cross-Dataset Validation (CheXpert)
- [ ] HIPAA Compliance & Audit Certification
- [ ] Mobile App (React Native)

<br/>

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<br/>

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<br/>

---

<div align="center">

**Built with 🫀 by [Solomon Pattapu](https://github.com/solomonpattapu)**

*Empowering healthcare through intelligent technology*

<br/>

[![GitHub](https://img.shields.io/badge/GitHub-solomonpattapu-181717?style=flat-square&logo=github)](https://github.com/solomonpattapu)

</div>