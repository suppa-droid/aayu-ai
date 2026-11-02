# Aayu AI (आयु)

Agentic welfare kiosk for Indian senior-citizen schemes. A field worker registers a citizen, a rules engine plus a four-step agent pipeline scores the schemes, and a district admin resolves cases the kiosk cannot decide.

This file is the handoff for a new computer. The only transfer is GitHub. Clone the repo or download the ZIP. Do not look for a USB copy.

Repository: https://github.com/suppa-droid/aayu-ai

```powershell
git clone https://github.com/suppa-droid/aayu-ai.git
Set-Location aayu-ai
```

ZIP: https://github.com/suppa-droid/aayu-ai/archive/refs/heads/main.zip

After a ZIP download, the folder is named `aayu-ai-main`. Open a terminal in that folder.

`backend/.env` is in the repository. It already has the Groq and Gemini keys the demo uses. Do not create a second env file and do not delete that one. The database file is not in Git. The first API start creates `backend/aayu_ai.db` and the three demo logins.

`backend/venv`, `node_modules`, and `.next` are not in Git. Install them on the lab PC. The lab PC needs the internet once, for `pip`, `npm`, and the first embedding-model download.

### Software the lab PC must have before the project

| Tool | Version that works | Why |
| --- | --- | --- |
| Python | 3.11, 3.12, or 3.13. The original PC used 3.13.5. | Backend, agents, RAG |
| pip and the stdlib `venv` module | comes with that Python | Isolated install |
| Node.js | 20 LTS (18.17 or newer also works) | Both Next.js apps |
| npm | comes with Node | Frontend installs |
| A browser | Microsoft Edge or Google Chrome | The two websites |
| Git | any current version | Only if you clone instead of copying the folder |

Disk: keep at least 6 GB free. PyTorch and the embedding model are large.

Windows also needs the [Microsoft Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist) if `import torch` fails with a missing DLL.

Redis, PostgreSQL, Docker, Twilio, and a GPU are not required for the local demo.

## Install, from a terminal opened in the project root

The examples below use PowerShell. On macOS or Linux, create the virtualenv with `python3 -m venv venv`, activate it with `source venv/bin/activate`, and call `python` instead of `.\venv\Scripts\python.exe`.

### 1. Backend Python libraries

```powershell
Set-Location backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install --upgrade pip
.\venv\Scripts\python.exe -m pip install -r requirements-lab.txt
```

`requirements-lab.txt` installs `requirements.txt` and the RAG packages `faiss-cpu==1.14.3`, `sentence-transformers==5.6.1`, `torch==2.13.0`, and `transformers==5.14.1`. Use that file on the lab PC. `requirements.txt` alone is what the small cloud host installs. Without the four RAG packages, scheme keyword search still answers and FAISS stays off.

Packages from `backend/requirements.txt`:

| Package | Role |
| --- | --- |
| fastapi, uvicorn, starlette, python-multipart, httpx, orjson | HTTP API |
| pydantic, pydantic-settings, python-dotenv | Settings and request bodies |
| sqlalchemy, psycopg2-binary | SQLite locally, PostgreSQL when `DATABASE_URL` is Postgres |
| pyyaml | Scheme rules |
| langchain, langchain-core, langgraph, langgraph-checkpoint | Agent pipeline |
| langchain-groq, groq | Written answers and recommendations |
| langchain-google-genai, google-generativeai, google-genai | Document photo check |
| PyJWT, bcrypt, passlib | Login tokens and password hashes |
| numpy, pillow, filetype | Vectors and uploaded images |
| psutil | Pipeline health CPU and memory |
| requests, tenacity, pytest | HTTP helpers and tests |

RAG packages installed by the second `pip install`:

| Package | Version used here | Role |
| --- | --- | --- |
| faiss-cpu | 1.14.3 | Vector index |
| sentence-transformers | 5.6.1 | `all-MiniLM-L6-v2` embeddings |
| torch | 2.13.0 | Model runtime |
| transformers | 5.14.1 | Tokenizer and model code used by sentence-transformers |

