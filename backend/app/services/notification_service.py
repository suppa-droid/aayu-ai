import logging
import requests
from app.models.enums import NotificationChannel

logger = logging.getLogger("vayosetu.notification")

WHATSAPP_SERVICE_URL = "http://localhost:4000"

class NotificationService:
    def send_notification(self, recipient: str, message: str, channel: NotificationChannel, citizen_name: str = "Citizen") -> bool:
        if channel == NotificationChannel.WHATSAPP:
            try:
                # Dispatch to Node.js WhatsApp Microservice
                res = requests.post(
                    f"{WHATSAPP_SERVICE_URL}/api/notify/reminder",
                    json={
                        "citizen_name": citizen_name,
                        "phone_number": recipient,
                        "trigger_type": "CUSTOM",
                        "custom_message": message
                    },
                    timeout=5
                )
                if res.status_code == 200:
                    logger.info(f"[WHATSAPP DISPATCHED] To {recipient}")
                    return True
                logger.error(f"[WHATSAPP FAILED] Error: {res.text}")
                return False
            except Exception as e:
                logger.error(f"[WHATSAPP SERVICE UNREACHABLE] Fallback log - To {recipient}: {message} | Err: {str(e)}")
                return False
        elif channel == NotificationChannel.VOICE_IVR:
            logger.info(f"[SIMULATED VOICE IVR CALL] Dialing {recipient}: Speech Prompt -> '{message}'")
        else:
            logger.info(f"[SIMULATED SMS] To {recipient}: {message}")
        return True


notification_service = NotificationService()
