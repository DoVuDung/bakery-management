require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Import security middleware
const {
  securityHeaders,
  sessionSecurity,
  loginLimiter,
  sensitiveEndpointsLimiter,
  scanLimiter
} = require('./middleware/security/sessionSecurity');

// Import additional security configuration
const { rateLimiters, securityMiddleware, addSecurityHeaders } = require('./config/security');

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
app.use(securityMiddleware.compression);
app.use(securityMiddleware.helmet);
app.use(securityMiddleware.cors);
app.use(addSecurityHeaders);
app.use(securityHeaders);
app.use(sessionSecurity);

// Apply rate limiting for different routes
app.use('/api/auth', rateLimiters.auth);
app.use('/api/products', rateLimiters.api);
app.use('/api/orders', rateLimiters.api);
app.use('/api/payments', rateLimiters.api);
app.use('/api/shipping', rateLimiters.api);
app.use('/api/vouchers', rateLimiters.api);
app.use('/api/users', rateLimiters.api);
app.use('/api/inventory', rateLimiters.api);

// General API rate limiting
app.use(rateLimiters.api);

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
app.use(cookieParser());

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