### 2. Backend environment file

`backend/.env` is already in the GitHub download. The API reads it from the `backend` directory. If that file is ever missing, copy `backend/.env.example` to `backend/.env` and fill the keys. A normal clone already has the real file, so skip that.

```env
GOOGLE_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
GROQ_MODEL=openai/gpt-oss-120b
SECRET_KEY=replace-with-a-random-string-at-least-32-characters
DATABASE_URL=sqlite:///./aayu_ai.db
```

- Groq key: [console.groq.com](https://console.groq.com). Used for Ask Aayu and the recommendation text.
- Gemini key: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey). Used only when a real document photo is checked.
- Leave the keys empty and the rules engine still scores schemes. Chat then returns the retrieved scheme text. A non-demo photo stays unverified and opens an admin ticket. It is never auto-approved.
- Do not set `GROQ_MODEL` to `llama-3.3-70b-versatile`. That name returns 404. The code tries `openai/gpt-oss-120b`, then `qwen/qwen3.8-27b`.
- `SECRET_KEY` signs JWTs. Use 32 or more characters so the JWT library does not warn.
- Default database file is `backend/aayu_ai.db`. You do not need Postgres for the lab demo.

### 3. Field kiosk libraries

```powershell
Set-Location ..\frontend-field-dashboard
npm ci
```

`npm ci` uses `package-lock.json`. If that file is missing, run `npm install` instead.

Then create `frontend-field-dashboard/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Runtime libraries: `next@14.2.3`, `react@18`, `react-dom@18`, `axios`, `lucide-react`, `next-pwa`, `react-hook-form`, `@hookform/resolvers`, `zod`. Dev libraries: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`.

### 4. Admin portal libraries

```powershell
Set-Location ..\frontend-admin-panel
npm ci
```

Create `frontend-admin-panel/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Runtime libraries: `next@14.2.3`, `react@18`, `react-dom@18`, `axios`, `lucide-react`. Dev libraries: `typescript` and the same `@types` packages as the field app.

`next dev` with no env file falls back to `http://localhost:8000/api/v1`. Still write `.env.local` so a production build does not call the old cloud API by accident.

## Run the demo

Use three terminals. Leave each one open.

Terminal A, API:

```powershell
Set-Location backend
.\venv\Scripts\python.exe run_local.py
```

Wait until the log says `Application startup complete`. The first boot downloads `all-MiniLM-L6-v2` from Hugging Face and can take several minutes. Keyword answers work before that download finishes. Semantic search works after the log says the RAG embeddings are ready. A missing `HF_TOKEN` only prints a Hugging Face rate-limit warning.

- API: http://127.0.0.1:8000
- Swagger: http://127.0.0.1:8000/docs
- The process binds `0.0.0.0:8000` and reloads when files under `backend/app` change.

Terminal B, field kiosk, port 3000:

```powershell
Set-Location frontend-field-dashboard
npm run dev
```

Open http://localhost:3000/login. The first page compile can take 10–25 seconds.

Terminal C, admin portal, port 3001:

```powershell
Set-Location frontend-admin-panel
npm run dev
```

Open http://localhost:3001/login.

The port is already inside each `package.json` script. Do not add another `-p`.

### Demo logins

Startup inserts these users only when the username is missing. It does not reset a password that already exists. Every password is `password123`.

| Portal | URL | Username | Role |
| --- | --- | --- | --- |
| Field kiosk | http://localhost:3000/login | `field_worker` | FIELD_WORKER |
| Admin portal | http://localhost:3001/login | `admin` | SYSTEM_ADMIN |
| Admin portal | http://localhost:3001/login | `district_admin` | DISTRICT_ADMIN |

Each login page shows a 6-character code. Type that code into the security box. The field button says Secure Login. The admin button says Secure Admin Login. A field account is rejected on the admin site, and an admin account is rejected on the field kiosk.

### Click path that proves the demo

