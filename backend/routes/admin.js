const express = require('express');
const router = express.Router();

// Admin authentication endpoint
router.post('/authenticate', (req, res) => {
  const { password } = req.body;
  
  // Simple password-based authentication
  // In production, you should use proper authentication with JWT, bcrypt, etc.
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cricket123';
  
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Authentication successful' });
  } else {
    res.status(401).json({ error: 'Invalid admin password' });
  }
});

module.exports = router;
