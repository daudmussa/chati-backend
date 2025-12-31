import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/webhook", (req, res) => {
  console.log("Webhook received!");
  res.type("text/xml");
  res.send("<Response><Message>Test response</Message></Response>");
});

const PORT = 3000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`[SUCCESS] Server listening on ${PORT}`);
});

server.on("error", (err) => {
  console.error("[ERROR] Server error:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT] Exception:", err);
  process.exit(1);
});
