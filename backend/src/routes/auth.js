const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validate, userRegistrationSchema, userLoginSchema, mfaVerificationSchema } = require('../utils/validators');
const { registerUser, loginUser, verifyMFA, loginSocial, sendOTP, verifyOTP, isValidVietnamesePhoneNumber } = require('../services/authService');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    // Validate input
    const validation = validate(userRegistrationSchema, req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validation.errors
      });
    }

    const { phoneNumber, email, fullName, password } = req.body;

    // Register user
    const result = await registerUser(req.body, req);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    // Validate input
    const validation = validate(userLoginSchema, req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validation.errors
      });
    }

    const { phoneNumber, password } = req.body;

    // Login user
    const result = await loginUser(phoneNumber, password, req);
    
    // If MFA is required, return MFA challenge
    if (result.mfaRequired) {
      return res.json({
        mfaRequired: true,
        userId: result.userId,
        message: result.message
      });
    }
    
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

// @route   POST api/auth/social-login
// @desc    Social login (Zalo/Facebook)
// @access  Public
router.post('/social-login', async (req, res) => {
  try {
    const { socialId, socialType, fullName, email, phoneNumber } = req.body;

    // Validation
    if (!socialId || !socialType || !fullName) {
      return res.status(400).json({ msg: 'Missing required fields for social login' });
    }

    if (socialType !== 'zalo' && socialType !== 'facebook') {
      return res.status(400).json({ msg: 'Invalid social type. Only zalo and facebook are supported' });
    }

    if (phoneNumber && !isValidVietnamesePhoneNumber(phoneNumber)) {
      return res.status(400).json({ msg: 'Invalid Vietnamese phone number format' });
    }

    // Social login
    const result = await loginSocial(req.body);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/verify-mfa
// @desc    Verify MFA code
// @access  Public
router.post('/verify-mfa', async (req, res) => {
  try {
    // Validate input
    const validation = validate(mfaVerificationSchema, req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validation.errors
      });
    }

    const { userId, otp } = req.body;

    // Verify MFA
    const result = await verifyMFA(userId, otp, req);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      error: 'MFA verification failed',
      code: 'MFA_ERROR'
    });
  }
});

// @route   POST api/auth/send-otp
// @desc    Send OTP for phone verification
// @access  Public
router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Validation
    if (!phoneNumber) {
      return res.status(400).json({ 
        error: 'Phone number is required',
        code: 'MISSING_PHONE'
      });
    }

    if (!isValidVietnamesePhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        error: 'Invalid Vietnamese phone number format',
        code: 'INVALID_PHONE'
      });
    }

    // Send OTP
    const result = await sendOTP(phoneNumber, req);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      error: 'OTP sending failed',
      code: 'OTP_ERROR'
    });
  }
});

// @route   POST api/auth/verify-otp
// @desc    Verify OTP
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    // Validation
    if (!phoneNumber || !otp) {
      return res.status(400).json({ msg: 'Phone number and OTP are required' });
    }

    if (!isValidVietnamesePhoneNumber(phoneNumber)) {
      return res.status(400).json({ msg: 'Invalid Vietnamese phone number format' });
    }

    if (otp.length !== 6 || isNaN(otp)) {
      return res.status(400).json({ msg: 'Invalid OTP format' });
    }

    // Verify OTP
    const isValid = await verifyOTP(phoneNumber, otp);
    if (isValid) {
      res.json({ msg: 'OTP verified successfully' });
    } else {
      res.status(400).json({ msg: 'Invalid or expired OTP' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        phoneNumber: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { fullName, email, phoneNumber } = req.body;

    // Validation
    if (fullName && fullName.length > 100) {
      return res.status(400).json({ msg: 'Full name is too long' });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ msg: 'Invalid email format' });
    }

    if (phoneNumber && !isValidVietnamesePhoneNumber(phoneNumber)) {
      return res.status(400).json({ msg: 'Invalid Vietnamese phone number format' });
    }

    // Update profile
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName: fullName || undefined,
        email: email || undefined,
        phoneNumber: phoneNumber || undefined
      },
      select: {
        id: true,
        phoneNumber: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;