const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const otpGenerator = require('otp-generator');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const mfaService = require('./security/mfaService');
const auditService = require('./security/auditService');
const encryption = require('../utils/security/encryption');

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' }); // Short-lived token for security
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

// Generate secure session ID
const generateSessionId = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash sensitive data
const hashData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Encrypt sensitive data
const encryptSensitiveData = (data) => {
  return encryption.encrypt(data);
};

// Decrypt sensitive data
const decryptSensitiveData = (encryptedData) => {
  return encryption.decrypt(encryptedData);
};

// Validate Vietnamese phone number with encryption
const validateAndEncryptPhone = (phone) => {
  if (!isValidVietnamesePhoneNumber(phone)) {
    throw new Error('Invalid Vietnamese phone number format');
  }
  
  // Encrypt the phone number for storage
  return encryptSensitiveData(phone);
};

// Mask phone number for display
const maskPhoneForDisplay = (phone) => {
  return encryption.maskSensitiveData(phone, 'phone');
};

// Validate password strength
const validatePasswordStrength = (password) => {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  // Check for at least one uppercase, lowercase, number, and special character
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
    throw new Error('Password must contain at least one uppercase letter, lowercase letter, number, and special character');
  }
  
  return true;
};

// Validate phone number format for Vietnam
const isValidVietnamesePhoneNumber = (phone) => {
  // Vietnamese phone number format: 0[3|5|7|8|9]XXXXXXXX or +84[3|5|7|8|9]XXXXXXXX
  const vietnamPhoneRegex = /^(0|\+84)(3[2-9]|5[2689]|7[0|6-9]|8[1-9]|9[0-9])\d{7}$/;
  return vietnamPhoneRegex.test(phone);
};

