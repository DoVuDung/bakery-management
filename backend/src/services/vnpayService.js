const crypto = require('crypto');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class VNPayService {
  constructor() {
    this.vnpayUrl = process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay-return';
    this.tmncode = process.env.VNPAY_TMNCODE;
    this.hashSecret = process.env.VNPAY_HASHSECRET;
    this.merchant = process.env.VNPAY_MERCHANT;
  }

  // Create payment URL
  createPaymentUrl(orderData) {
    const {
      orderId,
      amount,
      bankCode = '',
      language = 'vn',
      orderInfo = 'Thanh toán đơn hàng tại Bánh Ngọt Pro',
      orderType = 'other'
    } = orderData;

    const date = new Date();
    const createDate = this.formatDate(date);
    const expireDate = this.formatDate(new Date(date.getTime() + 15 * 60000)); // 15 minutes

    const tmncode = this.tmncode;
    const returnUrl = this.returnUrl;
    const vnpUrl = this.vnpayUrl;

    const data = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmncode,
      vnp_Locale: language,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: orderType,
      vnp_Amount: amount * 100, // Convert to VND (multiply by 100)
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: orderData.ipAddress || '127.0.0.1',
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate
    };

    if (bankCode) {
      data.vnp_BankCode = bankCode;
    }

    // Sort keys alphabetically
    const sortedKeys = Object.keys(data).sort();
    let signData = '';
    for (const key of sortedKeys) {
      signData += `${key}=${encodeURIComponent(data[key])}&`;
    }
    signData = signData.slice(0, -1); // Remove last '&'

    // Add hash secret to sign data
    const secureHash = crypto
      .createHmac('sha512', this.hashSecret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    // Add signature to data
    data.vnp_SecureHash = secureHash;

    // Build query string
    const querystring = Object.keys(data)
      .map(key => `${key}=${encodeURIComponent(data[key])}`)
      .join('&');

    return `${vnpUrl}?${querystring}`;
  }

  // Verify response from VNPay
  verifyReturnUrl(queryParams) {
    const vnp_Params = {};
    const signData = [];
    
    for (const key in queryParams) {
      if (key.startsWith('vnp_')) {
        vnp_Params[key] = decodeURIComponent(queryParams[key]);
        if (key !== 'vnp_SecureHash') {
          signData.push(`${key}=${decodeURIComponent(queryParams[key])}`);
        }
      }
    }

    const secureHash = vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHash;

    // Sort keys alphabetically
    const sortedSignData = signData.sort().join('&');

    const verifySignature = crypto
      .createHmac('sha512', this.hashSecret)
      .update(Buffer.from(sortedSignData, 'utf-8'))
      .digest('hex');

    return {
      isValid: verifySignature === secureHash,
      data: vnp_Params
    };
  }

  // Format date for VNPay
  formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    const hour = ('0' + d.getHours()).slice(-2);
    const minute = ('0' + d.getMinutes()).slice(-2);
    const second = ('0' + d.getSeconds()).slice(-2);
    return year + month + day + hour + minute + second;
  }

  // Query payment status
  async queryPaymentStatus(orderId) {
    const date = new Date();
    const tmncode = this.tmncode;
    const merchant = this.merchant;

    const data = {
      vnp_RequestId: Date.now().toString(),
      vnp_Version: '2.1.0',
      vnp_Command: 'querydr',
      vnp_TmnCode: tmncode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Truy vấn trạng thái thanh toán cho đơn hàng ${orderId}`,
      vnp_TransactionDate: this.formatDate(date),
      vnp_CreateDate: this.formatDate(date),
      vnp_IpAddr: '127.0.0.1'
    };

    // Sort keys alphabetically
    const sortedKeys = Object.keys(data).sort();
    let signData = '';
    for (const key of sortedKeys) {
      signData += `${key}=${data[key]}&`;
    }
    signData = signData.slice(0, -1); // Remove last '&'

    // Add hash secret to sign data
    const secureHash = crypto
      .createHmac('sha512', this.hashSecret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    // Add signature to data
    data.vnp_SecureHash = secureHash;

    try {
      const response = await axios.post(
        'https://sandbox.vnpayment.vn/merchant_webapi/api/querydr',
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error querying payment status:', error);
      throw error;
    }
  }
}

module.exports = new VNPayService();