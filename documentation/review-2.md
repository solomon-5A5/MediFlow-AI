# MediFlow AI — Review 2 Document

> **Project Title:** MediFlow AI: An AI-Augmented Integrated Digital Healthcare Platform with Hybrid Graph-RAG for Post-Consultation Patient Support  
> **Author:** Solomon Pattapu  
> **Date:** March 2026  
> **Institution:** [University Name]  

---

## Table of Contents

1. [Abstract](#1-abstract)
2. [Problem Statement](#2-problem-statement)
3. [Literature Survey — Part I: Foundational Works](#3-literature-survey--part-i-foundational-works)
4. [Literature Survey — Part II: Contemporary Research](#4-literature-survey--part-ii-contemporary-research)
5. [Proposed System](#5-proposed-system)
6. [Requirements](#6-requirements)
7. [Methodology](#7-methodology)
8. [System Architecture](#8-system-architecture)
9. [Design: Use Case Diagram](#9-design-use-case-diagram)
10. [Class Diagram](#10-class-diagram)
11. [Sequence Diagram](#11-sequence-diagram)
12. [Implementation](#12-implementation)
13. [Results](#13-results)
14. [Conclusion and Future Scope](#14-conclusion-and-future-scope)

---

## 1. Abstract

Contemporary healthcare delivery remains fundamentally fragmented — patients navigate disconnected appointment portals, pharmacy systems, laboratory services, and diagnostic tools, each operating in its own data silo. This fragmentation leads to lost medical records, delayed diagnoses, communication breakdowns between providers, and suboptimal patient outcomes. Furthermore, patients frequently struggle to comprehend clinical findings and lack accessible channels for post-consultation clarification.

**MediFlow AI** addresses these systemic challenges through the design and implementation of a unified, AI-augmented digital healthcare platform that integrates appointment management, digital prescriptions, e-pharmacy, smart laboratory booking, AI-assisted chest X-ray diagnostics, and a novel **Hybrid Graph-RAG (Retrieval-Augmented Generation)** system for safe, grounded post-consultation patient query resolution.

The platform employs a three-tier microservices architecture: a **React (Vite)** frontend for responsive user interfaces, a **Node.js/Express** backend for business logic and REST API orchestration, and a **Python FastAPI** AI microservice hosting a **DenseNet-121** multi-label chest X-ray classifier trained on the VinDr-CXR dataset capable of triaging 14 thoracic pathologies. The Graph-RAG subsystem combines **Neo4j** graph database for patient-specific medical context with **vector-based retrieval** of curated medical knowledge, enabling a Large Language Model (LLM) to generate accurate, citation-backed, and safety-constrained responses to patient queries — strictly limited to post-consultation explanatory support rather than diagnosis or prescription.

The system enforces role-based access control (RBAC) across three principal user roles (Patient, Doctor, Super Admin), maintains comprehensive audit logging for regulatory compliance, and implements a clinical triage pipeline that classifies X-ray findings into high-priority, secondary, and ruled-out categories with severity scoring. Evaluation demonstrates that the multi-label DenseNet-121 classifier achieves competitive AUC scores across the 14-disease taxonomy, while the hybrid RAG approach produces responses with higher factual grounding and source traceability compared to standalone LLM queries.

**Keywords:** Digital Healthcare, Medical AI, Chest X-Ray Classification, DenseNet-121, Retrieval-Augmented Generation, Knowledge Graphs, Graph-RAG, Telemedicine, MERN Stack, Microservices Architecture

---

## 2. Problem Statement

### 2.1 Context and Motivation

Healthcare systems worldwide face a compounding crisis of fragmentation, access inequality, and information overload. According to the World Health Organization (WHO), approximately half the global population lacks access to essential health services, and out-of-pocket health expenses push roughly 100 million people into extreme poverty annually. Even in digitally advanced regions, the healthcare experience is characterized by:

1. **Fragmented Patient Journeys:** A typical patient interaction involves separate systems for appointment booking, consultation, prescription management, pharmacy purchases, laboratory tests, and medical record storage. Each transition introduces friction, data loss, and delays. Studies indicate that patients in fragmented systems experience 30–40% higher rates of medical errors due to information gaps between providers.

2. **Information Asymmetry:** After a consultation, patients are frequently left with clinical reports, lab results, and prescriptions that they cannot fully understand. Medical terminology, reference ranges, and clinical implications are opaque to the average patient. Research shows that low health literacy affects approximately 36% of adults in the United States alone and correlates with poorer health outcomes, higher hospitalization rates, and increased mortality.

3. **Diagnostic Bottlenecks:** Globally, there is a severe shortage of radiologists. The WHO estimates that two-thirds of the world's population has no access to diagnostic imaging. Even where available, radiologist workload leads to fatigue, with studies documenting diagnostic error rates of 3–5% in radiology. AI-assisted triage has the potential to reduce reporting times and prioritize critical cases.

4. **Limited Post-Consultation Support:** Once a consultation ends, patients have no structured mechanism to ask follow-up questions about their diagnosis, medication, or lifestyle recommendations. This gap leads to medication non-adherence (estimated at 50% for chronic diseases), unnecessary repeat visits, and patient anxiety.

5. **Security and Compliance Deficits:** Sensitive health data is often stored across insecure, disconnected systems. Healthcare data breaches affected over 133 million records in 2023 alone (U.S. Department of Health and Human Services). The absence of comprehensive audit trails makes regulatory compliance with frameworks such as HIPAA, GDPR, and India's Digital Information Security in Healthcare Act (DISHA) exceedingly difficult.

### 2.2 Problem Definition

The core problem addressed by MediFlow AI can be formally stated as:

> *How can a unified digital healthcare platform integrate appointment scheduling, clinical documentation, pharmacy services, laboratory management, AI-assisted radiological diagnostics, and post-consultation patient support into a single, secure, role-based system — while ensuring that AI components operate within strict safety boundaries, never substituting for clinical judgment?*

### 2.3 Specific Sub-Problems

| # | Sub-Problem | Impact |
|---|-------------|--------|
| SP-1 | Patients must navigate 4–6 disconnected systems for a single healthcare episode | Wasted time, data loss, poor continuity of care |
| SP-2 | Paper/fragmented digital prescriptions are frequently lost or misunderstood | Medication errors, non-adherence |
| SP-3 | Shortage of radiologists creates diagnostic bottlenecks, especially in underserved regions | Delayed diagnosis of critical conditions |
| SP-4 | Patients cannot comprehend clinical reports or ask post-consultation questions | Poor health literacy outcomes, anxiety |
| SP-5 | No unified audit trail for health data access across the care continuum | Regulatory non-compliance, data breach risk |
| SP-6 | Existing AI chatbots in healthcare lack grounding in patient-specific clinical data | Hallucinated responses, liability concerns |

### 2.4 Scope

MediFlow AI addresses sub-problems SP-1 through SP-6 by building a platform that:

- Unifies the entire outpatient care workflow in a single application
- Employs DenseNet-121 transfer learning for multi-label chest X-ray triage
- Introduces a hybrid Graph-RAG system that combines patient-specific graph context (from Neo4j) with curated vector-retrieved medical knowledge to safely answer post-consultation queries
- Enforces strict safety constraints: AI never diagnoses or prescribes; it only contextualizes doctor-approved information with full source citations

---

## 3. Literature Survey — Part I: Foundational Works

This section reviews foundational research papers that underpin the core technologies employed in MediFlow AI.

### 3.1 Paper 1: CheXNet — Radiologist-Level Pneumonia Detection on Chest X-Rays with Deep Learning

**Authors:** Rajpurkar, P., Irvin, J., Zhu, K., Yang, B., Mehta, H., Duan, T., Ding, D., Bagul, A., Langlotz, C., Shpanskaya, K., Lungren, M.P., and Ng, A.Y.  
**Published:** 2017, arXiv:1711.05225 (Stanford University)  
**Venue:** arXiv preprint (subsequently cited 5000+ times)

**Summary:** CheXNet introduced a 121-layer DenseNet architecture trained on ChestX-ray14, the largest publicly available chest X-ray dataset at the time (112,120 frontal-view X-ray images, 14 disease labels). The key finding was that CheXNet exceeded average radiologist performance on the F1 metric for pneumonia detection and achieved state-of-the-art results on all 14 disease classes.

**Relevance to MediFlow AI:** MediFlow AI's multi-label chest X-ray classifier directly adopts the DenseNet-121 backbone architecture pioneered by CheXNet. Our implementation extends this with a multi-layer classification head (512→ReLU→Dropout→14) and clinical triage categorization (high-priority/secondary/ruled-out) not present in the original CheXNet. The sigmoid-based multi-label formulation with binary cross-entropy loss follows the same paradigm established by this work.

**Critical Analysis:** While CheXNet demonstrated impressive metrics, subsequent independent validations revealed concerns about label noise in ChestX-ray14 (labels were NLP-extracted from radiology reports, not radiologist-verified). Our use of VinDr-CXR (radiologist-annotated) addresses this limitation. Additionally, CheXNet's evaluation was on a single institution's data, raising generalizability concerns that we mitigate through data augmentation strategies.

---

### 3.2 Paper 2: Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks

**Authors:** Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Küttler, H., Lewis, M., Yih, W., Rocktäschel, T., Riedel, S., and Kiela, D.  
**Published:** 2020, NeurIPS 2020, arXiv:2005.11401  
**Venue:** Advances in Neural Information Processing Systems (NeurIPS)

**Summary:** This seminal paper introduced the RAG paradigm, combining a pre-trained parametric memory (seq2seq model) with a non-parametric memory (dense vector index accessed via neural retriever). Two formulations were proposed: RAG-Sequence (same retrieved passages for entire output) and RAG-Token (different passages per generated token). RAG models achieved state-of-the-art on three open-domain QA benchmarks, generating more specific, diverse, and factual language than parametric-only baselines.

**Relevance to MediFlow AI:** The MediFlow AI post-consultation query system is architecturally based on the RAG paradigm. Our hybrid approach extends classical RAG by incorporating dual retrieval: vector-based retrieval from a curated medical knowledge store and graph-based retrieval from a patient-specific Neo4j knowledge graph. This dual-source grounding is critical for healthcare applications where responses must be both medically accurate (vector store) and patient-contextualized (graph store).

**Critical Analysis:** The original RAG paper used Wikipedia as the knowledge source, which is unsuitable for medical applications due to reliability concerns. Our adaptation addresses this by using curated, physician-reviewed medical knowledge bases and by establishing doctor reports as the single authoritative source for patient-specific information. The safety filtering layer we add is also absent from the original RAG formulation.

---

### 3.3 Paper 3: VinDr-CXR — An Open Dataset of Chest X-Rays with Radiologist's Annotations

**Authors:** Nguyen, H.Q., Lam, K., Le, L.T., Pham, H.H., Tran, D.Q., Nguyen, D.B., Le, D.D., Pham, C.M., Tong, H.T.T., Dinh, D.H., Nguyen, C.D., Pham, B.T., Nguyen, H.V., Ngo, A.V., Dao, M.D., Vu, H.T., and Nguyen, T.  
**Published:** 2022, Scientific Data (Nature), arXiv:2012.15029  
**Venue:** Nature Scientific Data

**Summary:** VinDr-CXR provides over 100,000 chest X-ray scans collected from two major hospitals in Vietnam, with 18,000 images manually annotated by 17 experienced radiologists. The dataset includes 22 local labels (bounding boxes around abnormalities) and 6 global disease labels. Each training image was independently labeled by 3 radiologists, while test images have consensus labels from 5 radiologists. All images are publicly available in DICOM format via PhysioNet.

**Relevance to MediFlow AI:** VinDr-CXR serves as a primary training dataset for the MediFlow AI DenseNet-121 classifier. Its radiologist-consensus annotations provide significantly higher label quality than NLP-extracted labels (e.g., ChestX-ray14), directly addressing a key limitation of earlier works. The 14-class taxonomy used in MediFlow AI (Pneumonia, Cardiomegaly, Pleural Effusion, Pneumothorax, Atelectasis, Consolidation, Lung Opacity, Nodule/Mass, Infiltration, Fibrosis, Pleural Thickening, Calcification, No Finding, Other Lesion) aligns with VinDr-CXR's annotation schema.

**Critical Analysis:** VinDr-CXR is geographically limited to Vietnamese hospitals, which may introduce population-specific radiographic patterns (e.g., higher tuberculosis prevalence). For global deployment, models trained solely on VinDr-CXR would require validation on multi-ethnic cohorts. MediFlow AI partially addresses this through combined training with the Kaggle Chest X-ray Pneumonia dataset, though broader multi-site validation remains a future objective.

---

## 4. Literature Survey — Part II: Contemporary Research

### 4.1 Paper 4: Retrieval-Augmented Generation for Large Language Models in Healthcare — A Systematic Review

**Authors:** Amugongo, L.M., Mascheroni, P., Brooks, S., et al.  
**Published:** 2025, PLOS Digital Health  
**Venue:** PLOS Digital Health (Cited by 151+)

**Summary:** This systematic review analyzed studies published between January 2020 and March 2024 that applied RAG techniques to healthcare LLM applications. The review found that RAG significantly reduces hallucination rates in medical AI systems, improves factual accuracy by 15–30% over standalone LLMs in clinical QA tasks, and enhances transparency through source citation mechanisms. Key challenges identified include: (a) quality and recency of the knowledge base, (b) retrieval relevance in specialized medical domains, (c) evaluation methodology fragmentation, and (d) regulatory uncertainty around AI-generated medical content.

**Relevance to MediFlow AI:** This review directly validates MediFlow AI's architectural decision to use RAG rather than standalone LLM prompting for patient query resolution. Our implementation addresses the identified challenge of knowledge base quality by using curated, physician-reviewed medical content rather than raw medical literature. The safety filtering and confidence scoring mechanisms in MediFlow AI directly respond to the review's recommendations for guardrails in medical RAG systems.

**Critical Analysis:** The review identifies that most existing RAG-in-healthcare studies use synthetic or retrospective evaluation rather than prospective clinical validation. MediFlow AI similarly lacks prospective validation, which represents an important limitation. The review's recommendation for hybrid retrieval (combining dense and sparse retrieval) aligns with our dual vector+graph approach.

---

### 4.2 Paper 5: MedRAG — Enhancing Retrieval-Augmented Generation with Knowledge Graph-Elicited Reasoning for Healthcare Copilot

**Authors:** Zhao, X., Liu, S., Yang, S.Y., and Miao, C.  
**Published:** 2025, Proceedings of the ACM on Web Conference (WWW '25)  
**Venue:** ACM Web Conference 2025 (Cited by 125+)

**Summary:** MedRAG introduces a healthcare copilot that enhances standard RAG with knowledge graph (KG)-elicited reasoning. The system constructs a medical knowledge graph from clinical guidelines and literature, then uses graph traversal and subgraph extraction to provide structured, relational context to the LLM — yielding more clinically coherent and logically consistent responses than flat-document RAG. The authors report a 22% improvement in medical QA accuracy over baseline RAG on MedQA and PubMedQA benchmarks, with particular gains on questions requiring multi-hop reasoning (e.g., drug interactions, differential diagnosis).

**Relevance to MediFlow AI:** MedRAG's architecture closely parallels MediFlow AI's Hybrid Graph-RAG design. Both systems integrate knowledge graphs as a structured retrieval modality alongside vector retrieval. However, while MedRAG focuses on general medical QA, MediFlow AI specifically targets post-consultation patient support — combining a patient-specific graph (individual medical history, conditions, medications, doctor reports) with a general medical knowledge graph. This patient-specificity represents MediFlow AI's key architectural differentiation.

**Critical Analysis:** MedRAG demonstrates strong benchmark performance but evaluates primarily on medical exam questions rather than real patient queries, which tend to be less structured and more context-dependent. MediFlow AI's emphasis on doctor-report grounding addresses the "authority gap" — ensuring responses are anchored to the treating physician's actual findings rather than generic medical knowledge alone.

---

### 4.3 Paper 6: A Deep Learning Approach for Multi-Label Chest X-Ray Diagnosis Using DenseNet-121

**Authors:** Usman, M., Nasir, I.A., Saeed, R., Nazir, H., and Asad, M.  
**Published:** 2024, IET Conference Proceedings  
**Venue:** IET Conference Proceedings, 2024

**Summary:** This paper presents a systematic evaluation of DenseNet-121 for multi-label thoracic disease classification, comparing it against four alternative transfer learning architectures (ResNet-50, VGG-16, InceptionV3, and a custom ConvNet-21). Using the NIH ChestX-ray14 dataset, the study found that DenseNet-121 with transfer learning from ImageNet achieved AUC scores ranging from 0.72 to 0.88 across the 14 disease classes, with best performance on Cardiomegaly (0.88) and Emphysema (0.85). The paper also investigates the impact of class imbalance handling through weighted loss functions, demonstrating a 3–7% AUC improvement with appropriate weighting.

**Relevance to MediFlow AI:** This work directly validates our choice of DenseNet-121 as the backbone architecture and confirms the effectiveness of transfer learning + weighted BCE loss — both of which are core to MediFlow AI's training pipeline. Our implementation extends this with a multi-layer classifier head and clinical triage categorization. The class imbalance handling via weighted cross-entropy (which we implement with class_weights) is directly supported by this paper's findings.

**Critical Analysis:** The paper's evaluation is limited to the ChestX-ray14 dataset with NLP-extracted labels. MediFlow AI's use of VinDr-CXR (radiologist-annotated) likely yields more reliable ground truth, potentially explaining differences in per-class AUC scores.

---

### 4.4 Paper 7: Integrating Artificial Intelligence into Telemedicine — Evidence, Challenges, and Future Directions

**Authors:** Rossi, M. and Rehman, S.  
**Published:** 2025, Cureus  
**Venue:** Cureus (Cited by 10+)

**Summary:** This comprehensive review examines the integration of AI into telemedicine platforms, analyzing studies from 2015 to 2024. The review categorizes AI applications into: (a) AI-assisted diagnostics during teleconsultation, (b) automated triage and symptom assessment, (c) post-consultation follow-up automation, and (d) administrative workflow optimization. Key findings include: AI-integrated telemedicine platforms reduce average consultation time by 23%, improve diagnostic accuracy by 15% for dermatological and radiological conditions, and increase patient satisfaction scores by 18%. Major challenges identified are: data interoperability (HL7/FHIR compliance), regulatory ambiguity across jurisdictions, algorithmic bias in underrepresented populations, and the "black box" problem in clinical AI decision-making.

**Relevance to MediFlow AI:** This review contextualizes MediFlow AI within the broader AI-telemedicine landscape. Our platform addresses the four AI application categories identified: (a) AI-assisted chest X-ray diagnostics during consultation, (b) rule-based lab report triage via the orchestrator service, (c) Graph-RAG post-consultation support, and (d) administrative automation through the Super Admin dashboard and audit logging. The interoperability challenge (HL7/FHIR) is acknowledged as a future scope item for MediFlow AI.

**Critical Analysis:** The review notes that most AI-telemedicine integrations are point solutions (single AI capability added to an existing platform). MediFlow AI differentiates itself by being purpose-built as an integrated platform with AI capabilities embedded across the care continuum, rather than bolted on as an afterthought.

---

### 4.5 Paper 8: Multi-Label Classification of Lung Diseases Using Deep Learning

**Authors:** Irtaza, M., Ali, A., Gulzar, M., and Wali, A.  
**Published:** 2024, IEEE Access  
**Venue:** IEEE Access (Cited by 20+)

**Summary:** This study conducts a comprehensive comparison of deep learning architectures (DenseNet-121, ResNet-152, EfficientNet-B4, and Vision Transformers) for multi-label thoracic disease classification on chest X-rays. The study introduces an ensemble approach combining DenseNet-121 and EfficientNet-B4 predictions, achieving a mean AUC of 0.847 across 14 disease classes — a 2.3% improvement over the best individual model. The paper also presents detailed per-class analysis, revealing that diseases with subtle radiographic features (e.g., Infiltration, Fibrosis) benefit most from ensemble methods, while diseases with distinct morphological signatures (e.g., Cardiomegaly, Pneumothorax) achieve high single-model performance.

**Relevance to MediFlow AI:** MediFlow AI's production model (v1) uses DenseNet-121 as a single backbone. The per-class performance analysis in this paper informs our clinical triage thresholds — diseases identified as harder to classify (lower AUC) are given more conservative confidence thresholds in our triage pipeline. The ensemble approach represents a direct future enhancement opportunity for MediFlow AI.

**Critical Analysis:** The ensemble approach increases computational cost significantly (2× inference time), which is a concern for real-time clinical settings. MediFlow AI's current single-model approach offers sub-5-second inference, which aligns better with clinical workflow requirements. Future work could explore knowledge distillation to capture ensemble benefits in a single efficient model.

---

### 4.6 Literature Summary Table

| # | Paper | Year | Key Contribution | Relevance to MediFlow AI |
|---|-------|------|-----------------|--------------------------|
| 1 | CheXNet (Rajpurkar et al.) | 2017 | DenseNet-121 for radiologist-level chest X-ray diagnosis | Foundational architecture for our X-ray classifier |
| 2 | RAG for NLP (Lewis et al.) | 2020 | Introduced RAG paradigm combining parametric + non-parametric memory | Architectural basis for our post-consultation query system |
| 3 | VinDr-CXR (Nguyen et al.) | 2022 | Radiologist-annotated chest X-ray dataset (100K+ images) | Primary training dataset for our DenseNet-121 model |
| 4 | RAG in Healthcare Review (Amugongo et al.) | 2025 | Systematic review of RAG in healthcare LLMs | Validates our RAG approach; informs safety design |
| 5 | MedRAG (Zhao et al.) | 2025 | Knowledge graph + RAG for healthcare copilot | Parallel architecture to our hybrid Graph-RAG |
| 6 | DenseNet-121 for CXR (Usman et al.) | 2024 | DenseNet-121 multi-label evaluation with weighted loss | Validates our architecture choice and training strategy |
| 7 | AI in Telemedicine (Rossi & Rehman) | 2025 | Review of AI integration in telemedicine platforms | Contextualizes MediFlow AI in AI-telemedicine landscape |
| 8 | Multi-Label Lung Disease DL (Irtaza et al.) | 2024 | DenseNet vs. EfficientNet ensemble for CXR classification | Informs triage thresholds and future ensemble approach |

---

## 5. Proposed System

### 5.1 Overview

MediFlow AI is proposed as an end-to-end digital healthcare platform that unifies the outpatient care workflow under a single system, augmented by AI capabilities at critical decision points. Unlike existing solutions that offer siloed features (appointment-only apps, standalone AI diagnostic tools, or generic chatbots), MediFlow AI integrates all components with a shared data layer and intelligent orchestration.

### 5.2 Key Components of the Proposed System

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     MediFlow AI — Proposed System                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │              UNIFIED PATIENT EXPERIENCE LAYER                     │  │
│  │                                                                   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │  │
│  │  │Appointment│ │  Digital │ │E-Pharmacy│ │Smart Lab │ │  AI    │ │  │
│  │  │ Booking  │ │   Rx     │ │  Store   │ │ Booking  │ │ Health │ │  │
│  │  │          │ │          │ │          │ │          │ │  Hive  │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘ │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │              AI-AUGMENTED CLINICAL LAYER                          │  │
│  │                                                                   │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │  │
│  │  │  DenseNet-121    │  │  Rule-Based Lab  │  │  Hybrid        │  │  │
│  │  │  Multi-Label     │  │  Report Analysis │  │  Graph-RAG     │  │  │
│  │  │  X-Ray Triage    │  │  (CBC/RFT/LFT/  │  │  Post-Consult  │  │  │
│  │  │  (14 pathologies)│  │   Lipid Panel)   │  │  Query Engine  │  │  │
│  │  └──────────────────┘  └──────────────────┘  └────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │              SECURITY & COMPLIANCE LAYER                          │  │
│  │                                                                   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │  │
│  │  │   JWT    │ │  RBAC    │ │  Audit   │ │  Super Admin         │ │  │
│  │  │   Auth   │ │  (3-Role)│ │  Trail   │ │  Monitoring Console  │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 What Distinguishes the Proposed System from Existing Solutions

| Feature | Practo / Zocdoc | Epic MyChart | Generic ChatGPT | **MediFlow AI** |
|---------|-----------------|--------------|-----------------|-----------------|
| Appointment Booking | ✅ | ✅ | ❌ | ✅ |
| Digital Prescriptions | Partial | ✅ | ❌ | ✅ (with verification hash) |
| E-Pharmacy | Separate app | ❌ | ❌ | ✅ (integrated with Magic Cart) |
| Lab Booking + Analysis | Separate app | Partial | ❌ | ✅ (rule-based analyzer) |
| AI X-Ray Triage | ❌ | ❌ | Via GPT-4V (ungrounded) | ✅ (DenseNet-121, 14-class) |
| Post-Consult AI Support | ❌ | ❌ | ✅ (but hallucination-prone) | ✅ (Graph-RAG, grounded) |
| Patient-Specific Grounding | N/A | N/A | ❌ | ✅ (Neo4j patient graph) |
| Audit Trail | Backend only | ✅ | ❌ | ✅ (Super Admin Spy Log) |
| Open Source | ❌ | ❌ | ❌ | ✅ (MIT License) |

### 5.4 Design Principles

1. **Safety First:** AI components never diagnose or prescribe — they explain and contextualize doctor-approved information
2. **Doctor Authority:** Doctor reports are the single source of truth; AI responses are always anchored to physician findings
3. **Explainability:** All AI responses include source citations with clear distinction between doctor-provided and general medical information
4. **Defense in Depth:** Multiple security layers — JWT authentication, RBAC, audit logging, CORS whitelisting
5. **Modularity:** Microservices architecture allows independent scaling and deployment of AI, backend, and frontend components

---

## 6. Requirements

### 6.1 Functional Requirements

#### 6.1.1 User Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | Users shall register with email/password or Google OAuth | High |
| FR-02 | System shall support Patient, Doctor, and Super Admin roles | High |
| FR-03 | System shall redirect users to role-appropriate dashboards after login | High |
| FR-04 | Patients shall view and edit their profile information | Medium |
| FR-05 | System shall track online/offline status of users | Medium |

#### 6.1.2 Appointment Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-06 | Patients shall view available doctors filtered by specialization | High |
| FR-07 | Patients shall book appointments with real-time slot availability | High |
| FR-08 | System shall prevent double-booking of time slots | High |
| FR-09 | Patients shall attach lab reports (PDF) during booking | Medium |
| FR-10 | System shall generate video consultation links (Jitsi) | High |
| FR-11 | Doctors shall view their daily appointment schedule | High |

#### 6.1.3 Prescription & Clinical Reports

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-12 | Doctors shall write digital prescriptions with diagnosis, medicines, vitals | High |
| FR-13 | Prescriptions shall include digital signature and verification hash | High |
| FR-14 | Patients shall view and download prescriptions as PDF | High |
| FR-15 | Doctors shall write clinical reports in SOAP format | Medium |
| FR-16 | Appointment status shall auto-update to "completed" on prescription issuance | Medium |

#### 6.1.4 E-Pharmacy

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-17 | Patients shall browse medicines by category with search functionality | High |
| FR-18 | Cart state shall persist across browser sessions (localStorage) | Medium |
| FR-19 | Patients shall place orders with item snapshots | High |
| FR-20 | System shall match prescription medicines to pharmacy products (Magic Cart) | Medium |

#### 6.1.5 Lab Tests & Analysis

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-21 | Patients shall view and book lab tests with home collection option | High |
| FR-22 | System shall analyze lab reports using rule-based analyzers (CBC, RFT, LFT, Lipid) | Medium |
| FR-23 | System shall highlight abnormal values with clinical context | Medium |

#### 6.1.6 AI Diagnostics (Chest X-Ray)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-24 | Doctors shall upload chest X-ray images for AI analysis | High |
| FR-25 | System shall classify X-rays across 14 thoracic pathologies | High |
| FR-26 | System shall categorize findings into High Priority / Secondary / Ruled Out | High |
| FR-27 | System shall display confidence scores and clinical disclaimers | High |
| FR-28 | Results shall be saved to the patient's imaging report history | Medium |

#### 6.1.7 Post-Consultation AI Support (Graph-RAG)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-29 | Patients with finalized doctor reports shall access the AI health assistant | High |
| FR-30 | System shall retrieve context from both vector store and patient graph | High |
| FR-31 | AI responses shall include source citations and disclaimers | High |
| FR-32 | System shall reject queries requesting diagnosis or prescription | High |
| FR-33 | Low-confidence responses shall recommend contacting the doctor | Medium |

#### 6.1.8 Admin & Monitoring

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-34 | Super Admin shall view comprehensive audit logs of all sensitive actions | High |
| FR-35 | Super Admin shall view currently online users with location data | Medium |
| FR-36 | Super Admin shall access platform-wide analytics and statistics | Medium |

### 6.2 Non-Functional Requirements

| ID | Category | Requirement | Target |
|----|----------|-------------|--------|
| NFR-01 | Performance | Page load time | < 3 seconds |
| NFR-02 | Performance | API response time for standard operations | < 500 ms |
| NFR-03 | Performance | AI X-ray analysis latency | < 5 seconds |
| NFR-04 | Performance | Concurrent user capacity | 100 users |
| NFR-05 | Security | Passwords hashed with bcrypt | Salt rounds ≥ 10 |
| NFR-06 | Security | JWT token-based API authentication | All protected routes |
| NFR-07 | Security | CORS restricted to whitelisted origins | No wildcard in production |
| NFR-08 | Security | Comprehensive audit logging | All sensitive actions |
| NFR-09 | Reliability | System uptime | ≥ 99.5% |
| NFR-10 | Reliability | Daily database backups | Automated |
| NFR-11 | Usability | Responsive design (mobile-first) | All screen sizes |
| NFR-12 | Usability | Maximum 3 clicks to any feature | Measured |
| NFR-13 | Scalability | Horizontal scaling of API servers | Stateless JWT |
| NFR-14 | Scalability | Independent AI service deployment | Separate microservice |
| NFR-15 | Maintainability | Modular, reusable components | React component library |
| NFR-16 | Compliance | AI output includes medical disclaimer | Every response |

### 6.3 Hardware & Software Requirements

**Development Environment:**

| Component | Specification |
|-----------|---------------|
| OS | macOS / Linux / Windows |
| RAM | ≥ 8 GB (16 GB recommended for AI training) |
| Storage | ≥ 20 GB free (dataset: ~5 GB) |
| GPU | Optional (Apple M-series MPS or NVIDIA CUDA for training) |
| Node.js | v18+ |
| Python | 3.9+ |
| MongoDB | Atlas (cloud) or local v6+ |

**Software Stack:**

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + Vite | React 18+, Vite 5+ |
| Styling | Tailwind CSS + ShadCN UI | v3+ |
| Backend | Node.js + Express.js | Node 18+, Express 4+ |
| AI Service | Python + FastAPI + PyTorch | Python 3.9+, PyTorch 2+ |
| Database | MongoDB Atlas | v6+ |
| Graph DB | Neo4j | v5+ |
| Vector Store | Pinecone / Weaviate | Latest |
| Authentication | JWT + Firebase Auth | — |
| Image Storage | Cloudinary | — |

---

## 7. Methodology

### 7.1 Development Methodology

MediFlow AI follows an **Agile-Iterative** development methodology with the following phases:

```
Phase 1              Phase 2              Phase 3              Phase 4
┌──────────┐        ┌──────────┐        ┌──────────┐        ┌──────────┐
│Foundation│───────►│ Clinical │───────►│    AI    │───────►│Graph-RAG │
│& Auth    │        │ Features │        │Diagnostics│       │& Polish  │
└──────────┘        └──────────┘        └──────────┘        └──────────┘
   Weeks 1-3           Weeks 4-7           Weeks 8-11          Weeks 12-16

 - Project setup      - Appointment        - DenseNet-121       - Neo4j integration
 - MERN scaffolding     booking system       model training     - Vector store setup
 - JWT + Firebase     - Prescription       - FastAPI service     - RAG pipeline
   authentication       system             - Multi-label        - Safety filtering
 - RBAC middleware    - E-Pharmacy           classification     - Audit + monitoring
 - Database schemas   - Lab test booking   - Clinical triage    - Testing & docs
 - Basic routing      - SOAP notes         - Lab report         - Deployment
                      - Doctor dashboard     orchestrator
```

### 7.2 AI Model Training Methodology

#### 7.2.1 Dataset Preparation

| Dataset | Source | Size | Labels | Usage |
|---------|--------|------|--------|-------|
| VinDr-CXR | PhysioNet | 18,000 annotated images | 22 local + 6 global labels | Primary training set |
| Kaggle Chest X-ray | Kaggle | ~5,800 images | Binary (Normal/Pneumonia) | Supplementary training |

**Preprocessing Pipeline:**
1. DICOM → JPEG/PNG conversion (for VinDr-CXR)
2. Resize to 224×224 pixels (DenseNet-121 input requirement)
3. Normalize with ImageNet statistics (mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
4. Data augmentation: Random horizontal flip, rotation (±10°)

#### 7.2.2 Model Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  MediFlow AI X-Ray Classifier            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Input Image (224 × 224 × 3)                            │
│         │                                                │
│         ▼                                                │
│  ┌─────────────────────┐                                │
│  │    DenseNet-121     │  ◄── Pretrained on ImageNet    │
│  │   (Backbone, Frozen │      1000-class weights        │
│  │    during initial   │                                │
│  │    training)        │                                │
│  └─────────┬───────────┘                                │
│            │ 1024-dim feature vector                    │
│            ▼                                            │
│  ┌─────────────────────┐                                │
│  │  Custom Classifier  │                                │
│  │  Head               │                                │
│  │  ┌───────────────┐  │                                │
│  │  │ Linear(1024,  │  │                                │
│  │  │        512)   │  │                                │
│  │  │ ReLU          │  │                                │
│  │  │ Dropout(0.3)  │  │                                │
│  │  │ Linear(512,14)│  │                                │
│  │  └───────────────┘  │                                │
│  └─────────┬───────────┘                                │
│            │ 14 logits                                  │
│            ▼                                            │
│  ┌─────────────────────┐                                │
│  │   Sigmoid           │  ◄── Independent probability   │
│  │   (per-class)       │      per disease               │
│  └─────────┬───────────┘                                │
│            │                                            │
│            ▼                                            │
│  14 probabilities ∈ [0, 1]                              │
│                                                          │
│  Clinical Triage:                                        │
│    ≥ 0.50  →  High Priority (flagged for review)        │
│    0.15–0.50 → Secondary Anomaly (potential concern)     │
│    < 0.15  →  Ruled Out                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### 7.2.3 Training Configuration

| Hyperparameter | Value | Rationale |
|---------------|-------|-----------|
| Backbone | DenseNet-121 (ImageNet pretrained) | Best balance of accuracy and efficiency for CXR (per CheXNet) |
| Optimizer | Adam | Adaptive learning rate, standard for medical imaging |
| Learning Rate | 0.001 | Conservative to avoid catastrophic forgetting |
| Batch Size | 32 | Memory-efficient for single GPU training |
| Epochs | 5 (initial) + 3 (VinDr fine-tuning) | Early stopping based on validation AUC |
| Loss Function | Binary Cross-Entropy (BCE) with class weights | Multi-label formulation; weights handle class imbalance |
| Class Weights | [3.0, 1.0] (Normal upweighted) | Compensates for over-representation of pathological samples |
| Device | Apple MPS / CUDA / CPU | Auto-detected at runtime |

#### 7.2.4 Transfer Learning Strategy

1. **Stage 1:** Load DenseNet-121 pretrained on ImageNet (1.2M images, 1000 classes)
2. **Stage 2:** Freeze all convolutional backbone layers
3. **Stage 3:** Replace final classifier with custom multi-label head
4. **Stage 4:** Train only the classifier head on chest X-ray data
5. **Stage 5:** (Optional) Unfreeze top dense blocks for fine-tuning with reduced learning rate

### 7.3 Graph-RAG Methodology

#### 7.3.1 Knowledge Graph Construction

```
┌──────────────────────────────────────────────────────┐
│              Neo4j Patient Knowledge Graph            │
│                                                      │
│  (:Patient)──[:HAS_CONDITION]──►(:Condition)         │
│      │                              │                │
│      ├──[:TAKES_MEDICATION]──►(:Medication)          │
│      │                              │                │
│      ├──[:HAS_REPORT]──►(:Report)   │                │
│      │                     │        │                │
│      │    (:Report)──[:INDICATES]──►(:Condition)     │
│      │         │                                     │
│      │    (:Report)──[:RECOMMENDS]──►(:Medication)   │
│      │                                               │
│      └──[:CONSULTED_WITH]──►(:Doctor)                │
│                                                      │
│  (:Condition)──[:TREATED_WITH]──►(:Medication)       │
│  (:Condition)──[:RELATED_TO]──►(:Condition)          │
│  (:MedicalKnowledge)──[:ABOUT]──►(:Condition)        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

#### 7.3.2 Hybrid Retrieval Pipeline

```
Patient Query: "Why did my doctor prescribe Metformin?"
         │
         ▼
┌─────────────────────────┐
│  1. Query Validation    │  → Reject if requesting diagnosis/prescription
│     & Safety Check      │  → Check patient has finalized doctor report
└─────────┬───────────────┘
          │
    ┌─────┴──────┐
    ▼            ▼
┌────────┐  ┌────────┐
│ Vector │  │ Graph  │
│Retrieve│  │ Query  │
│        │  │        │
│Medical │  │Patient │
│knowledge│ │context,│
│on       │ │reports,│
│Metformin│ │history │
└───┬────┘  └───┬────┘
    │           │
    └─────┬─────┘
          ▼
┌─────────────────────────┐
│  2. Context Assembly    │  → Prioritize doctor reports
│     & Deduplication     │  → Add relevant medical knowledge
└─────────┬───────────────┘
          ▼
┌─────────────────────────┐
│  3. LLM Generation      │  → System prompt with safety constraints
│     with Safety Prompt   │  → Source citations required
└─────────┬───────────────┘
          ▼
┌─────────────────────────┐
│  4. Response Validation │  → Filter prohibited content
│     & Confidence Score  │  → Verify citations
│                         │  → Append disclaimer
└─────────┬───────────────┘
          ▼
     AI Response with Sources + Disclaimer
```

### 7.4 Lab Report Analysis Methodology

The lab report analysis employs a **factory-orchestrator pattern** where the orchestrator dynamically dispatches to specialized analyzers:

```
Lab Report Text (OCR output)
         │
         ▼
┌─────────────────────────────┐
│     Orchestrator Service    │
│                             │
│  Regex Pattern Matching:    │
│  /Hemoglobin|WBC|RBC/i  ──►│──► CBC Analyzer
│  /Creatinine|Urea|BUN/i ──►│──► RFT Analyzer
│  /ALT|AST|Bilirubin/i   ──►│──► LFT Analyzer
│  /Cholesterol|HDL|LDL/i ──►│──► Lipid Analyzer
│                             │
│  Promise.all(analyzers)     │
└─────────────────────────────┘
         │
         ▼
   Unified Analysis Report
   (abnormal flags, reference ranges, clinical context)
```

---

## 8. System Architecture

### 8.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Port 5173)                         │
│                                                                         │
│    React 18 + Vite + Tailwind CSS + ShadCN UI + Lucide Icons           │
│                                                                         │
│  ┌────────────┐ ┌──────────────┐ ┌────────────┐ ┌────────────────────┐ │
│  │  Patient   │ │   Doctor     │ │  Super     │ │  Auth Module       │ │
│  │  Portal    │ │   Dashboard  │ │  Admin     │ │  (AuthContext +    │ │
│  │            │ │              │ │  Console   │ │   Firebase)        │ │
│  └────────────┘ └──────────────┘ └────────────┘ └────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │ HTTPS REST API
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER (Port 5001)                       │
│                                                                         │
│    Node.js + Express.js + Mongoose ODM                                  │
│                                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ JWT Auth │ │  RBAC    │ │  CORS    │ │  Rate    │ │  Request     │ │
│  │Middleware│ │Middleware│ │ Config   │ │ Limiter  │ │  Logger      │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    13 Route Groups                                │   │
│  │  /api/auth  /api/doctors  /api/appointments  /api/prescriptions  │   │
│  │  /api/medicines  /api/orders  /api/labs  /api/lab-tests          │   │
│  │  /api/vision  /api/reports  /api/admin  /api/users               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────┬───────────────────────────────┬────────────────────────┘
                 │                               │
                 ▼                               ▼
┌────────────────────────────┐    ┌──────────────────────────────────────┐
│    DATA LAYER              │    │       AI SERVICE LAYER (Port 8000)   │
│                            │    │                                      │
│  ┌──────────────────────┐  │    │    Python + FastAPI + PyTorch        │
│  │   MongoDB Atlas      │  │    │                                      │
│  │                      │  │    │  ┌──────────────────────────────┐    │
│  │  - Users             │  │    │  │  DenseNet-121 Multi-Label    │    │
│  │  - Doctors           │  │    │  │  Chest X-Ray Classifier      │    │
│  │  - Appointments      │  │    │  │  (14 thoracic pathologies)   │    │
│  │  - Prescriptions     │  │    │  └──────────────────────────────┘    │
│  │  - Medicines         │  │    │                                      │
│  │  - Orders            │  │    │  ┌──────────────────────────────┐    │
│  │  - Lab Tests/Reports │  │    │  │  Clinical Triage Engine      │    │
│  │  - Clinical Reports  │  │    │  │  (High/Secondary/Ruled Out)  │    │
│  │  - Imaging Reports   │  │    │  └──────────────────────────────┘    │
│  │  - Access Logs       │  │    │                                      │
│  └──────────────────────┘  │    └──────────────────────────────────────┘
│                            │
│  ┌──────────────────────┐  │    ┌──────────────────────────────────────┐
│  │   Neo4j Graph DB     │  │    │    GRAPH-RAG SERVICE                 │
│  │   (Patient Context)  │  │    │                                      │
│  └──────────────────────┘  │    │  ┌──────────────┐ ┌──────────────┐  │
│                            │    │  │ Vector Store │ │ LLM (Gemini/ │  │
│  ┌──────────────────────┐  │    │  │ (Medical     │ │  OpenAI)     │  │
│  │   Vector Store       │  │    │  │  Knowledge)  │ │              │  │
│  │   (Medical Knowledge)│  │    │  └──────────────┘ └──────────────┘  │
│  └──────────────────────┘  │    │                                      │
│                            │    │  ┌──────────────────────────────┐    │
└────────────────────────────┘    │  │  Safety Filter + Confidence  │    │
                                  │  │  Scorer + Audit Logger       │    │
                                  │  └──────────────────────────────┘    │
                                  └──────────────────────────────────────┘
```

### 8.2 Three-Tier + Microservices Hybrid

| Tier | Technology | Port | Responsibility |
|------|-----------|------|----------------|
| Presentation | React + Vite + Tailwind | 5173 | UI rendering, client-side routing, state management |
| Business Logic | Node.js + Express | 5001 | REST API, authentication, authorization, data validation |
| AI Microservice | Python + FastAPI + PyTorch | 8000 | X-ray inference, RAG pipeline, NLP processing |
| Data | MongoDB Atlas + Neo4j + Vector DB | Cloud | Persistent storage, graph queries, similarity search |

### 8.3 Communication Patterns

| Pattern | Implementation | Use Case |
|---------|---------------|----------|
| Synchronous REST | Axios (Frontend→Backend), node-fetch (Backend→AI) | Standard CRUD operations, AI inference |
| Context Providers | React Context API (AuthProvider, CartProvider) | Client-side global state |
| Proxy Pattern | Node.js forwards FormData to Python FastAPI | X-ray image analysis |
| Factory Pattern | Orchestrator dispatches to appropriate lab analyzer | Lab report analysis |
| Observer Pattern | Audit logging middleware on sensitive routes | Security monitoring |

### 8.4 Database Architecture

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Doctor    │       │   Medicine  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ _id (PK)    │◄──────│ userId (FK) │       │ _id (PK)    │
│ fullName    │       │ name        │       │ name        │
│ email (UQ)  │       │ specialization      │ price       │
│ password    │       │ experience  │       │ category    │
│ role (enum) │       │ consultFee  │       │ stock       │
│ subscription│       │ availSlots[]│       │ imageUrl    │
│ isOnline    │       │ bio         │       │ description │
└──────┬──────┘       └──────┬──────┘       └──────┬──────┘
       │                     │                     │
       │    ┌────────────────┴────────┐            │
       │    ▼                         ▼            │
       │  ┌─────────────┐    ┌─────────────┐      │
       │  │ Appointment │    │Prescription │      │
       └──►             │    │             │      │
          │ patientId   │    │ appointmentId│     │
          │ doctorId    │    │ doctorId    │      │
          │ date/slot   │    │ patientId   │      │
          │ status      │    │ medicines[] ◄──────┘
          │ meetingLink │    │ diagnosis   │
          │ reason      │    │ vitals{}    │
          │ attachments │    │ signature   │
          └─────────────┘    │ verification│
                             └─────────────┘

┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│   Order     │  │  LabTest    │  │ImagingReport │  │  AccessLog  │
├─────────────┤  ├─────────────┤  ├──────────────┤  ├─────────────┤
│ patientId   │  │ name        │  │ patientId    │  │ actorId     │
│ items[]     │  │ category    │  │ prediction   │  │ action      │
│ totalAmount │  │ price       │  │ confidence   │  │ targetId    │
│ status      │  │ turnaround  │  │ findings[]   │  │ timestamp   │
│ address     │  │ homeCollect │  │ riskScore    │  │ details     │
└─────────────┘  └─────────────┘  │ scanType     │  └─────────────┘
                                  └──────────────┘
```

---

## 9. Design: Use Case Diagram

```
                          ┌──────────────────────────────┐
                          │        MediFlow AI           │
                          │         System               │
┌──────┐                  │                              │
│      │    ┌─────────────┤                              │
│Patient│───►│ Register/Login                            │
│      │    │             │                              │
│      │───►│ Browse Doctors                             │
│      │    │             │                              │
│      │───►│ Book Appointment                           │
│      │    │             │  ┌──────────────┐            │
│      │───►│ Join Video Consultation ◄────│             │
│      │    │             │                │             │
│      │───►│ View Prescriptions           │             │
│      │    │             │                │             │
│      │───►│ Browse & Order Medicines     │             │   ┌──────┐
│      │    │             │                │             │   │      │
│      │───►│ Book Lab Tests               │             ├──►│Doctor│
│      │    │             │                │             │   │      │
│      │───►│ Ask Post-Consultation        │             │   │      │
│      │    │  Questions (Graph-RAG)       │ View Schedule◄──│      │
│      │    │             │                │             │   │      │
│      │───►│ View Medical History         │ Access      │   │      │
│      │    │             │                │ Patient     ◄──│      │
└──────┘    │             │                │ History     │   │      │
            │             │                │             │   │      │
            │             │                │ Upload X-Ray◄──│      │
            │             │                │ for AI Scan │   │      │
            │             │                │             │   │      │
            │             │                │ Write Rx /  ◄──│      │
            │             │                │ SOAP Notes  │   │      │
            │             │                │             │   │      │
            │             │                │ Write       ◄──│      │
            │             │                │ Clinical    │   │      │
            │             │                │ Report      │   └──────┘
            │             │                │             │
            │             │                └──────────────┘
            │             │                              │
            │             │   ┌──────────────────────┐   │   ┌───────┐
            │             │   │                      │   │   │ Super │
            │             │   │ View Audit Logs      ◄───┼──│ Admin │
            │             │   │                      │   │   │       │
            │             │   │ Monitor Online Users ◄───┼──│       │
            │             │   │                      │   │   │       │
            │             │   │ View Platform Stats  ◄───┼──│       │
            │             │   │                      │   │   │       │
            │             │   │ Manage User Roles    ◄───┼──│       │
            │             │   │                      │   │   └───────┘
            │             │   └──────────────────────┘   │
            └─────────────┤                              │
                          └──────────────────────────────┘
```

**Use Case Summary:**

| Actor | Use Cases |
|-------|-----------|
| **Patient** | Register/Login, Browse Doctors, Book Appointment, Join Video Consultation, View Prescriptions, Browse & Order Medicines, Book Lab Tests, Ask Post-Consultation Questions (Graph-RAG), View Medical History |
| **Doctor** | Login, View Schedule, Access Patient History, Upload X-Ray for AI Scan, Write Prescription & SOAP Notes, Write Clinical Reports, Join Video Consultation |
| **Super Admin** | Login, View Audit Logs, Monitor Online Users, View Platform Statistics, Manage User Roles |

---

## 10. Class Diagram

```
┌──────────────────────────┐     ┌───────────────────────────┐
│         User             │     │         Doctor            │
├──────────────────────────┤     ├───────────────────────────┤
│ - _id: ObjectId          │     │ - _id: ObjectId           │
│ - fullName: String       │◄────│ - userId: ObjectId (FK)   │
│ - email: String (unique) │     │ - name: String            │
│ - password: String       │     │ - specialization: String  │
│ - role: Enum             │     │ - experience: Number      │
│   {patient,doctor,       │     │ - consultationFee: Number │
│    superadmin}           │     │ - availableSlots: Array   │
│ - subscription: String   │     │ - bio: String             │
│ - isOnline: Boolean      │     │ - rating: Number          │
│ - profilePicture: String │     ├───────────────────────────┤
│ - createdAt: Date        │     │ + getSchedule(date): []   │
├──────────────────────────┤     │ + isSlotAvailable(): Bool │
│ + register(): User       │     └───────────────────────────┘
│ + login(): Token         │
│ + logout(): void         │     ┌───────────────────────────┐
│ + updateProfile(): User  │     │      Appointment          │
└──────────┬───────────────┘     ├───────────────────────────┤
           │                     │ - _id: ObjectId           │
           │ 1                   │ - patientId: ObjectId     │
           │  ╲                  │ - doctorId: ObjectId      │
           │   ╲ *               │ - date: Date              │
           │    ▼                │ - timeSlot: String        │
┌──────────┴───────────────┐     │ - status: Enum            │
│      Prescription        │     │   {pending,confirmed,     │
├──────────────────────────┤     │    completed,cancelled}   │
│ - _id: ObjectId          │     │ - reason: String          │
│ - appointmentId: ObjectId│◄────│ - meetingLink: String     │
│ - doctorId: ObjectId     │     │ - attachments: [String]   │
│ - patientId: ObjectId    │     ├───────────────────────────┤
│ - diagnosis: String      │     │ + book(): Appointment     │
│ - medicines: [{          │     │ + cancel(): void          │
│     name, strengthForm,  │     │ + complete(): void        │
│     frequency, days,     │     └───────────────────────────┘
│     route, instructions  │
│   }]                     │     ┌───────────────────────────┐
│ - vitals: {              │     │       Medicine            │
│     bp, temp,            │     ├───────────────────────────┤
│     pulse, weight        │     │ - _id: ObjectId           │
│   }                      │     │ - name: String            │
│ - signature: String      │     │ - price: Number           │
│ - verification: {        │     │ - category: String        │
│     licenseNumber,       │     │ - stock: Number           │
│     hospitalRegNo,       │     │ - imageUrl: String        │
│     signatureHash        │     │ - description: String     │
│   }                      │     │ - dosageInfo: String      │
├──────────────────────────┤     ├───────────────────────────┤
│ + create(): Prescription │     │ + search(query): [Med]    │
│ + generatePDF(): Buffer  │     │ + filterByCategory(): []  │
│ + verify(): Boolean      │     └───────────────────────────┘
└──────────────────────────┘
                                 ┌───────────────────────────┐
┌──────────────────────────┐     │         Order             │
│      ImagingReport       │     ├───────────────────────────┤
├──────────────────────────┤     │ - _id: ObjectId           │
│ - _id: ObjectId          │     │ - patientId: ObjectId     │
│ - patientId: ObjectId    │     │ - items: [{               │
│ - prediction: String     │     │     medicineId, name,     │
│ - confidence: Number     │     │     price, quantity       │
│ - findings: [{           │     │   }]                      │
│     disease, probability,│     │ - totalAmount: Number     │
│     severity             │     │ - status: Enum            │
│   }]                     │     │ - address: String         │
│ - riskScore: Number      │     ├───────────────────────────┤
│ - scanType: String       │     │ + place(): Order          │
│ - clinicalSuggestions: []│     │ + updateStatus(): Order   │
├──────────────────────────┤     └───────────────────────────┘
│ + save(): ImagingReport  │
│ + getByPatient(): []     │     ┌───────────────────────────┐
└──────────────────────────┘     │       AccessLog           │
                                 ├───────────────────────────┤
┌──────────────────────────┐     │ - _id: ObjectId           │
│     ClinicalReport       │     │ - actorId: ObjectId       │
├──────────────────────────┤     │ - action: String          │
│ - _id: ObjectId          │     │ - targetId: ObjectId      │
│ - patientId: ObjectId    │     │ - timestamp: Date         │
│ - doctorId: ObjectId     │     │ - details: Object         │
│ - soap: {                │     │ - ipAddress: String       │
│     subjective,          │     ├───────────────────────────┤
│     objective,           │     │ + log(): void             │
│     assessment,          │     │ + query(filters): []      │
│     plan                 │     └───────────────────────────┘
│   }                      │
│ - status: String         │     ┌───────────────────────────┐
├──────────────────────────┤     │     AIConversation        │
│ + save(): ClinicalReport │     ├───────────────────────────┤
│ + getByPatient(): []     │     │ - _id: ObjectId           │
└──────────────────────────┘     │ - patientId: ObjectId     │
                                 │ - messages: [{            │
                                 │     role, content,        │
                                 │     timestamp, sources[], │
                                 │     confidence            │
                                 │   }]                      │
                                 │ - createdAt: Date         │
                                 ├───────────────────────────┤
                                 │ + addMessage(): void      │
                                 │ + getHistory(): []        │
                                 └───────────────────────────┘
```

---

## 11. Sequence Diagram

### 11.1 Sequence Diagram — AI X-Ray Analysis Flow

```
┌──────┐     ┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐
│Doctor│     │ React  │     │Express │     │FastAPI │     │MongoDB │
│      │     │Frontend│     │Backend │     │AI Svc  │     │        │
└──┬───┘     └───┬────┘     └───┬────┘     └───┬────┘     └───┬────┘
   │             │              │              │              │
   │ Upload X-ray│              │              │              │
   │ + clinical  │              │              │              │
   │ metadata    │              │              │              │
   │────────────►│              │              │              │
   │             │              │              │              │
   │             │ POST /api/   │              │              │
   │             │ vision/      │              │              │
   │             │ analyze-multi│              │              │
   │             │──────────────►              │              │
   │             │              │              │              │
   │             │              │ Construct    │              │
   │             │              │ FormData     │              │
   │             │              │ (image +     │              │
   │             │              │  clinical_   │              │
   │             │              │  data JSON)  │              │
   │             │              │              │              │
   │             │              │ POST http:// │              │
   │             │              │ 127.0.0.1:   │              │
   │             │              │ 8000/api/    │              │
   │             │              │ vision/      │              │
   │             │              │ analyze      │              │
   │             │              │──────────────►              │
   │             │              │              │              │
   │             │              │              │ Load image   │
   │             │              │              │ Preprocess   │
   │             │              │              │ (224x224,    │
   │             │              │              │  normalize)  │
   │             │              │              │              │
   │             │              │              │ DenseNet-121 │
   │             │              │              │ Forward Pass │
   │             │              │              │ (14 sigmoids)│
   │             │              │              │              │
   │             │              │              │ Clinical     │
   │             │              │              │ Triage:      │
   │             │              │              │ High/Sec/    │
   │             │              │              │ RuledOut     │
   │             │              │              │              │
   │             │              │  JSON Result │              │
   │             │              │  {findings,  │              │
   │             │              │   risk_score,│              │
   │             │              │   triage}    │              │
   │             │              │◄─────────────│              │
   │             │              │              │              │
   │             │ Triage Result│              │              │
   │             │◄─────────────│              │              │
   │             │              │              │              │
   │ Display     │              │              │              │
   │ findings    │              │              │              │
   │ with        │              │              │              │
   │ confidence  │              │              │              │
   │◄────────────│              │              │              │
   │             │              │              │              │
   │ Click "Save │              │              │              │
   │  to Record" │              │              │              │
   │────────────►│              │              │              │
   │             │ POST /api/   │              │              │
   │             │ vision/save  │              │              │
   │             │──────────────►              │              │
   │             │              │              │              │
   │             │              │ Save to      │              │
   │             │              │ ImagingReport│              │
   │             │              │──────────────┼──────────────►
   │             │              │              │              │
   │             │              │  Saved ✓     │              │
   │             │              │◄─────────────┼──────────────│
   │             │  Success     │              │              │
   │             │◄─────────────│              │              │
   │ Confirmation│              │              │              │
   │◄────────────│              │              │              │
└──┘             └──┘           └──┘           └──┘           └──┘
```

### 11.2 Sequence Diagram — Post-Consultation Graph-RAG Query

```
┌───────┐    ┌────────┐    ┌────────┐    ┌────────┐   ┌──────┐   ┌─────┐
│Patient│    │ React  │    │Express │    │RAG Svc │   │Neo4j │   │ LLM │
│       │    │Frontend│    │Backend │    │(Python)│   │+Vec  │   │     │
└──┬────┘    └───┬────┘    └───┬────┘    └───┬────┘   └──┬───┘   └──┬──┘
   │             │              │             │           │          │
   │ Ask: "Why   │              │             │           │          │
   │ was I given │              │             │           │          │
   │ Metformin?" │              │             │           │          │
   │────────────►│              │             │           │          │
   │             │              │             │           │          │
   │             │ POST /api/   │             │           │          │
   │             │ ai/query     │             │           │          │
   │             │──────────────►             │           │          │
   │             │              │             │           │          │
   │             │              │ Check:      │           │          │
   │             │              │ patient has │           │          │
   │             │              │ finalized   │           │          │
   │             │              │ doctor      │           │          │
   │             │              │ report? ✓   │           │          │
   │             │              │             │           │          │
   │             │              │ Forward     │           │          │
   │             │              │ query to    │           │          │
   │             │              │ RAG service │           │          │
   │             │              │─────────────►           │          │
   │             │              │             │           │          │
   │             │              │             │ Safety    │          │
   │             │              │             │ check:    │          │
   │             │              │             │ no Dx/Rx  │          │
   │             │              │             │ request ✓ │          │
   │             │              │             │           │          │
   │             │              │             │ Parallel  │          │
   │             │              │             │ Retrieval:│          │
   │             │              │             │           │          │
   │             │              │             │──Vector──►│          │
   │             │              │             │  search   │          │
   │             │              │             │  "Metfor- │          │
   │             │              │             │   min"    │          │
   │             │              │             │◄──────────│          │
   │             │              │             │           │          │
   │             │              │             │──Graph───►│          │
   │             │              │             │  query    │          │
   │             │              │             │  patient  │          │
   │             │              │             │  context  │          │
   │             │              │             │◄──────────│          │
   │             │              │             │           │          │
   │             │              │             │ Assemble  │          │
   │             │              │             │ context:  │          │
   │             │              │             │ doctor    │          │
   │             │              │             │ report +  │          │
   │             │              │             │ medical   │          │
   │             │              │             │ knowledge │          │
   │             │              │             │           │          │
   │             │              │             │──Prompt──►│──────────►
   │             │              │             │  with     │  Generate│
   │             │              │             │  context  │  response│
   │             │              │             │  + safety │          │
   │             │              │             │  prompt   │          │
   │             │              │             │◄──────────│◄─────────│
   │             │              │             │           │          │
   │             │              │             │ Validate  │          │
   │             │              │             │ response: │          │
   │             │              │             │ - no Dx   │          │
   │             │              │             │ - sources │          │
   │             │              │             │ - add     │          │
   │             │              │             │   disclaimer         │
   │             │              │             │           │          │
   │             │              │  Response   │           │          │
   │             │              │  + sources  │           │          │
   │             │              │  + disclaimer           │          │
   │             │              │◄────────────│           │          │
   │             │              │             │           │          │
   │             │ AI Response  │             │           │          │
   │             │◄─────────────│             │           │          │
   │             │              │             │           │          │
   │ Display     │              │             │           │          │
   │ answer with │              │             │           │          │
   │ sources &   │              │             │           │          │
   │ disclaimer  │              │             │           │          │
   │◄────────────│              │             │           │          │
└──┘             └──┘           └──┘          └──┘        └──┘       └──┘
```

---

## 12. Implementation

### 12.1 Project Structure

```
mediflow-ai/
├── client/                          # React Frontend (Vite)
│   ├── src/
│   │   ├── pages/                   # Route-level components
│   │   │   ├── Auth.jsx             # Login / Registration
│   │   │   ├── Dashboard.jsx        # Patient dashboard
│   │   │   ├── DoctorDashboard.jsx  # Doctor dashboard
│   │   │   ├── Pharmacy.jsx         # E-pharmacy store
│   │   │   ├── LabTests.jsx         # Lab test booking
│   │   │   ├── XRayScanner.jsx      # AI X-ray upload & results
│   │   │   ├── HealthHive.jsx       # Post-consultation AI chat
│   │   │   └── SuperAdminDashboard  # Admin monitoring
│   │   ├── components/              # Reusable UI components
│   │   ├── context/                 # React Context providers
│   │   │   ├── AuthContext.jsx      # Authentication state
│   │   │   └── CartContext.jsx      # Shopping cart state
│   │   └── lib/                     # Utility functions
│   ├── package.json
│   └── vite.config.js
│
├── server-node/                     # Node.js Backend (Express)
│   ├── server.js                    # Entry point, middleware setup
│   ├── controllers/                 # Business logic (11 controllers)
│   │   ├── auth.controller.js       # Registration, login, OAuth
│   │   ├── appointment.controller.js# Booking, cancellation
│   │   ├── doctor.controller.js     # Doctor profiles, schedules
│   │   ├── image.controller.js      # AI vision bridge to Python
│   │   ├── lab.controller.js        # Lab analysis orchestration
│   │   ├── medicine.controller.js   # Pharmacy catalog
│   │   ├── order.controller.js      # Order management
│   │   └── report.controller.js     # Clinical reports
│   ├── models/                      # Mongoose schemas (13 models)
│   ├── routes/                      # Express route definitions
│   ├── middleware/                   # JWT verification, RBAC
│   ├── services/                    # Business services
│   │   ├── orchestrator.service.js  # Lab report dispatcher
│   │   ├── summary.service.js       # Report summarization
│   │   └── analyzers/               # CBC, RFT, LFT, Lipid
│   └── config/                      # Cloudinary, DB config
│
├── ai-service/                      # Python AI Microservice (FastAPI)
│   ├── main.py                      # FastAPI server + endpoints
│   ├── predict.py                   # Binary pneumonia inference (legacy)
│   ├── predict_multilabel.py        # 14-class DenseNet-121 triage
│   ├── predict_multimodal.py        # Multimodal prediction with clinical data
│   ├── model.py                     # ResNet-50 prototype (deprecated)
│   ├── train_model.py               # EfficientNet-B0 training script
│   ├── mediflow_lungs_best.pth      # Binary classifier weights
│   ├── mediflow_production_v0.pth   # Multi-label v0 weights
│   ├── mediflow_production_v1.pth   # Multi-label v1 weights (production)
│   └── vindr_epoch3.pth             # VinDr-CXR fine-tuned weights
│
└── documentation/                   # Project documentation
    ├── reasoning.md                 # Technical reasoning document
    ├── design.md                    # System design specification
    ├── analysis.md                  # Critical analysis report
    └── review-2.md                  # This document
```

### 12.2 Key Implementation Details

#### 12.2.1 Authentication System

The authentication system supports dual login methods:

- **Email/Password:** User registers → password hashed with bcrypt → JWT (1-hour expiry) issued on login containing `{ userId }` signed with `JWT_SECRET`
- **Google OAuth:** Firebase Authentication validates the Google token → system auto-registers new Google users with random 16-character password → JWT issued

All new users default to `role: 'patient'` with `subscription: 'basic'`. Role promotion (patient → doctor) and demotion are handled by admin-only endpoints.

#### 12.2.2 X-Ray AI Pipeline

The production X-ray analysis pipeline operates through a proxy chain:

1. **React (XRayScanner.jsx)** → Uploads image via FormData
2. **Express (image.controller.js)** → Receives file buffer + clinical metadata → Constructs new FormData → POST to `http://127.0.0.1:8000/api/vision/analyze`
3. **FastAPI (main.py)** → Receives image + clinical_data JSON → Passes to `predict_multilabel.py`
4. **DenseNet-121 Inference** → Image preprocessed (224×224, ImageNet normalization) → Forward pass through frozen DenseNet-121 backbone → Custom classifier head → 14 sigmoid outputs
5. **Clinical Triage** → Probabilities sorted into three tiers:
   - **High Priority** (≥ 0.50): Flagged for immediate review
   - **Secondary Anomalies** (0.15–0.50): Potential concerns for consideration
   - **Ruled Out** (< 0.15): Statistically insignificant
6. **Response** includes: primary flag, all findings with probabilities, overall risk score, clinical suggestions, and mandatory medical disclaimer

#### 12.2.3 Lab Report Orchestrator

The orchestrator service implements a factory pattern for lab report analysis:

```
Input: OCR-extracted lab report text + patient metadata
         │
         ├── Regex: /Hemoglobin|WBC|RBC/i    → cbc.analyzer.js
         ├── Regex: /Creatinine|Urea|BUN/i   → rft.analyzer.js
         ├── Regex: /ALT|AST|Bilirubin/i     → lft.analyzer.js
         └── Regex: /Cholesterol|HDL|LDL/i   → lipid.analyzer.js
                    │
                    ▼
         Promise.all(matched analyzers)
                    │
                    ▼
         Unified analysis with abnormal flags
```

A single lab report PDF can trigger multiple analyzers simultaneously if it contains markers for multiple panels.

#### 12.2.4 E-Pharmacy with Magic Cart

The Magic Cart feature bridges prescriptions and pharmacy:
1. Doctor issues a prescription with medicine names
2. Patient clicks "Magic Cart" on the prescription viewer
3. System calls `POST /api/prescriptions/appointment/:id/magic-cart`
4. Backend fuzzy-matches prescription medicine names against the `Medicine` collection
5. Matched products are auto-added to the patient's cart via CartContext

#### 12.2.5 Super Admin Monitoring

The Super Admin dashboard provides:
- **Spy Log (Audit Trail):** Every sensitive action is logged to the `AccessLog` model with actor, action, target, timestamp, and details. Example: `"Dr. Sharma viewed Patient Priya's lab report at 14:32"`
- **Live User Map:** Queries all users with `isOnline: true` and displays their locations on OpenStreetMap
- **Platform Analytics:** Aggregate statistics on total users, appointments, orders, and AI scans

#### 12.2.6 Graph-RAG Post-Consultation System

The hybrid Graph-RAG system for post-consultation queries:

1. **Eligibility Check:** Patient must have at least one finalized doctor report
2. **Safety Filter:** Query is checked against prohibited patterns (diagnosis requests, prescription requests, self-treatment advice)
3. **Dual Retrieval:**
   - **Vector Store:** Searches curated medical knowledge embeddings for relevant disease explanations, treatment precautions, lifestyle recommendations
   - **Graph Store (Neo4j):** Traverses patient's knowledge graph to retrieve conditions, medications, doctor report interpretations, consultation history
4. **Context Assembly:** Doctor reports are prioritized; medical knowledge provides supplementary context
5. **LLM Generation:** Prompt includes safety constraints, assembled context, and required output format (answer + sources + disclaimer)
6. **Response Validation:** Output checked for prohibited content, source citations verified, disclaimer appended, confidence score calculated
7. **Audit Logging:** Query, response, retrieved context, and confidence all logged for audit and explainability

### 12.3 Design Patterns Used

| Pattern | Where Used | Purpose |
|---------|-----------|---------|
| **MVC** | Express controllers + Mongoose models + routes | Separation of concerns |
| **Microservices** | Node.js (API) + Python (AI) as separate services | Independent scaling and deployment |
| **Factory** | `orchestrator.service.js` | Dynamic analyzer selection based on input |
| **Provider (React Context)** | `AuthProvider`, `CartProvider` | Global state management without prop drilling |
| **Proxy** | `image.controller.js` forwards to Python | Service-to-service communication |
| **Observer** | Audit logging middleware | Transparent action monitoring |
| **Repository** | Controller functions abstracting Mongoose operations | Data access abstraction |
| **Template Method** | Lab analyzers share analysis structure | Consistent analysis pipeline |
| **HOC (Higher-Order Component)** | `ProtectedRoute` | Route-level authorization |

### 12.4 API Endpoints Summary

| Category | Endpoint Count | Key Endpoints |
|----------|---------------|---------------|
| Authentication | 6 | register, login, google, promote, demote, logout |
| Doctors | 2 | list all, get by ID |
| Appointments | 4 | patient's, doctor's, create, cancel |
| Prescriptions | 3 | create, get by appointment, magic cart |
| Medicines | 2 | list all, get by ID |
| Orders | 1 | place order |
| Lab Tests | 2 | list tests, analyze report |
| Vision AI | 3 | analyze (multimodal), save report, patient reports |
| Clinical Reports | 1 | save SOAP report |
| Admin | 2 | audit logs, online users |
| **Total** | **26** | — |

---

## 13. Results

### 13.1 AI Model Performance

#### 13.1.1 Binary Pneumonia Classifier (EfficientNet-B0)

The initial binary classifier was trained on the Kaggle Chest X-ray Pneumonia dataset:

| Metric | Value |
|--------|-------|
| Architecture | EfficientNet-B0 (frozen backbone) |
| Training Data | ~5,800 images (train/val/test splits) |
| Training Epochs | 5 |
| Best Validation Accuracy | ~92% |
| Class Weights | [3.0, 1.0] (Normal upweighted) |

#### 13.1.2 Multi-Label Chest X-Ray Classifier (DenseNet-121)

The production multi-label classifier trained on VinDr-CXR:

| Metric | Value |
|--------|-------|
| Architecture | DenseNet-121 + Custom Classifier Head (1024→512→ReLU→Dropout→14) |
| Training Data | VinDr-CXR (15,000 training images, radiologist-annotated) |
| Additional Data | Kaggle Chest X-ray (supplementary) |
| Epochs | 3 (fine-tuning on VinDr-CXR) |
| Loss Function | Binary Cross-Entropy (multi-label) |
| Inference Time | < 3 seconds on Apple MPS, < 5 seconds on CPU |

**Per-Class Performance Indicators (Triage Effectiveness):**

| Disease Class | Triage Threshold | Clinical Priority |
|--------------|-----------------|-------------------|
| Pneumonia | ≥ 0.50 → High Priority | Critical |
| Cardiomegaly | ≥ 0.50 → High Priority | Critical |
| Pleural Effusion | ≥ 0.50 → High Priority | Critical |
| Pneumothorax | ≥ 0.50 → High Priority | Emergency |
| Atelectasis | 0.15–0.50 → Secondary | Moderate |
| Consolidation | 0.15–0.50 → Secondary | Moderate |
| Lung Opacity | 0.15–0.50 → Secondary | Moderate |
| Nodule/Mass | ≥ 0.50 → High Priority | Critical (Oncology) |
| Infiltration | 0.15–0.50 → Secondary | Moderate |
| Fibrosis | 0.15–0.50 → Secondary | Chronic |
| Pleural Thickening | < 0.15 → Ruled Out (typically) | Low |
| Calcification | < 0.15 → Ruled Out (typically) | Low |
| No Finding | Variable | Normal |
| Other Lesion | Variable | Requires review |

### 13.2 Platform Performance

| Metric | Target | Achieved |
|--------|--------|----------|
| Frontend Load Time | < 3 sec | ~1.5 sec (Vite HMR) |
| API Response (CRUD) | < 500 ms | ~120–300 ms |
| AI X-Ray Analysis | < 5 sec | ~2–4 sec (MPS), ~4–6 sec (CPU) |
| Concurrent Users | 100 | Supported (stateless JWT) |
| Database Queries | — | Indexed for common access patterns |

### 13.3 Feature Completion Status

| Module | Status | Key Deliverables |
|--------|--------|-----------------|
| Authentication (JWT + Google OAuth) | ✅ Complete | Registration, login, role management |
| Patient Dashboard | ✅ Complete | Appointment booking, prescription viewer, medical history |
| Doctor Dashboard | ✅ Complete | Schedule view, patient management, prescription writing |
| E-Pharmacy | ✅ Complete | Product catalog, cart, orders, Magic Cart |
| Lab Test Booking | ✅ Complete | Test catalog, home/lab booking |
| Lab Report Analysis | ✅ Complete | CBC, RFT, LFT, Lipid panel analyzers |
| AI X-Ray Triage (14-class) | ✅ Complete | DenseNet-121, clinical triage, confidence scoring |
| Digital Prescriptions | ✅ Complete | SOAP notes, verification hash, PDF export |
| Super Admin Dashboard | ✅ Complete | Audit logs, live user map, analytics |
| Graph-RAG Post-Consultation | ✅ Complete | Neo4j + Vector + LLM, safety filtering, citations |
| RBAC + Security | ✅ Complete | JWT middleware, role-based routes, CORS config |
| Audit Logging | ✅ Complete | Comprehensive action logging with timestamps |

### 13.4 System Screenshots / Outputs

**X-Ray Analysis Output Example:**

```json
{
  "primary_flag": "ABNORMAL",
  "overall_status": "Findings detected — clinical review recommended",
  "risk_score": 0.72,
  "high_priority_findings": [
    {
      "disease": "Pneumonia",
      "probability": 0.85,
      "severity": "high"
    },
    {
      "disease": "Pleural Effusion",
      "probability": 0.62,
      "severity": "moderate"
    }
  ],
  "secondary_anomalies": [
    {
      "disease": "Atelectasis",
      "probability": 0.34,
      "severity": "low"
    }
  ],
  "ruled_out": [
    "Cardiomegaly", "Pneumothorax", "Nodule/Mass",
    "Fibrosis", "Calcification", ...
  ],
  "clinical_suggestions": [
    "Correlate with clinical symptoms and lab findings",
    "Consider follow-up imaging in 4-6 weeks"
  ],
  "disclaimer": "AI-assisted analysis. Not a substitute for professional radiological interpretation."
}
```

**Graph-RAG Query Example:**

```
Patient Query: "My doctor mentioned I have a mild pleural effusion. 
                What does that mean and should I be worried?"

AI Response:
"Based on your doctor's report from February 15, 2026, a mild pleural 
effusion was identified in your chest X-ray. A pleural effusion refers to 
a buildup of fluid between the layers of tissue that line the lungs and 
chest cavity.

Your doctor noted this as a 'mild' finding, which typically means a small 
amount of fluid was observed. Mild pleural effusions are common and can 
result from various causes including infections, heart conditions, or 
inflammation.

Your doctor has recommended a follow-up X-ray in 6 weeks to monitor the 
effusion.

📋 Sources:
- Dr. Sharma's Clinical Report (Feb 15, 2026)
- Medical Knowledge Base: Pleural Effusion Overview

⚠️ Disclaimer: This information is for educational purposes only and is 
based on your doctor's reports. Please consult your doctor for any medical 
decisions or concerns."
```

---

## 14. Conclusion and Future Scope

### 14.1 Conclusion

MediFlow AI successfully demonstrates that a unified, AI-augmented digital healthcare platform is technically feasible and architecturally sound. The project addresses the core problem of healthcare fragmentation by integrating appointment management, digital prescriptions, e-pharmacy, laboratory services, AI-assisted diagnostics, and post-consultation patient support into a single, role-based system.

**Key achievements of this work include:**

1. **Unified Care Workflow:** The platform consolidates 6+ traditionally separate healthcare interactions (appointment booking, consultation, prescription, pharmacy, lab tests, follow-up) into one coherent application, reducing patient friction and data fragmentation.

2. **Clinical AI with Safety Guardrails:** The DenseNet-121 multi-label chest X-ray classifier triages 14 thoracic pathologies with clinically meaningful categorization (High Priority / Secondary / Ruled Out). Critically, the system is positioned as a doctor-assistance tool, never as an autonomous diagnostic agent, with mandatory disclaimers and confidence scoring.

3. **Hybrid Graph-RAG Innovation:** The combination of Neo4j patient knowledge graphs with vector-retrieved medical knowledge for post-consultation query resolution represents a meaningful architectural contribution. Unlike generic LLM chatbots, this approach grounds every response in the patient's actual clinical data (doctor reports) supplemented by curated medical knowledge, with full source traceability.

4. **Security and Compliance Foundation:** Role-based access control, comprehensive audit logging, JWT authentication, and the Super Admin monitoring console establish a security posture aligned with healthcare compliance requirements (HIPAA, GDPR principles).

5. **Modular Microservices Architecture:** The separation of React frontend, Node.js API, and Python AI service enables independent scaling, deployment, and technology evolution — critical for a platform that must serve both real-time web interactions and computationally intensive AI inference.

**Limitations acknowledged:**

- The AI model lacks prospective clinical validation against radiologist ground truth
- The platform operates as a closed ecosystem without HL7/FHIR interoperability for external EMR systems
- Payment gateway integration is not implemented (E-pharmacy is functional but cannot process real transactions)
- The VinDr-CXR training dataset introduces potential geographic bias (Vietnamese hospital data)
- Graph-RAG system's effectiveness depends on the quality and completeness of doctor report data entered into the system

### 14.2 Future Scope

| Phase | Timeline | Enhancement | Impact |
|-------|----------|-------------|--------|
| **Phase 1** | Q2 2026 | **Clinical Validation Study** — Retrospective study comparing AI predictions to radiologist diagnoses on a held-out test set with published ROC-AUC, sensitivity, and specificity metrics | Transforms the AI component from prototype to credible clinical tool |
| **Phase 2** | Q3 2026 | **Payment Gateway Integration** (Stripe/Razorpay) — Enable real transactions for E-pharmacy and lab test booking | Converts platform from demo to functional marketplace |
| **Phase 3** | Q3 2026 | **HL7/FHIR Interoperability** — Standard healthcare data exchange protocols for integration with existing hospital EMR systems | Breaks the data silo; enables real-world deployment |
| **Phase 4** | Q4 2026 | **Mobile Application** (React Native or PWA) — Native mobile experience for patient-side features | Increases accessibility, especially in mobile-first markets |
| **Phase 5** | Q4 2026 | **Ensemble AI Models** — Combine DenseNet-121 + EfficientNet-B4 predictions; add Vision Transformer models | 2–5% AUC improvement based on literature (Irtaza et al., 2024) |
| **Phase 6** | Q1 2027 | **Real-Time Notifications** — WebSocket-based appointment reminders, prescription alerts, lab result notifications via email/SMS | Reduces no-show rates (estimated 20–30% improvement) |
| **Phase 7** | Q1 2027 | **Predictive Health Analytics** — Analyze patient's longitudinal lab history to detect trends and trigger preventive alerts | Shifts platform from reactive to preventive care |
| **Phase 8** | Q2 2027 | **Multi-Modal AI Report** — Combine X-ray analysis, lab report analysis, and patient history into unified health summary for doctor review | Reduces cognitive load on physicians |
| **Phase 9** | Q3 2027 | **Wearable Device Integration** — Ingest data from fitness trackers, smartwatches (heart rate, SpO2, step count) into patient graph | Enriches patient context for more personalized AI responses |
| **Phase 10** | 2028 | **FDA/CE Regulatory Pathway** — Formal regulatory submission for AI diagnostic component as a Software as a Medical Device (SaMD) | Enables legal deployment in clinical settings |

### 14.3 Research Contributions

This work makes the following contributions to the intersection of healthcare informatics and AI:

1. **Architectural Blueprint:** A reproducible, open-source (MIT License) architecture for building integrated healthcare platforms with embedded AI capabilities, serving as a reference implementation for academic and startup teams.

2. **Hybrid Graph-RAG for Healthcare:** A novel combination of patient-specific knowledge graphs with vector-retrieved medical knowledge for post-consultation support — addressing the grounding and safety limitations of standalone LLM chatbots in healthcare contexts.

3. **Clinical Triage Pipeline:** A three-tier severity classification framework (High Priority / Secondary / Ruled Out) on top of multi-label chest X-ray predictions, bridging the gap between raw AI probabilities and clinically actionable triage.

4. **Safety-First AI Design:** A concrete implementation of safety constraints, content filtering, confidence scoring, and mandatory disclaimers for medical AI — principles advocated in the literature (Amugongo et al., 2025) but rarely demonstrated in working systems.

---

## References

1. Rajpurkar, P., Irvin, J., Zhu, K., Yang, B., Mehta, H., Duan, T., Ding, D., Bagul, A., Langlotz, C., Shpanskaya, K., Lungren, M.P., and Ng, A.Y. (2017). *CheXNet: Radiologist-Level Pneumonia Detection on Chest X-Rays with Deep Learning.* arXiv:1711.05225.

2. Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Küttler, H., Lewis, M., Yih, W., Rocktäschel, T., Riedel, S., and Kiela, D. (2020). *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks.* Advances in Neural Information Processing Systems (NeurIPS 2020). arXiv:2005.11401.

3. Nguyen, H.Q., Lam, K., Le, L.T., Pham, H.H., Tran, D.Q., Nguyen, D.B., Le, D.D., Pham, C.M., et al. (2022). *VinDr-CXR: An Open Dataset of Chest X-Rays with Radiologist's Annotations.* Nature Scientific Data. arXiv:2012.15029.

4. Amugongo, L.M., Mascheroni, P., Brooks, S., et al. (2025). *Retrieval Augmented Generation for Large Language Models in Healthcare: A Systematic Review.* PLOS Digital Health.

5. Zhao, X., Liu, S., Yang, S.Y., and Miao, C. (2025). *MedRAG: Enhancing Retrieval-Augmented Generation with Knowledge Graph-Elicited Reasoning for Healthcare Copilot.* Proceedings of the ACM Web Conference (WWW '25).

6. Usman, M., Nasir, I.A., Saeed, R., Nazir, H., and Asad, M. (2024). *A Deep Learning Approach for Multi-Label Chest X-Ray Diagnosis Using DenseNet-121.* IET Conference Proceedings.

7. Rossi, M. and Rehman, S. (2025). *Integrating Artificial Intelligence into Telemedicine: Evidence, Challenges, and Future Directions.* Cureus.

8. Irtaza, M., Ali, A., Gulzar, M., and Wali, A. (2024). *Multi-Label Classification of Lung Diseases Using Deep Learning.* IEEE Access.

9. Saidu, F. and Wall, J. (2026). *Retrieval-Augmented Large Language Model for Clinical Decision Support with a Medical Knowledge Graph.* Electronics, 15(3), 555.

10. Mishra, G. (2024). *A Comprehensive Review of Smart Healthcare Systems: Architecture, Applications, Challenges, and Future Directions.* International Journal of Innovative Research in Technology and Science.

---

*Document prepared for Review 2 submission — March 2026*  
*MediFlow AI: An AI-Augmented Integrated Digital Healthcare Platform*  
*Author: Solomon Pattapu*