// Register user with phone number
const registerUser = async (userData, req = null) => {
  const { phoneNumber, email, fullName, password } = userData;

  // Validate phone number format
  if (!isValidVietnamesePhoneNumber(phoneNumber)) {
    throw new Error('Invalid Vietnamese phone number format');
  }

  // Validate password strength
  validatePasswordStrength(password);

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phoneNumber: encryptSensitiveData(phoneNumber) }, // Check against encrypted value
        ...(email ? [{ email }] : [])
      ]
    }
  });

  if (existingUser) {
    throw new Error('User with this phone number or email already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Encrypt sensitive data
  const encryptedPhone = encryptSensitiveData(phoneNumber);

  // Create user
  const user = await prisma.user.create({
    data: {
      phoneNumber: encryptedPhone,
      email: email || null,
      fullName,
      password: hashedPassword,
      role: 'CUSTOMER'
    }
  });

  // Log registration
  await auditService.logAction(
    user.id, 
    'USER_REGISTER', 
    'USER', 
    user.id, 
    null, 
    { phoneNumber: maskPhoneForDisplay(phoneNumber), email }, 
    req
  );

  // Generate tokens
  const token = generateToken({
    user: {
      id: user.id,
      role: user.role
    }
  });

  const refreshToken = generateRefreshToken({
    user: {
      id: user.id,
      role: user.role
    }
  });

  return { user, token, refreshToken };
};

// Login with phone number and password
const loginUser = async (phoneNumber, password, req = null) => {
  // Validate phone number format
  if (!isValidVietnamesePhoneNumber(phoneNumber)) {
    throw new Error('Invalid Vietnamese phone number format');
  }

  // Encrypt phone number to match stored value
  const encryptedPhone = encryptSensitiveData(phoneNumber);

  // Find user by phone number
  const user = await prisma.user.findUnique({
    where: { phoneNumber: encryptedPhone }
  });

  if (!user) {
    // Log failed login attempt
    await auditService.logAction(
      null, 
      'LOGIN_FAILED', 
      'USER', 
      null, 
      null, 
      { phoneNumber: maskPhoneForDisplay(phoneNumber) }, 
      req
    );
    
    throw new Error('Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    // Log failed login attempt
    await auditService.logAction(
      user.id, 
      'LOGIN_FAILED', 
      'USER', 
      user.id, 
      null, 
      { phoneNumber: maskPhoneForDisplay(phoneNumber) }, 
      req
    );
    
    throw new Error('Invalid credentials');
  }

  // Check if MFA is required
  if (user.mfaEnabled) {
    // Generate OTP for MFA
    const otp = mfaService.generateOTP();
    await mfaService.storeOTP(user.id, otp, 'SMS');
    
    // Send OTP to user
    await mfaService.sendOTP(phoneNumber, otp);
    
    return { 
      mfaRequired: true, 
      userId: user.id, 
      message: 'MFA verification required' 
    };
  }

  // Log successful login
  await auditService.logAction(
    user.id, 
    'LOGIN_SUCCESS', 
    'USER', 
    user.id, 
    null, 
    { phoneNumber: maskPhoneForDisplay(phoneNumber) }, 
    req
  );

  // Generate tokens
  const token = generateToken({
    user: {
      id: user.id,
      role: user.role
    }
  });

  const refreshToken = generateRefreshToken({
    user: {
      id: user.id,
      role: user.role
    }
  });

  return { user, token, refreshToken };
};

// Verify MFA
const verifyMFA = async (userId, otp, req = null) => {
  const isValid = await mfaService.verifyOTP(userId, otp);
  
  if (!isValid) {
    // Log failed MFA attempt
    await auditService.logAction(
      userId, 
      'MFA_FAILED', 
      'USER', 
      userId, 
      null, 
      { attempt: otp }, 
      req
    );
    
    throw new Error('Invalid MFA code');
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  // Log successful MFA verification
  await auditService.logAction(
    userId, 
    'MFA_SUCCESS', 
    'USER', 
    userId, 
    null, 
    { method: 'SMS_OTP' }, 
    req
  );

  // Generate tokens
  const token = generateToken({
    user: {
      id: user.id,
      role: user.role
    }
  });

  const refreshToken = generateRefreshToken({
    user: {
      id: user.id,
      role: user.role
    }
  });

  return { user, token, refreshToken };
};

// Login with social account (Zalo/Facebook)
const loginSocial = async (socialData, req = null) => {
  const { socialId, socialType, fullName, email, phoneNumber } = socialData;

  let user;
  let isExistingUser = false;

  // Find user by social ID
  const socialField = socialType === 'zalo' ? 'zaloId' : 'facebookId';
  user = await prisma.user.findUnique({
    where: { [socialField]: socialId }
  });

  if (user) {
    // User exists with this social account
    isExistingUser = true;
  } else if (phoneNumber) {
    // Try to find user by phone number
    const encryptedPhone = encryptSensitiveData(phoneNumber);
    user = await prisma.user.findUnique({
      where: { phoneNumber: encryptedPhone }
    });

    if (user) {
      // Link social account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: { [socialField]: socialId }
      });
      isExistingUser = true;
    }
  } else if (email) {
    // Try to find user by email
    user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      // Link social account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: { [socialField]: socialId }
      });
      isExistingUser = true;
    }
  }

  if (!isExistingUser) {
    // Create new user with social account
    let encryptedPhone = null;
    if (phoneNumber) {
      encryptedPhone = validateAndEncryptPhone(phoneNumber);
    }

    user = await prisma.user.create({
      data: {
        phoneNumber: encryptedPhone,
        email: email || null,
        fullName,
        [socialField]: socialId,
        role: 'CUSTOMER'
      }
    });

    // Log social registration
    await auditService.logAction(
      user.id, 
      'SOCIAL_REGISTER', 
      'USER', 
      user.id, 
      null, 
      { socialType, socialId, email, phoneNumber: phoneNumber ? maskPhoneForDisplay(phoneNumber) : null }, 
      req
    );
  } else {
    // Log social login
    await auditService.logAction(
      user.id, 
      'SOCIAL_LOGIN', 
      'USER', 
      user.id, 
      null, 
      { socialType, socialId }, 
      req
    );
  }

  // Generate token
  const token = generateToken({
    user: {
      id: user.id,
      role: user.role
    }
  });

  const refreshToken = generateRefreshToken({
    user: {
      id: user.id,
      role: user.role
    }
  });

  return { user, token, refreshToken };
};

