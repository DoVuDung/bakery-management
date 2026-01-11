require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import security middleware
const {
  securityHeaders,
  sessionSecurity,
  loginLimiter,
  sensitiveEndpointsLimiter,
  scanLimiter
} = require('./middleware/security/sessionSecurity');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const inventoryRoutes = require('./routes/inventory');
const voucherRoutes = require('./routes/vouchers');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(securityHeaders);
app.use(sessionSecurity);

// Global rate limiting
const globalLimiter = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'GLOBAL_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// CORS configuration for Vietnamese market
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://banh-ngot-pro.vercel.app', // Production frontend
    'https://*.vercel.app', // Allow all vercel subdomains
    process.env.FRONTEND_URL
  ],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply specific rate limiting to sensitive endpoints
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', loginLimiter);
app.use('/api/auth/send-otp', loginLimiter);
app.use('/api/auth/verify-mfa', loginLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/vouchers', voucherRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Bánh Ngọt Pro Backend API'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Bánh Ngọt Pro server is running on port ${PORT}`);
});

module.exports = app;