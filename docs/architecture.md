# System Architecture Overview

```
+-----------------------------------------------------------------------------------+
|                            VAYOSETU MULTI-AGENT SYSTEM                            |
|                                                                                   |
|  [Citizen Data] --> Profiling Agent --> Eligibility Agent (Rules Engine + RAG)     |
|                                              │                                    |
|                                              ▼                                    |
|  [Roadmap UI] <--- Recommendation Agent <----+                                    |
|                                              │                                    |
|                                              ▼                                    |
|  [Notifications]<-- Reminder Agent <--- Planning Agent (Life-Event Cron)           |
+-----------------------------------------------------------------------------------+
```

- **Backend**: FastAPI + SQLite/PostgreSQL + LangGraph Orchestrator + ChromaDB RAG.
- **Frontend Field Worker Kiosk**: Next.js React Tablet UI (`frontend-field-dashboard`).
- **Frontend Admin Panel**: Next.js React Governance UI (`frontend-admin-panel`).
- **Microservices**: Node.js WhatsApp service & Python Voice IVR service.
