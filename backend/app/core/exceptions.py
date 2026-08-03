from fastapi import HTTPException, status

class VayoSetuException(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)

class CitizenNotFoundException(VayoSetuException):
    def __init__(self, citizen_id: str):
        super().__init__(detail=f"Citizen profile '{citizen_id}' not found.", status_code=status.HTTP_404_NOT_FOUND)

class SchemeNotFoundException(VayoSetuException):
    def __init__(self, scheme_id: str):
        super().__init__(detail=f"Scheme '{scheme_id}' not found.", status_code=status.HTTP_404_NOT_FOUND)

class EscalationNotFoundException(VayoSetuException):
    def __init__(self, escalation_id: str):
        super().__init__(detail=f"Escalation ticket '{escalation_id}' not found.", status_code=status.HTTP_404_NOT_FOUND)