1. Sign in on the field kiosk as `field_worker`.
2. Register a senior: age 68, monthly income 1800, BPL yes, district Varanasi, and mark Aadhaar, BPL card, and bank account as present.
3. Open that citizen and run eligibility. Wait until the page shows Evaluation Matrix or Schemes Matched. IGNOAPS should be eligible. The pipeline also returns AVYAY, AB-PMJAY 70+, RVY, and SACRED.
4. Ask Aayu a question such as "What is the IGNOAPS pension at age 68?" The answer should mention Rs 500.
5. Sign in on the admin portal as `admin`. Open Pipeline Health and confirm seven agents: Profiling, Eligibility, Explainability, Recommendation, Planning, DocumentVerification, Reminder.

Citizen rows, applications, escalations, and reminders are stored in `backend/aayu_ai.db`.

### Tests

From `backend`, after the venv exists:

```powershell
.\venv\Scripts\python.exe -m pytest tests
```

Do not run a bare `pytest`. A file named `backend/test_auth.py` calls localhost at import time and breaks collection. The suite that matches this tree is `backend/tests`.

## What the running system does

Two Next.js sites call one FastAPI app. The API calls the agent pipeline, Ask Aayu, Gemini document check, and the database. Those four do not call each other.

Scheme law lives in YAML, not in the chat model:

- IGNOAPS, `ignoapss.yaml`. Pension. Rs 500 from age 60, Rs 800 from age 80, for the BPL profile the rules describe.
- AB-PMJAY 70+, `ayushman_bharat_senior.yaml`. Age 69 prepares e-KYC. Age 70 names the Rs 5 lakh cover.
- Rashtriya Vayoshri (RVY), `rashtriya_vayoshri.yaml`.
- AVYAY, `atal_vayo_abhyuday.yaml`.
- SACRED, `sacred_portal.yaml`.

A missing BPL flag still adds the annual BPL re-verification note.

Agent order inside one eligibility run: Profiling, then YAML Eligibility (explainability runs inside that step), then Groq Recommendation, then Planning. Document check and reminders are outside that sequence. The orchestrator is not an eighth agent.

Document photos: the vision models are `gemini-3.6-flash`, then `gemini-3.5-flash-lite`. `gemini-2.0-flash` and `gemini-2.5-flash` are not used. Only the demo filenames `matching_aadhaar`, `name_mismatch`, and `blurry_image` skip vision. Any other file stays invalid when vision fails. `name_mismatch` opens a district ticket.

Ask Aayu embeds the YAML with `all-MiniLM-L6-v2`, searches FAISS, and asks Groq to answer from those chunks. An unrelated question returns no chunks. If Groq is down, the answer is the retrieved scheme text.

The field kiosk queues offline registrations in IndexedDB database `vayosetu_field_db`.

Auth is a form login (`username`, `password`) to `POST /api/v1/auth/login`. The response is a JWT. Passwords are bcrypt hashes.

## API map

Base path: `http://127.0.0.1:8000/api/v1`. Swagger lists every route. These are the ones the screens use.

| Method | Path | Who |
| --- | --- | --- |
| POST | `/auth/login` | Public form login |
| GET | `/auth/me` | Signed-in user |
| POST | `/auth/register` | Admin creates a user |
| GET | `/auth/users` | Admin |
| POST | `/citizens/` | Field worker registers a senior |
| GET | `/citizens/` and `/citizens/{id}` | Signed-in user |
| GET | `/schemes/` and `/schemes/graph` | Signed-in user |
| POST | `/eligibility/evaluate-full/{citizen_id}` | Full agent run |
| POST | `/eligibility/evaluate-scheme/{citizen_id}/{scheme_id}` | One scheme |
| POST | `/applications/` | File one scheme |
| GET | `/applications/?citizen_id=` | List filings |
| PATCH | `/applications/{id}/status` | Admin |
| POST | `/admin/field/verify-document` | Multipart document check |
| GET | `/admin/district/escalations` | Admin |
| POST | `/admin/district/escalate` | Open a ticket for a real application |
| POST | `/admin/district/escalations/{id}/resolve` | JSON body `resolution_notes` |
| POST | `/ask` | Ask Aayu. JSON body `query` |
| POST | `/reminders/` | Schedule a reminder. Unknown citizen returns 404 |
| GET | `/reminders/pending` | Signed-in user |
| GET | `/admin/system/pipeline-health` | Admin |
| GET | `/admin/system/analytics` | Admin |
| GET | `/admin/system/rules` | Admin |
| POST | `/webhooks/whatsapp` and `/webhooks/voice` | Optional stubs |

