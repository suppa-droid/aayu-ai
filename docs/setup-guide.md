# VayoSetu Complete Setup Guide

## 1. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## 2. Test Suite Execution
```bash
cd backend
pytest
```

## 3. Frontend Field Worker Dashboard Setup
```bash
cd frontend-field-dashboard
npm install
npm run dev -- -p 3000
```
Visit http://localhost:3000

## 4. Frontend Admin Panel Setup
```bash
cd frontend-admin-panel
npm install
npm run dev -- -p 3001
```
Visit http://localhost:3001

## 5. Microservices Setup
- **WhatsApp Service**: `cd whatsapp-service && npm install && npm start` (Port 4000)
- **Voice Service**: `cd voice-service && pip install -r requirements.txt && python src/call_orchestrator.py` (Port 5000)
