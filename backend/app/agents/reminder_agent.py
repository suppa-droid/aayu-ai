from typing import Dict, Any
from app.models.enums import NotificationChannel

class ReminderAgent:
    def format_reminder(
        self,
        citizen_name: str,
        scheme_name: str,
        trigger_type: str,
        channel: NotificationChannel = NotificationChannel.WHATSAPP
    ) -> str:
        if channel == NotificationChannel.WHATSAPP:
            return (
                f"Namaste! 🙏 This is a message for {citizen_name}'s family from Aayu AI.\n"
                f"We noticed that {citizen_name} may be eligible for {scheme_name} ({trigger_type}).\n"
                f"Please assist them or reply to this WhatsApp message for assistance."
            )
        else:
            return (
                f"Namaste. Main Aayu AI se bol raha hoon. {citizen_name} ji ke {scheme_name} "
                f"ke aavedan ke liye kripya nikatatam Anganwadi kendra par sampark karein."
            )

reminder_agent = ReminderAgent()
