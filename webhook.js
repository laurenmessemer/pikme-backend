// webhook.js
const express = require("express");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.use(express.json({ type: "*/*" }));

const PORT = 4000;

app.post("/webhook", (req, res) => {
  const githubSignature = req.headers["x-hub-signature-256"];
  const hmac = crypto.createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET);
  const digest = `sha256=${hmac.update(JSON.stringify(req.body)).digest("hex")}`;

  if (githubSignature !== digest) {
    console.log("❌ Webhook signature mismatch");
    return res.status(401).send("Unauthorized");
  }

  console.log("✅ Webhook received!");
  // Auto-pull and restart backend:
  const { exec } = require("child_process");
  exec("cd ~/pikme-backend && git pull && pm2 restart backend", (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Deployment error:", err);
      return res.status(500).send("Deployment error");
    }
    console.log("🚀 Deployment success:", stdout);
    res.status(200).send("Webhook processed");
  });
});

app.listen(PORT, () => {
  console.log(`🔗 Webhook server running on http://localhost:${PORT}`);
});
