const express = require('express');
const router = express.Router();
const db = require('../data/db');

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const user = db.getUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please try again.'
      });
    }

    // Generate safe user object (omit password)
    const { password: _, ...safeUser } = user;
    const token = `aura_tok_${Buffer.from(`${user.id}:${Date.now()}`).toString('base64')}`;

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        user: safeUser,
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { name, email, password, phone, address, city, state, zip } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const newUser = db.createUser({
      name,
      email,
      password,
      phone,
      address,
      city,
      state,
      zip
    });

    const token = `aura_tok_${Buffer.from(`${newUser.id}:${Date.now()}`).toString('base64')}`;

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: {
        user: newUser,
        token
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create account.'
    });
  }
});

// GET /api/auth/demo - Quick demo credentials helper
router.get('/demo', (req, res) => {
  res.json({
    success: true,
    data: {
      email: 'demo@aurastore.com',
      password: 'password123',
      name: 'Alex Mercer'
    }
  });
});

module.exports = router;
