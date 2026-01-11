const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const otpGenerator = require('otp-generator');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class MFAService {
  constructor() {
    this.otpExpiryMinutes = 10; // OTP expires in 10 minutes
  }

  // Generate TOTP secret for authenticator app
  generateTOTPSecret(userEmail) {
    const secret = speakeasy.generateSecret({
      name: `Bánh Ngọt Pro (${userEmail})`,
      issuer: 'Bánh Ngọt Pro',
      length: 32
    });

    return {
      secret: secret.base32,
      qrCode: null, // Will generate QR code separately if needed
      url: secret.otpauth_url
    };
  }

  // Generate QR code for authenticator app setup
  async generateQRCode(secret) {
    const url = speakeasy.otpauthURL({
      secret: secret,
      issuer: 'Bánh Ngọt Pro',
      label: 'Bánh Ngọt Pro User'
    });

    const qrCode = await QRCode.toDataURL(url);
    return qrCode;
  }

  // Verify TOTP code
  verifyTOTP(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 steps before/after for clock drift
    });
  }

  // Generate SMS/OTP code
  generateOTP() {
    // Generate 6-digit numeric OTP
    return otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false
    });
  }

  // Store OTP in database with expiry
  async storeOTP(userId, otp, channel = 'SMS') {
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + this.otpExpiryMinutes);

    await prisma.oTP.create({
      data: {
        userId: userId,
        otp: otp,
        channel: channel,
        expiresAt: expiryTime,
        used: false
      }
    });
  }

  // Verify OTP
  async verifyOTP(userId, otp) {
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        userId: userId,
        otp: otp,
        used: false,
        expiresAt: {
          gte: new Date() // Not expired
        }
      }
    });

    if (!otpRecord) {
      return false;
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { used: true }
    });

    return true;
  }

  // Send OTP via SMS (using a Vietnamese SMS service like S2S, OneSignal, etc.)
  async sendOTP(phoneNumber, otp) {
    // In a real implementation, you would integrate with a Vietnamese SMS service
    // For example: S2S Vietnam, OneSignal, or local providers
    console.log(`Sending OTP ${otp} to ${phoneNumber}`);
    
    // This is where you'd call the SMS service API
    // Example with a fictional Vietnamese SMS service:
    /*
    try {
      const response = await axios.post('https://api.vietnamese-sms-service.com/send', {
        phone: phoneNumber,
        message: `Mã xác thực Bánh Ngọt Pro: ${otp}. Mã có hiệu lực trong 10 phút.`
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.VIETNAMESE_SMS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
    */
    
    // For demo purposes, we'll just log it
    return { success: true, message: 'OTP sent successfully' };
  }

  // Send OTP via Zalo (using Zalo OA API)
  async sendOTPViaZalo(userId, otp) {
    // In a real implementation, you would integrate with Zalo OA API
    console.log(`Sending OTP ${otp} to user ${userId} via Zalo`);
    
    // This is where you'd call the Zalo OA API
    // For demo purposes, we'll just log it
    return { success: true, message: 'OTP sent via Zalo successfully' };
  }

  // Enable MFA for user
  async enableMFA(userId, method = 'TOTP') {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    let mfaConfig = {};
    
    if (method === 'TOTP') {
      const secret = this.generateTOTPSecret(user.email || user.phoneNumber);
      mfaConfig = {
        method: 'TOTP',
        secret: secret.secret,
        enabled: true
      };
    } else if (method === 'SMS') {
      mfaConfig = {
        method: 'SMS',
        enabled: true
      };
    } else if (method === 'ZALO') {
      mfaConfig = {
        method: 'ZALO',
        enabled: true
      };
    } else {
      throw new Error('Invalid MFA method');
    }

    // Update user's MFA settings
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaMethod: method,
        mfaSecret: mfaConfig.secret || null
      }
    });

    return mfaConfig;
  }

  // Disable MFA for user
  async disableMFA(userId) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaMethod: null,
        mfaSecret: null
      }
    });
  }

  // Verify MFA for user
  async verifyMFA(userId, token, method = null) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.mfaEnabled) {
      throw new Error('MFA not enabled for this user');
    }

    const verificationMethod = method || user.mfaMethod;

    switch (verificationMethod) {
      case 'TOTP':
        if (!user.mfaSecret) {
          throw new Error('MFA secret not found');
        }
        return this.verifyTOTP(user.mfaSecret, token);
      
      case 'SMS':
        return await this.verifyOTP(userId, token);
      
      case 'ZALO':
        return await this.verifyOTP(userId, token);
      
      default:
        throw new Error('Unsupported MFA method');
    }
  }

  // Generate backup codes for user
  async generateBackupCodes(userId, count = 10) {
    const backupCodes = [];
    
    for (let i = 0; i < count; i++) {
      backupCodes.push(otpGenerator.generate(8, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false
      }));
    }

    // Store backup codes in database
    for (const code of backupCodes) {
      await prisma.backupCode.create({
        data: {
          userId: userId,
          code: code,
          used: false
        }
      });
    }

    return backupCodes;
  }

  // Verify backup code
  async verifyBackupCode(userId, code) {
    const backupCode = await prisma.backupCode.findFirst({
      where: {
        userId: userId,
        code: code,
        used: false
      }
    });

    if (!backupCode) {
      return false;
    }

    // Mark backup code as used
    await prisma.backupCode.update({
      where: { id: backupCode.id },
      data: { used: true }
    });

    return true;
  }
}

module.exports = new MFAService();