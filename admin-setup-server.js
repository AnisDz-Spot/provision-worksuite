const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());

// Simple secret for protection (replace with a better auth in production)
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'changeme';

app.post('/api/admin/setup-db', (req, res) => {
  const { databaseUrl, secret } = req.body;
  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  if (!databaseUrl) {
    return res.status(400).json({ success: false, error: 'Missing databaseUrl' });
  }
  // Run the prisma-push script
  exec(`node scripts/prisma-push.js "${databaseUrl}"`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ success: false, error: stderr || error.message });
    }
    res.json({ success: true, output: stdout });
  });
});

app.listen(PORT, () => {
  console.log(`Admin setup server running on port ${PORT}`);
});
