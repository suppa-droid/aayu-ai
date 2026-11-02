const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.WHATSAPP_SERVICE_PORT || 4000;

// Twilio Config
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Sandbox number

const hasTwilioKeys = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN;
let client = null;

if (hasTwilioKeys) {
  try {
    const twilio = require('twilio');
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio Client Initialized in LIVE Mode.');
  } catch (err) {
    console.error('Failed to initialize Twilio client:', err.message);
  }
} else {
  console.log('⚠️ Twilio keys missing. Starting in SIMULATION Mode.');
}

/**
 * Dispatches a WhatsApp message using Twilio or simulates it in the console.
 */
async function sendWhatsAppMessage(to, message) {
  const targetNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  
  if (client) {
    try {
      const response = await client.messages.create({
        body: message,
        from: TWILIO_WHATSAPP_NUMBER,
        to: targetNumber
      });
      console.log(`[LIVE] Sent WhatsApp to ${targetNumber} - SID: ${response.sid}`);
    } catch (err) {
      console.error(`[LIVE] Failed to send to ${targetNumber}:`, err.message);
    }
  } else {
    // Simulation Mode Formatting
    console.log('\n' + '='.repeat(60));
    console.log(`🟢 [SIMULATION] WHATSAPP MESSAGE DISPATCHED`);
    console.log(`📱 To: ${targetNumber}`);
    console.log(`⏱  Time: ${new Date().toLocaleString()}`);
    console.log('-'.repeat(60));
    console.log(message);
    console.log('='.repeat(60) + '\n');
  }
}

// --------------------------------------------------------------------------
// Endpoints for FastAPI Backend Interop
// --------------------------------------------------------------------------

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'VayoSetu WhatsApp Service', mode: client ? 'LIVE' : 'SIMULATION' });
});

/**
 * Trigger: Application Status Updates (Approved, Escalated, Rejected)
 */
app.post('/api/notify/application-status', async (req, res) => {
  const { citizen_name, phone_number, application_id, scheme_name, status, remarks } = req.body;
  
  if (!phone_number) {
    return res.status(400).json({ error: 'phone_number is required' });
  }

  const icon = status === 'APPROVED' ? '✅' : status === 'ESCALATED' ? '⚠️' : '❌';
  
  let msg = `*VayoSetu Update* 👵👴\n\nHello proxy for *${citizen_name}*,\n\nThe application for *${scheme_name}* (ID: ${application_id}) has a new status:\n\n${icon} *Status:* ${status}\n`;
  
  if (remarks) {
    msg += `\n💬 *Remarks:* ${remarks}\n`;
  }
  
  msg += `\nPlease contact your local Anganwadi worker for more details.`;

  await sendWhatsAppMessage(phone_number, msg);
  res.json({ success: true, message: 'Status notification dispatched.' });
});

/**
 * Trigger: Proactive Reminders (Life Certificate, Age Milestones)
 */
app.post('/api/notify/reminder', async (req, res) => {
  const { citizen_name, phone_number, trigger_type, scheduled_for, custom_message } = req.body;
  
  if (!phone_number) {
    return res.status(400).json({ error: 'phone_number is required' });
  }

  let msg = `*VayoSetu Reminder* ⏰\n\nHello proxy for *${citizen_name}*,\n\n`;
  
  if (trigger_type === 'LIFE_CERTIFICATE_RENEWAL') {
    msg += `It is time to submit the annual *Jeevan Pramaan (Life Certificate)* to continue receiving your pension.\n\n📅 *Due Date:* ${scheduled_for}\n`;
  } else if (trigger_type === 'AGE_MILESTONE_70') {
    msg += `🎉 *Happy 70th Birthday!* 🎉\n\nYou are now eligible for the *AB-PMJAY Senior Citizen Universal Healthcare* scheme (₹5 Lakh coverage).\n`;
  }
  
  if (custom_message) {
    msg += `\n${custom_message}\n`;
  }
  
  await sendWhatsAppMessage(phone_number, msg);
  res.json({ success: true, message: 'Reminder notification dispatched.' });
});

/**
 * Trigger: Action Required (Explainability Gap)
 */
app.post('/api/notify/action-required', async (req, res) => {
  const { citizen_name, phone_number, scheme_name, action_item } = req.body;
  
  if (!phone_number) {
    return res.status(400).json({ error: 'phone_number is required' });
  }

  const msg = `*VayoSetu Action Required* ⚡\n\nHello proxy for *${citizen_name}*,\n\nTo become eligible for *${scheme_name}*, the following action is needed:\n\n👉 *${action_item}*\n\nOnce completed, notify your Anganwadi worker.`;

  await sendWhatsAppMessage(phone_number, msg);
  res.json({ success: true, message: 'Action required notification dispatched.' });
});

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Original Webhook for inbound messages (Twilio Sandbox)
app.post('/webhook/whatsapp', (req, res) => {
  const bodyText = String(req.body.Body || '').trim();
  let reply = 'Welcome to VayoSetu Senior Welfare Assistant! 👴👵\n\nOptions:\n1. Check Pension Application Status\n2. Schedule Anganwadi Home Visit\n3. View Eligible Schemes for Senior Relatives';
  
  if (bodyText === '1') {
    reply = '📌 Application #APP-9821 for IGNOAPS Pension is currently under Level 2 District Verification. Approval expected within 3 days.';
  } else if (bodyText === '2') {
    reply = '✅ Anganwadi Worker Sunita Devi has been scheduled for a home visit on Saturday at 10:30 AM.';
  } else if (bodyText === '3') {
    reply = '✨ Unlocked Schemes for Ramesh Kumar (Age 68):\n1. IGNOAPS Pension (Rs. 500/mo)\n2. Rashtriya Vayoshri (Free Spectacles/Assistive Devices)';
  }

  res.type('text/xml');
  res.send(`<Response><Message>${escapeXml(reply)}</Message></Response>`);
});

app.listen(PORT, () => {
  console.log(`WhatsApp Microservice running on port ${PORT}`);
});
