const express = require("express");
const crypto = require("crypto");
require("dotenv").config();

const router = express.Router(); // ←✅ Use router instead of app

router.use(express.json({ type: "*/*" }));

router.post("/", (req, res) => {
  const hmac = crypto.createHmac("sha256", process.env.WEBHOOK_SECRET);
  const digest = `sha256=${hmac.update(JSON.stringify(req.body)).digest("hex")}`;
  const githubSignature = req.headers["x-hub-signature-256"];

  if (githubSignature !== digest) {
    console.log("❌ Webhook signature mismatch");
    return res.status(401).send("Unauthorized");
  }

  console.log("✅ Webhook received!");

  const { exec } = require("child_process");
  exec("cd ~/pikme-backend && git pull && pm2 restart pikme-backend", (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Deployment error:", err);
      return res.status(500).send("Deployment error");
    }
    console.log("🚀 Deployment success:", stdout);
    res.status(200).send("Webhook processed");
  });
});

module.exports = router; // ✅ Export the router
