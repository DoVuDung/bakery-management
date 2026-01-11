const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auditService = require('./auditService');

class PaymentVerificationService {
  // Verify VNPay payment response using HMAC-SHA512
  verifyVNPayResponse(responseData) {
    const { vnp_SecureHash, ...params } = responseData;
    
    // Sort parameters by key
    const sortedKeys = Object.keys(params).sort();
    let signData = '';
    for (const key of sortedKeys) {
      if (key.startsWith('vnp_')) {
        signData += `${key}=${params[key]}&`;
      }
    }
    signData = signData.slice(0, -1); // Remove last '&'

    // Create hash using secret key
    const secureHash = crypto
      .createHmac('sha512', process.env.VNPAY_HASHSECRET)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    return {
      isValid: secureHash === vnp_SecureHash,
      data: params
    };
  }

  // Verify MoMo payment response using HMAC-SHA256
  verifyMoMoResponse(responseData) {
    const { signature, ...params } = responseData;

    // Create raw signature string (excluding signature)
    const rawSignature = `accessKey=${params.accessKey}&amount=${params.amount}&extraData=${params.extraData}&message=${params.message}&orderId=${params.orderId}&orderInfo=${params.orderInfo}&partnerCode=${params.partnerCode}&payType=${params.payType}&requestId=${params.requestId}&responseTime=${params.responseTime}&resultCode=${params.resultCode}&transId=${params.transId}`;

    // Calculate expected signature
    const calculatedSignature = crypto
      .createHmac('sha256', process.env.MOMO_SECRET_KEY)
      .update(rawSignature)
      .digest('hex');

    return {
      isValid: calculatedSignature === signature,
      data: params
    };
  }

  // Verify ZaloPay payment response using MAC
  verifyZaloPayResponse(responseData) {
    const { mac, ...params } = responseData;

    // Create data string for MAC calculation
    const data = `${params.app_trans_id}|${params.m}z|${params.return_code}`;
    const calculatedMac = crypto
      .createHmac('sha256', process.env.ZALOPAY_KEY2)
      .update(data)
      .digest('hex');

    return {
      isValid: calculatedMac === mac,
      data: params
    };
  }

