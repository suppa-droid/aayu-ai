from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="VayoSetu Screen-Free Voice Service")

class VoiceCallTrigger(BaseModel):
    citizen_name: str
    phone_number: str
    language_dialect: str = "hindi"
    scheme_name: str

@app.post("/trigger-voice-call")
def trigger_voice_call(trigger: VoiceCallTrigger):
    prompt = (
        f"Namaste {trigger.citizen_name} ji! Main VayoSetu voice assistant bol raha hoon. "
        f"Aapke {trigger.scheme_name} pension ke document verification ka samay aa gaya hai. "
        f"Aapne aane wale mangalwar ko Anganwadi kender aana hai ya ghar par worker mangwana hai?"
    )
    return {
        "status": "DIALED",
        "recipient": trigger.phone_number,
        "spoken_prompt": prompt,
        "dialect": trigger.language_dialect
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
