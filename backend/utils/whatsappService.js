import Twilio from "twilio";

// TODO: move these credentials to environment variables (process.env.TWILIO_SID / TWILIO_AUTH)
const accountSid = 'AC948cb3fa1bb3b3f70a9286489c83cba9';
const authToken = '540c751d6f3d84fe5350f71692dc500c';

// Create the Twilio client
const client = Twilio(accountSid, authToken);

/**
 * Send a WhatsApp message using Twilio.
 * Accepts an object { to, message } so it matches how other modules call it.
 * - to: phone number string (e.g. '+919876543210' or 'whatsapp:+919876543210')
 * - message: text body
 */
async function sendWhatsApp({ to, message }) {
  try {
    // normalize `to` value: allow either 'whatsapp:+123' or '+123'
    let toAddr = to;
    if (!toAddr.startsWith('whatsapp:')) {
      toAddr = `whatsapp:${toAddr}`;
    }

    await client.messages.create({
      from: 'whatsapp:+14155238886', // Twilio sandbox number
      to: toAddr,
      body: message,
    });

    console.log(`WhatsApp sent to ${to}`);
  } catch (error) {
    console.error('WhatsApp send error:', error);
    // rethrow so callers can handle failures
    throw error;
  }
}

export default sendWhatsApp;