  // Process payment confirmation from gateway (IPN/Server-to-Server)
  async processPaymentConfirmation(gateway, confirmationData, req = null) {
    let verificationResult;
    
    switch (gateway.toLowerCase()) {
      case 'vnpay':
        verificationResult = this.verifyVNPayResponse(confirmationData);
        break;
      case 'momo':
        verificationResult = this.verifyMoMoResponse(confirmationData);
        break;
      case 'zalopay':
        verificationResult = this.verifyZaloPayResponse(confirmationData);
        break;
      default:
        throw new Error(`Unsupported payment gateway: ${gateway}`);
    }

    if (!verificationResult.isValid) {
      console.error(`Payment verification failed for gateway: ${gateway}`);
      
      // Log security event
      await auditService.logAction(
        null,
        'PAYMENT_VERIFICATION_FAILED',
        'PAYMENT',
        confirmationData.orderId || confirmationData.vnp_TxnRef || confirmationData.orderId,
        null,
        {
          gateway,
          verificationData: confirmationData,
          ipAddress: this.getClientIP(req)
        },
        req
      );
      
      return {
        success: false,
        error: 'Payment verification failed',
        code: 'PAYMENT_VERIFICATION_FAILED'
      };
    }

    // Extract order ID based on gateway
    let orderId;
    switch (gateway.toLowerCase()) {
      case 'vnpay':
        orderId = verificationResult.data.vnp_TxnRef;
        break;
      case 'momo':
        orderId = verificationResult.data.orderId;
        break;
      case 'zalopay':
        orderId = verificationResult.data.app_trans_id;
        break;
    }

    // Find the order in database
    const order = await prisma.order.findUnique({
      where: { orderId: orderId }
    });

    if (!order) {
      console.error(`Order not found for ID: ${orderId}`);
      
      // Log security event
      await auditService.logAction(
        null,
        'ORDER_NOT_FOUND_FOR_PAYMENT',
        'PAYMENT',
        orderId,
        null,
        {
          gateway,
          verificationData: verificationResult.data,
          ipAddress: this.getClientIP(req)
        },
        req
      );
      
      return {
        success: false,
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      };
    }

    // Update payment status in database
    const paymentStatus = this.getPaymentStatusFromGatewayResponse(gateway, verificationResult.data);
    
    // Update payment record
    await prisma.payment.updateMany({
      where: {
        orderId: orderId,
        paymentMethod: gateway.toUpperCase()
      },
      data: {
        status: paymentStatus,
        transactionId: this.getTransactionIdFromGatewayResponse(gateway, verificationResult.data),
        referenceNumber: orderId,
        gatewayData: verificationResult.data,
        paidAt: paymentStatus === 'PAID' ? new Date() : null
      }
    });

    // Update order status if payment was successful
    if (paymentStatus === 'PAID') {
      await prisma.order.update({
        where: { orderId: orderId },
        data: {
          paymentStatus: 'PAID',
          status: 'PROCESSING' // Move to processing after successful payment
        }
      });

      // Log successful payment
      await auditService.logAction(
        order.userId,
        'PAYMENT_SUCCESS',
        'ORDER',
        orderId,
        { paymentStatus: order.paymentStatus },
        { paymentStatus: 'PAID', gateway, transactionId: verificationResult.data.transId },
        req
      );
    } else {
      // Log failed payment
      await auditService.logAction(
        order.userId,
        'PAYMENT_FAILED',
        'ORDER',
        orderId,
        { paymentStatus: order.paymentStatus },
        { paymentStatus, gateway, errorCode: verificationResult.data.vnp_ResponseCode || verificationResult.data.resultCode },
        req
      );
    }

    return {
      success: true,
      paymentStatus,
      orderId
    };
  }

  // Get payment status from gateway response
  getPaymentStatusFromGatewayResponse(gateway, responseData) {
    switch (gateway.toLowerCase()) {
      case 'vnpay':
        // VNPay returns response code: 00 = success
        return responseData.vnp_ResponseCode === '00' ? 'PAID' : 'FAILED';
      case 'momo':
        // MoMo returns result code: 0 = success
        return responseData.resultCode === 0 ? 'PAID' : 'FAILED';
      case 'zalopay':
        // ZaloPay returns return code: 1 = success
        return responseData.return_code === 1 ? 'PAID' : 'FAILED';
      default:
        return 'FAILED';
    }
  }

  // Get transaction ID from gateway response
  getTransactionIdFromGatewayResponse(gateway, responseData) {
    switch (gateway.toLowerCase()) {
      case 'vnpay':
        return responseData.vnp_TransactionNo;
      case 'momo':
        return responseData.transId;
      case 'zalopay':
        return responseData.zp_trans_id;
      default:
        return null;
    }
  }

  // Get client IP address from request
  getClientIP(req) {
    return req.headers['x-forwarded-for'] ||
           req.headers['x-real-ip'] ||
           req.headers['x-client-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           null;
  }

  // Verify payment before checkout (client-side verification would happen here)
  async verifyPaymentIntent(orderId, amount, paymentMethod) {
    // This would typically involve checking the order in DB and ensuring
    // the amount matches and the order is valid
    const order = await prisma.order.findUnique({
      where: { orderId: orderId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (Math.abs(order.totalAmount - amount) > 0.01) { // Small tolerance for floating point comparison
      throw new Error('Amount mismatch');
    }

    if (order.paymentStatus !== 'PENDING') {
      throw new Error('Order payment status invalid');
    }

    return {
      isValid: true,
      order,
      amountMatches: true
    };
  }
}

module.exports = new PaymentVerificationService();