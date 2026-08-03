# Multi-Agent Design Specifications

| Agent | Responsibility | Implementation File |
|---|---|---|
| **Profiling Agent** | Data normalization & validation | `backend/app/agents/profiling_agent.py` |
| **Eligibility Agent** | Rule matching + RAG search | `backend/app/agents/eligibility_agent.py` |
| **Recommendation Agent** | Knowledge Graph roadmap | `backend/app/agents/recommendation_agent.py` |
| **Planning Agent** | Life-event & renewal triggers | `backend/app/agents/planning_agent.py` |
| **Document Verification Agent** | Blur & name mismatch checks | `backend/app/agents/document_verification_agent.py` |
| **Reminder Agent** | Format voice/WhatsApp alerts | `backend/app/agents/reminder_agent.py` |
| **Explainability Agent** | Counterfactual reasoning | `backend/app/agents/explainability_agent.py` |
| **Orchestrator** | LangGraph state machine | `backend/app/agents/orchestrator.py` |
