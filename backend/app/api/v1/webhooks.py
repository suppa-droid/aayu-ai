from fastapi import APIRouter, Request, Response

router = APIRouter(prefix="/webhooks", tags=["Webhooks Integration"])

@router.post("/whatsapp")
async def whatsapp_webhook(request: Request):
    form_data = await request.form()
    from_num = form_data.get("From", "")
    body_text = form_data.get("Body", "")

    # Simulated WhatsApp conversational response
    if "1" in body_text:
        reply = "Dhanyawad! Your Anganwadi home visit request has been scheduled for tomorrow at 10 AM."
    elif "2" in body_text:
        reply = "Required documents: 1. Aadhaar Card, 2. BPL Card, 3. Age Proof, 4. Bank Passbook."
    else:
        reply = "Welcome to Aayu AI Assistant! Reply '1' to schedule a home visit, or '2' for scheme document checklist."
        return Response(content=f"<Response><Message>{reply}</Message></Response>", media_type="application/xml")
    
    return Response(content="<Response></Response>", media_type="application/xml")

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
