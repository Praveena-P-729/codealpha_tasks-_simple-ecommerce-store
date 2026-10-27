const express = require('express');
const cors = require('cors');
const path = require('path');

const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${now}] ${req.method} ${req.url}`);
  next();
});

// Mount API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'simple-ecommerce-store API'
  });
});

// Serve Frontend Static Files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Fallback for HTML5 pages
app.get('/product', (req, res) => {
  res.sendFile(path.join(frontendPath, 'product.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(frontendPath, 'checkout.html'));
});

app.get('/track-order', (req, res) => {
  res.sendFile(path.join(frontendPath, 'track-order.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// General Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🛒 Simple E-Commerce Store Backend is LIVE!`);
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`📦 API Endpoints:     http://localhost:${PORT}/api/products`);
  console.log(`🛍️ Storefront URL:    http://localhost:${PORT}`);
  console.log(`===============================================`);
});

module.exports = app;
