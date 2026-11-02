from fastapi import APIRouter, Request, Response

router = APIRouter(prefix="/webhooks", tags=["Webhooks Integration"])

def whatsapp_reply(body_text: str) -> str:
    text = str(body_text or "").strip()
    if text == "1":
        return "Dhanyawad! Your Anganwadi home visit request has been scheduled for tomorrow at 10 AM."
    if text == "2":
        return "Required documents: 1. Aadhaar Card, 2. BPL Card, 3. Age Proof, 4. Bank Passbook."
    return "Welcome to Aayu AI Assistant! Reply '1' to schedule a home visit, or '2' for scheme document checklist."


def _twiml_message(message: str) -> str:
    safe = (
        message.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
    return f"<Response><Message>{safe}</Message></Response>"


@router.post("/whatsapp")
async def whatsapp_webhook(request: Request):
    form_data = await request.form()
    body_text = form_data.get("Body", "")
    reply = whatsapp_reply(str(body_text or ""))
    return Response(content=_twiml_message(reply), media_type="application/xml")

@router.post("/voice")
async def voice_webhook(request: Request):
    """Twilio Voice webhook for senior citizen phone queries."""
    twiml_response = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<Response>'
        '<Say voice="Polly.Aditi">'
        'Namaste. Aayu AI mein aapka swagat hai.'
        '</Say>'
        '</Response>'
    )
    return Response(content=twiml_response, media_type="application/xml")
