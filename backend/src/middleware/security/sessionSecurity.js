const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');

// Rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many login attempts, please try again later.',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// QR/Barcode scan rate limiter
const scanLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    error: 'Too many scan requests, please slow down.',
    code: 'SCAN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://*.vnpayment.vn", "https://*.momo.vn", "https://*.zalopay.vn"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: {
    policy: 'no-referrer'
  },
  noSniff: true,
  xssFilter: true,
  frameguard: {
    action: 'deny'
  }
});

// Session security middleware
const sessionSecurity = (req, res, next) => {
  // Set secure headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  
  // Ensure HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Strip potential malicious headers to prevent token injection
  delete req.headers['x-middleware-subrequest'];
  
  // Additional security check for suspicious headers
  if (req.headers['x-middleware-subrequest']) {
    return res.status(400).json({
      error: 'Invalid request header - potential security threat',
      code: 'SECURITY_HEADER_VIOLATION'
    });
  }
  
  next();
};

// Generate secure session token
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Validate session token
const validateSessionToken = (token) => {
  if (!token || typeof token !== 'string' || token.length !== 64) {
    return false;
  }
  
  // Additional validation could include checking against stored tokens in database
  return /^[0-9a-f]{64}$/i.test(token);
};

module.exports = {
  sensitiveEndpointsLimiter,
  loginLimiter,
  scanLimiter,
  securityHeaders,
  sessionSecurity,
  generateSecureToken,
  validateSessionToken
};