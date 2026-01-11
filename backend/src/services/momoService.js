const crypto = require('crypto');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class MoMoService {
  constructor() {
    this.partnerCode = process.env.MOMO_PARTNER_CODE;
    this.accessKey = process.env.MOMO_ACCESS_KEY;
    this.secretKey = process.env.MOMO_SECRET_KEY;
    this.redirectUrl = process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/payment/momo-return';
    this.ipnUrl = process.env.MOMO_IPN_URL || 'http://localhost:5000/api/payments/momo-ipn';
    this.requestType = 'captureWallet';
    this.apiEndPoint = process.env.MOMO_API_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
  }

  // Create payment URL
  async createPaymentUrl(orderData) {
    const {
      orderId,
      amount,
      orderInfo = 'Thanh toán đơn hàng tại Bánh Ngọt Pro',
      returnUrl = this.redirectUrl,
      notifyUrl = this.ipnUrl
    } = orderData;

    const requestId = orderId;
    const requestType = this.requestType;
    const extraData = ''; // Pass additional parameters if needed

    // Construct raw signature
    const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${requestType}`;

    // Create signature
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    // Request body
    const requestBody = {
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId: requestId,
      amount: amount.toString(),
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: returnUrl,
      ipnUrl: notifyUrl,
      extraData: extraData,
      requestType: requestType,
      signature: signature,
      lang: 'vi'
    };

    try {
      const response = await axios.post(this.apiEndPoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Mobile Safari/537.36'
        }
      });

      const result = response.data;
      
      if (result.payUrl) {
        return {
          payUrl: result.payUrl,
          qrCodeUrl: result.qrCodeUrl || null,
          deeplink: result.deeplink || null,
          qrCodeBase64: result.qrCodeBase64 || null,
          orderId: result.orderId,
          requestId: result.requestId,
          signature: result.signature,
          message: result.message || 'Payment URL created successfully',
          responseTime: result.responseTime
        };
      } else {
        throw new Error(result.message || 'Failed to create MoMo payment URL');
      }
    } catch (error) {
      console.error('Error creating MoMo payment:', error);
      throw error;
    }
  }

  // Process IPN (Instant Payment Notification)
  async processIPN(ipnData) {
    try {
      // Validate signature
      const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        transId,
        message,
        responseTime,
        resultCode,
        payType,
        extraData,
        signature
      } = ipnData;

      // Create raw signature string
      const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

      // Calculate expected signature
      const calculatedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(rawSignature)
        .digest('hex');

      // Validate signature
      if (signature !== calculatedSignature) {
        throw new Error('Invalid signature in IPN');
      }

      // Update payment status in database
      const payment = await prisma.payment.update({
        where: { 
          orderId_paymentMethod: {
            orderId: orderId,
            paymentMethod: 'MOMO'
          }
        },
        data: {
          status: resultCode === 0 ? 'PAID' : 'FAILED',
          transactionId: transId.toString(),
          referenceNumber: orderId,
          gatewayData: ipnData,
          paidAt: new Date()
        }
      });

      // Update order status if payment was successful
      if (resultCode === 0) {
        await prisma.order.update({
          where: { orderId: orderId },
          data: {
            paymentStatus: 'PAID',
            status: 'PROCESSING' // Move to processing after successful payment
          }
        });
      }

      return {
        resultCode: 0,
        message: 'IPN processed successfully'
      };
    } catch (error) {
      console.error('Error processing MoMo IPN:', error);
      return {
        resultCode: -1,
        message: 'Error processing IPN: ' + error.message
      };
    }
  }

  // Query transaction status
  async queryTransactionStatus(orderId) {
    const requestType = 'query';
    const requestId = `query_${Date.now()}`;

    // Create raw signature
    const rawSignature = `accessKey=${this.accessKey}&orderId=${orderId}&partnerCode=${this.partnerCode}&requestId=${requestId}&requestType=${requestType}`;

    // Create signature
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId: requestId,
      orderId: orderId,
      requestType: requestType,
      signature: signature,
      lang: 'vi'
    };

    try {
      const response = await axios.post(
        'https://test-payment.momo.vn/v2/gateway/api/query',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error querying MoMo transaction:', error);
      throw error;
    }
  }

  // Refund transaction
  async refundTransaction(refundData) {
    const {
      orderId,
      amount,
      transId,
      requestType = 'refund'
    } = refundData;

    const requestId = `refund_${Date.now()}`;
    const description = `Hoàn tiền cho đơn hàng ${orderId}`;

    // Create raw signature
    const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&description=${description}&orderId=${orderId}&partnerCode=${this.partnerCode}&requestId=${requestId}&requestType=${requestType}&transId=${transId}`;

    // Create signature
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId: requestId,
      orderId: orderId,
      transId: transId,
      lang: 'vi',
      amount: amount.toString(),
      description: description,
      requestType: requestType,
      signature: signature
    };

    try {
      const response = await axios.post(
        'https://test-payment.momo.vn/v2/gateway/api/refund',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error refunding MoMo transaction:', error);
      throw error;
    }
  }
}

module.exports = new MoMoService();