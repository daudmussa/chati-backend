import axios from "axios";

async function testSendWhatsApp() {
  try {
    console.log("[test] Sending WhatsApp message...");
    const response = await axios.post(
      "http://localhost:3000/send-sms",
      {
        to: "whatsapp:+255719958997",
        body: "Test WhatsApp message",
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      }
    );
    console.log("[test] Success!", response.data);
  } catch (error) {
    console.error("[test] Error:", error.message);
    if (error.response) {
      console.error("[test] Response status:", error.response.status);
      console.error("[test] Response data:", error.response.data);
    }
  }
}

testSendWhatsApp();
