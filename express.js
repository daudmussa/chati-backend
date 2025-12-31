import dotenv from "dotenv";
import twilio from "twilio";
import express from "express";
import bodyParser from "body-parser";

dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER; // should be the Twilio WhatsApp-enabled number, e.g. +14155238886

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  console.warn("Twilio credentials not set in environment. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env");
}

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

app.post("/send-message", async (req, res) => {
  const { message, to } = req.body;
  if (!message || !to) return res.status(400).send({ error: "Missing 'message' or 'to' in request body" });

  try {
    // Ensure numbers use the whatsapp: prefix
    const toNumber = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    const fromNumber = TWILIO_PHONE_NUMBER ? (TWILIO_PHONE_NUMBER.startsWith("whatsapp:") ? TWILIO_PHONE_NUMBER : `whatsapp:${TWILIO_PHONE_NUMBER}`) : null;

    if (!fromNumber) {
      return res.status(500).send({ error: "TWILIO_PHONE_NUMBER not configured in environment (must be WhatsApp-enabled)" });
    }

    console.log(`Sending message from ${fromNumber} to ${toNumber}`);

    const response = await client.messages.create({
      body: message,
      from: fromNumber,
      to: toNumber,
    });

    res.send(response);
  } catch (err) {
    console.error("Twilio send error:", err);
    // Include helpful debug fields when available
    const errBody = { message: err.message };
    if (err.code) errBody.code = err.code;
    if (err.status) errBody.status = err.status;
    if (err.moreInfo) errBody.moreInfo = err.moreInfo;
    res.status(500).send(errBody);
  }
});

app.listen(3001, () => console.log("Server running on port 3001"));