// Send OTP for phone verification
const sendOTP = async (phoneNumber, req = null) => {
  // Validate phone number format
  if (!isValidVietnamesePhoneNumber(phoneNumber)) {
    throw new Error('Invalid Vietnamese phone number format');
  }

  // Find user by phone number
  const encryptedPhone = encryptSensitiveData(phoneNumber);
  const user = await prisma.user.findUnique({
    where: { phoneNumber: encryptedPhone }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Generate OTP
  const otp = mfaService.generateOTP();
  
  // Store OTP in database
  await mfaService.storeOTP(user.id, otp, 'SMS');

  // Send OTP via SMS
  await mfaService.sendOTP(phoneNumber, otp);

  // Log OTP request
  await auditService.logAction(
    user.id, 
    'OTP_REQUEST', 
    'USER', 
    user.id, 
    null, 
    { phoneNumber: maskPhoneForDisplay(phoneNumber), channel: 'SMS' }, 
    req
  );

  return { message: 'OTP sent successfully' };
};

// Verify OTP
const verifyOTP = async (phoneNumber, otp, req = null) => {
  // Validate phone number format
  if (!isValidVietnamesePhoneNumber(phoneNumber)) {
    throw new Error('Invalid Vietnamese phone number format');
  }

  // Find user by phone number
  const encryptedPhone = encryptSensitiveData(phoneNumber);
  const user = await prisma.user.findUnique({
    where: { phoneNumber: encryptedPhone }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify OTP
  const isValid = await mfaService.verifyOTP(user.id, otp);

  if (!isValid) {
    // Log failed OTP verification
    await auditService.logAction(
      user.id, 
      'OTP_FAILED', 
      'USER', 
      user.id, 
      null, 
      { phoneNumber: maskPhoneForDisplay(phoneNumber), attempt: otp }, 
      req
    );
    
    throw new Error('Invalid or expired OTP');
  }

  // Log successful OTP verification
  await auditService.logAction(
    user.id, 
    'OTP_SUCCESS', 
    'USER', 
    user.id, 
    null, 
    { phoneNumber: maskPhoneForDisplay(phoneNumber) }, 
    req
  );

  return { message: 'OTP verified successfully', userId: user.id };
};

// Update user profile
const updateUserProfile = async (userId, profileData, req = null) => {
  const { fullName, email, phoneNumber } = profileData;

  // Validate phone number if provided
  if (phoneNumber && !isValidVietnamesePhoneNumber(phoneNumber)) {
    throw new Error('Invalid Vietnamese phone number format');
  }

  // Prepare update data
  const updateData = {};
  if (fullName) updateData.fullName = fullName;
  if (email) updateData.email = email;
  if (phoneNumber) {
    // Encrypt phone number
    updateData.phoneNumber = encryptSensitiveData(phoneNumber);
  }

  // Get old values for audit
  const oldUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData
  });

  // Log profile update
  await auditService.logAction(
    userId, 
    'PROFILE_UPDATE', 
    'USER', 
    userId, 
    { fullName: oldUser.fullName, email: oldUser.email, phoneNumber: oldUser.phoneNumber ? maskPhoneForDisplay(decryptSensitiveData(oldUser.phoneNumber)) : null }, 
    { fullName: updatedUser.fullName, email: updatedUser.email, phoneNumber: phoneNumber ? maskPhoneForDisplay(phoneNumber) : null }, 
    req
  );

  return updatedUser;
};

// Enable MFA for user
const enableMFA = async (userId, method, req = null) => {
  // Enable MFA
  await mfaService.enableMFA(userId, method);

  // Get updated user
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  // Log MFA enablement
  await auditService.logAction(
    userId, 
    'MFA_ENABLED', 
    'USER', 
    userId, 
    null, 
    { method }, 
    req
  );

  return { message: 'MFA enabled successfully', method };
};

// Disable MFA for user
const disableMFA = async (userId, req = null) => {
  // Disable MFA
  await mfaService.disableMFA(userId);

  // Log MFA disablement
  await auditService.logAction(
    userId, 
    'MFA_DISABLED', 
    'USER', 
    userId, 
    null, 
    null, 
    req
  );

  return { message: 'MFA disabled successfully' };
};

module.exports = {
  registerUser,
  loginUser,
  verifyMFA,
  loginSocial,
  sendOTP,
  verifyOTP,
  updateUserProfile,
  enableMFA,
  disableMFA,
  isValidVietnamesePhoneNumber,
  generateToken,
  generateRefreshToken,
  validatePasswordStrength,
  maskPhoneForDisplay,
  encryptSensitiveData,
  decryptSensitiveData
};