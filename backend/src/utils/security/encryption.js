const crypto = require('crypto');

// AES-256 encryption utilities for PII data
class DataEncryption {
  constructor() {
    // In production, this should come from environment variables
    this.algorithm = 'aes-256-gcm';
    this.key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32); // 32 bytes for AES-256
    if (typeof this.key === 'string') {
      this.key = Buffer.from(this.key, 'hex');
    }
  }

  // Encrypt data
  encrypt(plaintext) {
    try {
      const iv = crypto.randomBytes(16); // 16 bytes for AES
      const cipher = crypto.createCipher(this.algorithm, this.key);
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Return IV + AuthTag + EncryptedData
      return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data
  decrypt(encryptedData) {
    try {
      const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':');
      
      if (!ivHex || !authTagHex || !encryptedHex) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipher(this.algorithm, this.key);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Encrypt phone number
  encryptPhone(phone) {
    return this.encrypt(phone);
  }

  // Decrypt phone number
  decryptPhone(encryptedPhone) {
    return this.decrypt(encryptedPhone);
  }

  // Encrypt address
  encryptAddress(address) {
    return this.encrypt(address);
  }

  // Decrypt address
  decryptAddress(encryptedAddress) {
    return this.decrypt(encryptedAddress);
  }

  // Encrypt ID number (CCCD/Passport)
  encryptIdNumber(idNumber) {
    return this.encrypt(idNumber);
  }

  // Decrypt ID number
  decryptIdNumber(encryptedIdNumber) {
    return this.decrypt(encryptedIdNumber);
  }

  // Mask sensitive data for display (without decrypting)
  maskSensitiveData(data, dataType = 'phone') {
    if (!data) return data;

    switch (dataType) {
      case 'phone':
        // For Vietnamese phone numbers: keep first 4 and last 3 digits
        if (data.length >= 10) {
          return data.substring(0, 4) + '*'.repeat(data.length - 7) + data.substring(data.length - 3);
        }
        return data.replace(/.(?=.{3})/g, '*');
      
      case 'address':
        // Mask middle part of address
        if (data.length > 20) {
          const firstPart = data.substring(0, 10);
          const lastPart = data.substring(data.length - 10);
          return firstPart + '...' + lastPart;
        }
        return data.replace(/.(?=.{5})/g, '*');
      
      case 'id':
        // For ID numbers: show first 3 and last 2 characters
        if (data.length >= 9) {
          return data.substring(0, 3) + '*'.repeat(data.length - 5) + data.substring(data.length - 2);
        }
        return data.replace(/.(?=.{2})/g, '*');
      
      default:
        return data.replace(/.(?=.{3})/g, '*');
    }
  }
}

module.exports = new DataEncryption();