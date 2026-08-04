# 🛡️ Aayu AI (आयु)
### *Agentic AI-Driven Continuous Welfare Access & Renewal Assistance for India's Elderly*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2+-black.svg?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![PWA](https://img.shields.io/badge/PWA-IndexedDB%20Offline-5A0FC8.svg?style=flat&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-FF6F00.svg?style=flat&logo=python&logoColor=white)](https://langchain-ai.github.io/langgraph/)
[![Groq LPU](https://img.shields.io/badge/Groq-Llama--3.3--70B-F55036.svg?style=flat&logo=fastapi&logoColor=white)](https://groq.com)
[![Gemini API](https://img.shields.io/badge/Gemini-2.5--Flash-4285F4.svg?style=flat&logo=google&logoColor=white)](https://ai.google.dev/)
[![FAISS](https://img.shields.io/badge/FAISS-Semantic%20Vector%20RAG-blue.svg?style=flat&logo=python&logoColor=white)](https://github.com/facebookresearch/faiss)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20Cloud-336791.svg?style=flat&logo=postgresql&logoColor=white)](https://neon.tech)
[![Twilio](https://img.shields.io/badge/Twilio-WhatsApp%20Gateway-F22F46.svg?style=flat&logo=twilio&logoColor=white)](https://twilio.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌍 Live Demo (Vercel + Render + Neon PostgreSQL)

Our production deployment is currently live! You can test the end-to-end functionality right now:

- **📱 Field Worker PWA Dashboard**: [https://aayuworker.vercel.app](https://aayuworker.vercel.app)
- **🛡️ Admin Governance Portal**: [https://aayuadmin.vercel.app](https://aayuadmin.vercel.app)
- **⚡ Backend API (Render)**: [https://aayu-ai-backendsamo.onrender.com](https://aayu-ai-backendsamo.onrender.com)
- **📖 Interactive API Docs (Swagger)**: [https://aayu-ai-backendsamo.onrender.com/docs](https://aayu-ai-backendsamo.onrender.com/docs)

### 🔑 Demo Credentials

| Role | Username | Password | Portal |
|:---|:---|:---|:---|
| System Admin | `admin` | `password123` | [aayuadmin.vercel.app](https://aayuadmin.vercel.app) |
| District Admin | `district_admin` | `password123` | [aayuadmin.vercel.app](https://aayuadmin.vercel.app) |
| Field Worker | `field_worker` | `password123` | [aayuworker.vercel.app](https://aayuworker.vercel.app) |

> [!NOTE]
> **Local vs. Cloud Functionality**: Due to the 512MB RAM limit on Render's free tier, the heavy `sentence-transformers` PyTorch model (FAISS RAG) is bypassed in the cloud to prevent OOM crashes. When running locally, all AI models and RAG pipelines are 100% active.

> [!NOTE]
> **Gemini Vision OCR**: Real AI OCR is active on the cloud backend. On the free Gemini API tier, rate limits apply (~15 req/min). If quota is hit, the system gracefully degrades to simulation mode and resumes automatically on the next request.

> [!NOTE]
> **Render Cold Start**: The backend sleeps after 15 minutes of inactivity. The first request after sleep may take ~60 seconds. This is a Render free-tier limitation only.

---

## 📖 Table of Contents
1. [Executive Summary & Problem Statement](#-executive-summary--problem-statement)
2. [Key Capabilities & Innovation](#-key-capabilities--innovation)
3. [End-to-End System Architecture](#-end-to-end-system-architecture)
4. [Multi-Agent Execution Topology (LangGraph)](#-multi-agent-execution-topology-langgraph)
5. [FAISS Semantic RAG Engine & Ask Aayu Chatbot](#-faiss-semantic-rag-engine--ask-aayu-chatbot)
6. [Offline-First PWA & IndexedDB Architecture](#-offline-first-pwa--indexeddb-architecture)
7. [WhatsApp & Proactive Proxy Notification Microservice](#-whatsapp--proactive-proxy-notification-microservice)
8. [Three-Tier Human-In-The-Loop (HITL) Governance](#-three-tier-human-in-the-loop-hitl-governance)
9. [Supported Government Welfare Schemes](#-supported-government-welfare-schemes)
10. [Authentication & Security (RBAC)](#-authentication--security-rbac)
11. [Project Directory Layout](#-project-directory-layout)
12. [API Specification & Endpoints](#-api-specification--endpoints)
13. [Local Development & Setup Guide](#-local-development--setup-guide)
14. [Cloud Deployment Guide (Vercel + Render + Neon)](#-cloud-deployment-guide-vercel--render--neon)
15. [Docker Deployment](#-docker-deployment)
16. [Future Roadmap](#-future-roadmap)
17. [Production Patches & System Updates](#-production-patches--system-updates)

---

## 🎯 Executive Summary & Problem Statement

Over **140 million senior citizens** live in India, a demographic expected to double by 2050. Despite numerous high-impact central and state welfare initiatives (old-age pensions, universal 70+ healthcare coverage, subsidized assistive living devices), **over 62% of eligible seniors never receive their rightful benefits** due to:
- **Severe Digital Divide**: Complex online portals requiring English literacy and smartphone agility.
- **Intermittent Rural Connectivity**: Anganwadi field workers traveling to remote hamlets with zero cellular reception.
- **Fragmented Eligibility Rules**: Complex, multi-variable criteria (age tiers, BPL income thresholds, domicile rules, caste categories).
- **Document Tamper & Verification Friction**: Name mismatches between Aadhaar cards and ration cards leading to silent rejections.
- **Silent Welfare Expiry & Dropouts**: Failure to submit annual life certificates (*Jeevan Pramaan*) or income renewals.

**Aayu AI** is a multi-agent AI ecosystem that transforms passive government welfare into **proactive, continuous, lifelong assistance**. It equips Anganwadi and field staff with an offline-first PWA kiosk while providing district administrators with real-time grievance escalation, user management, and AI pipeline telemetry.

---

## 🌟 Key Capabilities & Innovation

* 🤖 **Multi-Agent Orchestration (LangGraph)**: 8 specialized autonomous agents collaborating on state graphs with Human-In-The-Loop checkpoints.
* 🧠 **FAISS Semantic RAG Engine**: Full Retrieval-Augmented Generation powered by Facebook's `faiss-cpu` and `sentence-transformers (all-MiniLM-L6-v2)`. Automatically indexes all welfare scheme YAML definitions at startup and performs semantic vector search at query time.
* 💬 **"Ask Aayu" Floating Chat Assistant**: A real-time floating chatbot widget embedded in the Field Worker Kiosk. Field workers can ask any question about scheme eligibility, benefits, or required documents and receive AI-generated answers grounded exclusively in official policy definitions.
* 🔊 **Audio Assist (Text-to-Speech)**: Integrated native Web Speech API to read AI responses aloud for elderly accessibility, with zero external dependencies.
* 📄 **Export PDF Receipt**: Generates a styled, print-ready PDF summary of a citizen's eligibility results and actionable counterfactuals directly from the dashboard.
* ⚡ **Offline-First PWA with Native IndexedDB**: Complete offline kiosk support for remote zero-connectivity villages. Automatically queues drafts, pre-caches scheme criteria, and syncs seamlessly when connection is restored.
* 📱 **Twilio WhatsApp Notification Microservice**: Proactive lifecycle reminders, Jeevan Pramaan submission alerts, and application status updates dispatched to family proxies. Includes a simulation engine for zero-cost local testing.
* 📜 **Dual-Layer Deterministic Rules + Semantic RAG**: AST-based YAML expression evaluation for zero-hallucination legal accuracy combined with FAISS vector semantic search.
* 🔍 **Counterfactual Explainability Engine**: Plain-language explanations detailing not just *why* an applicant was rejected, but *the exact actionable steps* required to qualify.
* 🗺️ **Cross-Scheme Dependency Roadmap**: Automatically sequences benefits chronologically (Aadhaar correction → IGNOAPS Pension → AB-PMJAY Healthcare → RVY Assistive Device).
* 👁️ **Gemini Vision Optical Verification & Fraud Sentinel**: OCR document parsing using `gemini-2.5-flash` with automated name-matching, blur detection, and tamper flagging. Gracefully degrades under API quota limits.
* 🔐 **Alphanumeric CAPTCHA Security**: Both portals feature randomized 6-character alphanumeric CAPTCHA challenges on their login pages to prevent automated bot access.
* 👥 **User & Role Management**: Administrative interface for managing Field Workers, District Admins, and System Admins with full editing capabilities.
* 📊 **Real-Time AI Pipeline Telemetry**: Live hardware metrics (CPU%, RAM RSS, Uptime) and roundtrip database latency monitoring.
* 🗄️ **Permanent Cloud PostgreSQL Database**: All citizen registrations, applications, and user data stored permanently in Neon PostgreSQL — persists across all server restarts and redeployments.

---

## 🏗️ End-to-End System Architecture

```mermaid
graph TD
    subgraph "Frontend Layer (Vercel)"
        FW["📱 Field Worker PWA\naayuworker.vercel.app\nNext.js 14 + IndexedDB + Ask Aayu"]
        ADM["🛡️ Admin Portal\naayuadmin.vercel.app\nNext.js 14 + Escalations + Telemetry"]
    end
    subgraph "Notification Microservice"
        WA["💬 WhatsApp Service\nNode.js + Express + Twilio SDK"]
    end
    subgraph "API Gateway (Render)"
        GW["⚡ FastAPI Backend\nJWT + Bcrypt + CORS + CAPTCHA"]
    end
    subgraph "LangGraph Multi-Agent AI Core"
        ORCH["🧠 Orchestrator"]
        PROF["👤 Profiling Agent"]
        RULE["📜 Rule Verification AST"]
        EXP["💡 Explainability Agent"]
        REC["🎁 Recommendation Agent"]
        PLAN["🗺️ Planning Agent"]
        DOC["👁️ Document Verification Gemini"]
        REM["⏰ Reminder Agent"]
    end
    subgraph "Storage and Knowledge Base"
        PG["🗄️ Neon PostgreSQL\nPermanent Cloud DB"]
        FAISS["🔍 FAISS Vector Store\nall-MiniLM-L6-v2 384-dim"]
        YAML["📑 YAML Scheme Policy Matrix\nIGNOAPS AB-PMJAY RVY AVYAY SACRED"]
    end
    FW -->|REST API + JWT| GW
    ADM -->|REST API + JWT| GW
    GW -->|HTTP Webhooks| WA
    GW --> ORCH
    ORCH --> PROF
    ORCH --> RULE
    ORCH --> EXP
    ORCH --> REC
    ORCH --> PLAN
    ORCH --> DOC
    ORCH --> REM
    RULE --> YAML
    EXP --> FAISS
    FAISS --> YAML
    GW --> PG
```

---

## 🤖 Multi-Agent Execution Topology (LangGraph)

The core decision engine runs as a compiled **LangGraph StateGraph** consisting of 8 specialized agents:

```mermaid
stateDiagram-v2
    [*] --> ProfilingAgent: Ingest Citizen Payload
    ProfilingAgent --> RuleVerificationAgent: Normalized Schema
    RuleVerificationAgent --> ExplainabilityAgent: Scheme Status Matrix
    ExplainabilityAgent --> RecommendationAgent: Counterfactual Gaps
    RecommendationAgent --> PlanningRoadmapAgent: Top Eligible Schemes
    PlanningRoadmapAgent --> ReminderAgent: Milestone Triggers
    ReminderAgent --> DocumentVerificationAgent: Check Pending Docs
    DocumentVerificationAgent --> [*]: Complete Beneficiary Roadmap
```

| Agent | Responsibility | File |
| :--- | :--- | :--- |
| **`ProfilingAgent`** | Normalizes raw field worker inputs, standardizes age/income, extracts verification tags | `agents/profiling_agent.py` |
| **`RuleVerificationAgent`** | Evaluates deterministic YAML rules via Python AST + FAISS knowledge base | `agents/rule_verification_agent.py` |
| **`ExplainabilityAgent`** | Generates human-readable counterfactuals explaining what steps unlock each benefit | `agents/explainability_agent.py` |
| **`RecommendationAgent`** | Ranks qualifying welfare programs by financial impact, urgency, and category | `agents/recommendation_agent.py` |
| **`PlanningAgent`** | Synthesizes a chronological, dependency-aware welfare adoption roadmap | `agents/planning_agent.py` |
| **`DocumentVerificationAgent`** | Uses Gemini Vision `gemini-2.5-flash` for OCR, blur analysis, and tamper detection | `agents/document_verification_agent.py` |
| **`ReminderAgent`** | Calculates proactive triggers (Life Certificate due date, age milestone 70) | `agents/reminder_agent.py` |
| **`Orchestrator`** | LangGraph StateGraph engine compiling and coordinating all agent nodes | `agents/orchestrator.py` |

---

## ⚡ Offline-First PWA & IndexedDB Architecture

The Field Worker Dashboard operates seamlessly in remote Indian villages with zero cellular reception.

### 1. Installable App (No App Store Needed)
A configured `manifest.json` and Service Worker (`sw.js`) allow the app to be installed directly to any phone or tablet home screen — behaving exactly like a native Android/iOS app.

### 2. 100% Offline Access
* **UI Caching**: Service Worker implements Stale-While-Revalidate caching. The app loads instantly even with airplane mode on.
* **Offline Saving**: Citizen registration data is safely saved to the device's local IndexedDB via `OfflineStorageManager` (`lib/offline-db.ts`) when offline.
* **Offline Scheme Cache**: Pre-caches welfare scheme rules so Anganwadi workers can consult criteria in the field without connectivity.
* **Auto-Sync Engine**: `PWARegistration.tsx` listens for network reconnect events and automatically pushes saved drafts to the backend in batch — no user intervention needed.

---

## 📱 WhatsApp & Proactive Proxy Notification Microservice

Located in `whatsapp-service/`, this Node.js microservice is the omnichannel communications gateway for senior citizens' family proxies:

* **Real Twilio Integration**: Dispatches formatted WhatsApp messages using the Twilio Node.js SDK when credentials are provided.
* **Zero-Cost Simulation Engine**: Falls back to formatted console logs during local development if Twilio keys are omitted.
* **FastAPI Interoperability**:
  - `POST /api/notify/application-status`: Real-time approval, escalation, or rejection notices.
  - `POST /api/notify/reminder`: Proactive reminders (Annual Jeevan Pramaan, 70th Birthday healthcare upgrade).
  - `POST /api/notify/action-required`: Plain-language instructions for family members.

---

## 🛡️ Three-Tier Human-In-The-Loop (HITL) Governance

```mermaid
flowchart LR
    L1["Tier 1: Anganwadi Field Worker\nTablet Kiosk + Onboarding + Doc Upload"] -->|Auto Pass| AutoApprove["Direct Processing"]
    L1 -->|Discrepancy or Name Mismatch| L2["Tier 2: District Admin\nManual Override + Legal Review"]
    L2 -->|Policy Conflict or Fraud| L3["Tier 3: System Admin\nRule Matrix Update + Telemetry"]
```

---

## 🏛️ Supported Government Welfare Schemes

1. **IGNOAPS** (Indira Gandhi National Old Age Pension Scheme): ₹500–₹1,000/mo social security for BPL citizens aged 60+.
2. **AB-PMJAY**: ₹5,00,000 annual cashless hospitalization for **all citizens aged 70+** regardless of income.
3. **Rashtriya Vayoshri Yojana (RVY)**: Free assistive devices (spectacles, walking sticks, wheelchairs, hearing aids, dentures) for BPL seniors.
4. **Varishtha Mediclaim**: Comprehensive healthcare insurance for seniors aged 60–80.
5. **SACRED & AVYAY Portals**: Senior Citizen Employment and Active Aging platforms.

---

## 🔍 FAISS Semantic RAG Engine & Ask Aayu Chatbot

Aayu AI implements a **full production-grade Retrieval-Augmented Generation (RAG) pipeline** using Facebook's FAISS vector library and `sentence-transformers`.

```
User Question (natural language)
        │
[1. EMBED]    all-MiniLM-L6-v2 encodes query into 384-dim float32 vector
        │
[2. RETRIEVE] FAISS IndexFlatIP cosine similarity search
              Returns Top-4 most semantically relevant scheme chunks
        │
[3. AUGMENT]  Retrieved chunks injected into Groq LLM prompt as grounded context
        │
[4. GENERATE] Llama-3.3-70b generates accurate, hallucination-free answer
```

### Knowledge Ingestion at Startup
On every backend boot, the `lifespan` event automatically:
1. Reads all YAML scheme policy files from `backend/app/rules_engine/schemes/`.
2. Converts each file into rich, human-readable text chunks.
3. Embeds each chunk with `all-MiniLM-L6-v2` (384 dimensions).
4. Builds a FAISS `IndexFlatIP` (inner product = cosine on normalized vectors).

---

## 🔐 Authentication & Security (RBAC)

* **JWT Bearer Token Architecture**: Native FastAPI token verification (`HS256`).
* **Cryptographic Password Hashing**: Native `bcrypt` algorithm.
* **Alphanumeric CAPTCHA Protection**: Randomized 6-character CAPTCHA on every login visit. Excludes ambiguous characters (`I`, `O`, `0`, `1`). Auto-refreshes on failed attempts.
* **Role-Based Access Control (RBAC)**:
  - `FIELD_WORKER`: Field Dashboard, citizen onboarding, document upload, offline sync.
  - `DISTRICT_ADMIN`: District Escalations queue, mismatch resolution.
  - `SYSTEM_ADMIN`: Full access — User Management, hardware telemetry, policy rule editing.

---

## 📂 Project Directory Layout

```
vayosetu/
├── backend/                            # FastAPI Python Backend
│   ├── app/
│   │   ├── agents/                     # LangGraph multi-agent modules
│   │   ├── api/v1/                     # REST API route controllers
│   │   │   ├── auth.py                 # JWT Auth & User Management APIs
│   │   │   ├── citizens.py             # Citizen CRUD
│   │   │   ├── eligibility.py          # Orchestration pipeline triggers
│   │   │   ├── applications.py         # Application management
│   │   │   ├── documents.py            # OCR Document verification
│   │   │   ├── reminders.py            # Lifecycle trigger scheduling
│   │   │   └── admin_system.py         # Hardware Telemetry & Rules APIs
│   │   ├── core/                       # Security & JWT logic
│   │   ├── db/                         # SQLAlchemy session & PostgreSQL init
│   │   ├── models/                     # Database models & Pydantic schemas
│   │   ├── rag/                        # FAISS semantic vector search engine
│   │   ├── services/                   # Business logic services
│   │   ├── rules_engine/               # AST evaluator & YAML schemes
│   │   ├── config.py                   # Environment configuration
│   │   └── main.py                     # FastAPI entrypoint
│   └── requirements.txt                # Python dependencies
│
├── frontend-field-dashboard/           # Next.js 14 Offline-First PWA Kiosk
│   ├── app/                            # Routes: login, register, citizens, documents, applications, offline-sync
│   ├── components/                     # Navigation, ChatAssistant, PWARegistration
│   ├── lib/                            # api-client, offline-db, auth
│   └── public/                         # PWA manifest.json, sw.js, icons
│
├── frontend-admin-panel/               # Next.js 14 Admin Governance Portal
│   ├── app/                            # Routes: dashboard, login, users, escalations, scheme-rules, pipeline-health
│   ├── components/                     # Navigation & charts
│   └── lib/                            # Admin API client
│
├── whatsapp-service/                   # Node.js Twilio WhatsApp Microservice
│   └── src/index.js                    # Express gateway & Simulation mode
│
├── voice-service/                      # Regional dialect audio brief service
├── docker-compose.yml                  # Full-stack container orchestration
├── .env.example                        # Environment variables template
└── README.md                           # This file
```

---

## 📡 API Specification & Endpoints

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/login` | OAuth2 form login returning JWT Bearer token |
| **Auth** | `POST` | `/api/v1/auth/register` | Register a new Field Worker or District Admin |
| **Auth** | `GET` | `/api/v1/auth/users` | List all registered users (passwords excluded) |
| **Auth** | `PUT` | `/api/v1/auth/users/{id}` | Edit an existing user's name, role, or district |
| **RAG Chat** | `POST` | `/api/v1/ask` | **Ask Aayu AI**: FAISS semantic search + Groq LLM answer |
| **Citizens** | `GET` | `/api/v1/citizens/` | Retrieve all registered citizens |
| **Citizens** | `POST` | `/api/v1/citizens/` | Register a new senior citizen profile |
| **Citizens** | `GET` | `/api/v1/citizens/{id}` | Retrieve specific citizen details |
| **Eligibility** | `POST` | `/api/v1/eligibility/evaluate-full/{id}` | **Run full 8-agent LangGraph pipeline** |
| **Applications** | `GET` | `/api/v1/applications/` | List all welfare scheme applications |
| **Applications** | `POST` | `/api/v1/applications/` | Submit an application for an eligible citizen |
| **Escalations** | `GET` | `/api/v1/admin/district/escalations` | Level 2 escalation queue |
| **Escalations** | `POST` | `/api/v1/admin/district/escalations/{id}/resolve` | Resolve escalation or approve override |
| **Telemetry** | `GET` | `/api/v1/admin/system/pipeline-health` | Live hardware & DB ping latency |
| **Rules** | `GET` | `/api/v1/admin/system/rules` | Retrieve loaded policy rules |
| **WhatsApp** | `POST` | `http://localhost:4000/api/notify/*` | Lifecycle alerts to family proxies |

---

## 🚀 Local Development & Setup Guide

### 1. Prerequisites
- **Python**: `3.10` or higher
- **Node.js**: `18.x` or higher
- **Groq API Key**: Free from [console.groq.com](https://console.groq.com)
- **Google Gemini API Key**: Free from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### 2. Environment Configuration

Create a `.env` file in the `backend/` directory:

```bash
GOOGLE_API_KEY="your_google_gemini_api_key_here"
GROQ_API_KEY="your_groq_api_key_here"
GROQ_MODEL="llama-3.3-70b-versatile"
SECRET_KEY="super-secret-aayu-ai-jwt-key"
# SQLite used locally by default. For cloud deployment, set:
# DATABASE_URL="postgresql://user:password@host.neon.tech/neondb?sslmode=require"
```

### 3. Backend Setup (FastAPI)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS

pip install -r requirements.txt
# For local FAISS RAG features (~2GB download):
pip install faiss-cpu sentence-transformers torch transformers

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: `http://localhost:8000`
- Swagger Docs: `http://localhost:8000/docs`

### 4. Field Worker PWA Dashboard (Port 3000)

```bash
cd frontend-field-dashboard
npm install
npm run dev -- -p 3000
```

Login: `field_worker` / `password123`

### 5. Admin Governance Portal (Port 3001)

```bash
cd frontend-admin-panel
npm install
npm run dev -- -p 3001
```

Login: `admin` / `password123`

### 6. WhatsApp Notification Microservice (Port 4000)

```bash
cd whatsapp-service
npm install
npm start
```

---

## ☁️ Cloud Deployment Guide (Vercel + Render + Neon)

### Step 1: Create a Free PostgreSQL Database (Neon)
1. Go to **[neon.tech](https://neon.tech)** and sign up for free.
2. Create a new project (e.g. `aayu-ai-db`).
3. Copy the **Connection String**: `postgresql://user:pass@host.neon.tech/neondb?sslmode=require`

### Step 2: Deploy Backend (Render)

- **Service Type**: Web Service
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Environment Variables** (set in Render → Environment tab):

| Key | Value |
|:---|:---|
| `DATABASE_URL` | Your Neon PostgreSQL connection string |
| `SECRET_KEY` | Any secure random string |
| `GOOGLE_API_KEY` | Your Google Gemini API key (from AI Studio) |
| `GROQ_API_KEY` | Your Groq API key |

### Step 3: Deploy Frontends (Vercel)

Import your GitHub repository into Vercel **twice** — once for each app:

**Field Worker Dashboard**:
1. Go to [vercel.com/new](https://vercel.com/new) → Import your `aayu-ai` repo
2. Set **Root Directory** to `frontend-field-dashboard`
3. Add env var: `NEXT_PUBLIC_API_URL` = your Render backend URL
4. Click **Deploy**

**Admin Governance Portal**:
1. Go to [vercel.com/new](https://vercel.com/new) → Import your `aayu-ai` repo
2. Set **Root Directory** to `frontend-admin-panel`
3. Add env var: `NEXT_PUBLIC_API_URL` = your Render backend URL
4. Click **Deploy**

---

## 🐳 Docker Deployment

```bash
docker-compose up --build -d
```

| Service | URL |
|:---|:---|
| Backend API | `http://localhost:8000` |
| Field Dashboard (PWA) | `http://localhost:3000` |
| Admin Panel | `http://localhost:3001` |
| WhatsApp Gateway | `http://localhost:4000` |

---

## 🔮 Future Roadmap

- [x] Offline-First PWA with IndexedDB synchronization engine
- [x] WhatsApp Family Proxy Notification Gateway
- [x] Administrative User & Role Management
- [x] FAISS Semantic RAG Engine with `all-MiniLM-L6-v2` embeddings
- [x] Ask Aayu Floating AI Chatbot (RAG-powered)
- [x] Audio Assist (Text-to-Speech) for chatbot responses
- [x] Export PDF Eligibility Receipts
- [x] Alphanumeric CAPTCHA Login Security
- [x] Permanent Cloud PostgreSQL Database (Neon)
- [x] Gemini Vision OCR with graceful quota-aware degradation
- [x] Full Application Lifecycle with Admin Kanban Board
- [ ] DigiLocker Direct Integration
- [ ] Bhashini Voice AI (22 Indian regional languages)
- [ ] Jeevan Pramaan Biometric Bridge (RD-service fingerprint)

---

## 🛠️ Production Patches & System Updates

All fixes below are live on the deployed system:

| Fix | Details |
|:---|:---|
| **PostgreSQL Migration** | Migrated from ephemeral Render SQLite (wiped on every redeploy) to permanent Neon cloud PostgreSQL. All citizen, user, and application data now persists forever. |
| **Gemini Vision SDK** | Added `google-genai` package to `requirements.txt`. The agent uses `from google import genai` (new SDK) which was missing on Render, causing permanent DEMO MODE fallback. |
| **Google API Key** | Diagnosed and resolved API key mismatch between local `.env` and Render environment. Real Gemini OCR is now active on the cloud. |
| **Frontend API URL** | Resolved env variable mismatch (`NEXT_PUBLIC_API_URL` vs `NEXT_PUBLIC_API_BASE_URL`). Added fallback Render URL in `next.config.js` as a safety net. |
| **FAISS RAG Upgrade** | Replaced in-memory context-dump with proper FAISS `IndexFlatIP` vector store. Scheme YAMLs auto-chunked, embedded, and indexed on every backend startup. |
| **Ask Aayu Chatbot** | Added floating AI chatbot (`ChatAssistant.tsx`) to the Field Dashboard for natural-language scheme queries. |
| **Audio Assist** | Added Text-to-Speech toggle to Ask Aayu and "Download PDF" receipt generator for eligibility results. |
| **CAPTCHA Security** | Both login portals now display a randomized 6-character alphanumeric CAPTCHA, auto-refreshing on failed attempts. |
| **Offline Reliability** | Fixed IndexedDB bug where transient initial blocks permanently locked the database until reload. |
| **Data Integrity** | Added missing `has_bpl_card` boolean to the frontend PWA register form, fixing backend schema sync. |
| **Security Alignment** | Fixed backend security module incorrectly reading `JWT_SECRET` instead of `SECRET_KEY`. |
| **Notification Names** | WhatsApp microservice now passes real Senior Citizen names instead of a hardcoded "Citizen" string. |
| **AI Vision Hybrid** | Switched to `gemini-2.5-flash` for Document Verification. Fallback escalates unverified images as `FRAUD_ALERT` instead of auto-approving. |
| **Application Pipeline** | Full lifecycle added: Field Workers submit from AI Roadmap; District Admins review on a real-time Kanban Board. |

---

## 📜 License
This project is licensed under the **MIT License**.
Distributed freely to empower welfare access for every senior citizen across India.
