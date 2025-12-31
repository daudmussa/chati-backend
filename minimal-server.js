import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";

console.log("[startup] Loading env...");
dotenv.config();
console.log("[startup] Env loaded, initializing app...");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

app.post("/webhook", async (req, res) => {
  const incomingMsg = req.body.Body || req.body.body || "test";
  console.log("Message:", incomingMsg);
  
  try {
    const claudeResponse = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-haiku-20240307",
        max_tokens: 200,
        messages: [{ role: "user", content: incomingMsg }]
      },
      {
        headers: {
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        }
      }
    );

    const aiReply = claudeResponse.data?.content?.[0]?.text || "No reply";
    res.type("text/xml");
    res.send(`<Response><Message><![CDATA[${aiReply}]]></Message></Response>`);
  } catch (err) {
    console.error("Error:", err.message);
    res.type("text/xml");
    res.send(`<Response><Message>Error occurred</Message></Response>`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
