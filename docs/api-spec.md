# API Specification Summary

FastAPI interactive documentation is available at `http://localhost:8000/docs` when the backend is running.

## Key Endpoints

- `POST /api/v1/citizens/`: Create a new senior citizen profile.
- `GET /api/v1/citizens/`: List all registered citizens.
- `POST /api/v1/eligibility/evaluate-full/{citizen_id}`: Run full multi-agent pipeline (Profiling → Eligibility → RAG → Graph Roadmap → Life Event Triggers).
- `POST /api/v1/eligibility/evaluate-scheme/{citizen_id}/{scheme_id}`: Evaluate single scheme with counterfactual explanation.
- `GET /api/v1/schemes/graph`: Retrieve cross-scheme dependency knowledge graph.
- `POST /api/v1/admin/field/verify-document`: Run Document Verification Agent.
- `GET /api/v1/admin/district/escalations`: List open Level 2 escalations.
- `POST /api/v1/admin/district/escalations/{id}/resolve`: Approve and resolve escalation ticket.
- `GET /api/v1/admin/system/pipeline-health`: Check Level 3 AI pipeline telemetry.
- `POST /api/v1/webhooks/whatsapp`: Handle WhatsApp incoming messages.
- `POST /api/v1/webhooks/voice`: Handle Voice IVR incoming calls.
