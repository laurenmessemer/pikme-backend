const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');

const router = express.Router();

router.post('/', express.json(), (req, res) => {
  const payload = JSON.stringify(req.body);
  const sig = req.headers['x-hub-signature-256'];
  const secret = process.env.WEBHOOK_SECRET;

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  if (sig !== digest) {
    console.log('❌ Signature mismatch');
    return res.status(401).send('Unauthorized');
  }

  console.log('✅ Webhook verified. Deploying...');

  exec(
    'cd ~/pikme-backend && git pull && pm2 restart all',
    (err, stdout, stderr) => {
      if (err) {
        console.error('❌ Deployment error:', err);
        return res.status(500).send('Deployment failed');
      }
      console.log('🚀 Deployed:\n', stdout);
      res.status(200).send('Deployment successful');
    }
  );
});

module.exports = router;