Field routes that need a user reject a missing token with 401. Admin-only routes reject a field worker with 403.

## Directory map

```
vayosetu/
├── backend/
│   ├── app/main.py                 # FastAPI app, CORS, router mounts
│   ├── app/config.py               # .env settings
│   ├── app/agents/                 # seven agent modules plus orchestrator.py
│   ├── app/api/v1/                 # auth, citizens, schemes, eligibility,
│   │                               # applications, reminders, rag_chat,
│   │                               # admin_field, admin_district, admin_system, webhooks
│   ├── app/rag/                    # ingestion, vector_store, retriever
│   ├── app/rules_engine/schemes/   # the five YAML files
│   ├── app/services/               # citizens, applications, escalations, RAG, reminders
│   ├── app/db/session.py           # SQLite engine and seed users
│   ├── requirements.txt
│   ├── run_local.py                # uvicorn on port 8000
│   └── tests/
├── frontend-field-dashboard/       # Next.js kiosk, port 3000
├── frontend-admin-panel/           # Next.js admin, port 3001
├── whatsapp-service/               # optional Express stub
├── voice-service/                  # optional FastAPI stub
└── docker-compose.yml              # optional; see the note below
```

There is no `backend/app/api/v1/documents.py`. Document upload is `admin_field.py`.

## Optional pieces

WhatsApp service, only if you want it:

```powershell
Set-Location whatsapp-service
npm ci
npm start
```

Libraries: `express`, `axios`, `dotenv`, `twilio`. It expects Twilio variables and is not part of the kiosk demo.

Voice service:

```powershell
Set-Location voice-service
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

That file pins `fastapi==0.110.0`, `uvicorn==0.28.0`, and `requests==2.31.0`.

Docker Compose starts Postgres, Redis, the API, and both sites. The backend image installs `requirements.txt` only, so FAISS and torch are absent inside that container. Use the three-terminal install above for a lab demo that includes semantic RAG. Redis is not required by the running API.

## Checks if something fails

| What you see | What to do |
| --- | --- |
| `python` is not recognized | Install Python 3.11+ and enable "Add python.exe to PATH", then open a new terminal. |
| `npm` is not recognized | Install Node.js 20 LTS and open a new terminal. |
| Port 8000, 3000, or 3001 already in use | Stop the old process, or the demo is already running. Open the URL. |
| Field or admin page calls the wrong host | Confirm `.env.local` is `http://localhost:8000/api/v1` and restart `npm run dev`. |
| Login says the server is down | The API terminal must show `Application startup complete` first. |
| Ask Aayu has no semantic hits yet | Wait for the embedding log line. Keyword overlap still answers scheme questions. |
| `pip install torch` fails | Use Python 3.11 or 3.12. On Windows, install the VC++ redistributable. |
| Hugging Face download stalls | Retry. The lab PC must reach huggingface.co on the first boot. |
| Document photo is not approved | Expected when the Gemini key is missing or the name does not match. Demo filename `matching_aadhaar` is the only name-match shortcut. |

## Cloud hosts

These public sites are an older deployment. They do not update when you edit files on the lab PC.

- Field: https://aayuworker.vercel.app
- Admin: https://aayuadmin.vercel.app
- API: https://aayu-ai-backendsamo.onrender.com

The free API sleeps after about 15 minutes. The first call can take up to a minute. Do not point the lab `.env.local` files at that host if the API is running on the lab PC.
