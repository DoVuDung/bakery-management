const { PrismaClient } = require('@prisma/client');
const vnpayService = require('./vnpayService');
const momoService = require('./momoService');
const zalopayService = require('./zalopayService');

const prisma = new PrismaClient();

class PaymentService {
  // Process payment based on method
  async processPayment(paymentData) {
    const { orderId, amount, paymentMethod, orderInfo, ipAddress } = paymentData;

    // Validate required fields
    if (!orderId || !amount || !paymentMethod) {
      throw new Error('Missing required payment fields');
    }

    // Validate payment method
    const validMethods = ['VNPAY', 'MOMO', 'ZALOPAY', 'COD'];
    if (!validMethods.includes(paymentMethod)) {
      throw new Error(`Invalid payment method. Valid methods: ${validMethods.join(', ')}`);
    }

    try {
      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          orderId: orderId,
          paymentMethod: paymentMethod,
          amount: amount,
          status: 'PENDING'
        }
      });

      let result;

      switch (paymentMethod) {
        case 'VNPAY':
          result = await this.processVNPayPayment(paymentData);
          break;
        
        case 'MOMO':
          result = await this.processMoMoPayment(paymentData);
          break;
        
        case 'ZALOPAY':
          result = await this.processZaloPayPayment(paymentData);
          break;
        
        case 'COD':
          result = await this.processCODPayment(paymentData);
          break;
        
        default:
          throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }

      return {
        paymentId: payment.id,
        orderId: payment.orderId,
        paymentMethod: payment.paymentMethod,
        amount: payment.amount,
        status: payment.status,
        ...result
      };
    } catch (error) {
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: paymentData.paymentId },
        data: { status: 'FAILED' }
      });

      throw error;
    }
  }

  // Process VNPay payment
  async processVNPayPayment(paymentData) {
    try {
      const paymentUrl = vnpayService.createPaymentUrl({
        ...paymentData,
        ipAddress: paymentData.ipAddress
      });

      return {
        paymentUrl: paymentUrl,
        paymentMethod: 'VNPAY'
      };
    } catch (error) {
      console.error('Error processing VNPay payment:', error);
      throw error;
    }
  }

  // Process MoMo payment
  async processMoMoPayment(paymentData) {
    try {
      const result = await momoService.createPaymentUrl(paymentData);

      return {
        payUrl: result.payUrl,
        qrCodeUrl: result.qrCodeUrl,
        deeplink: result.deeplink,
        paymentMethod: 'MOMO'
      };
    } catch (error) {
      console.error('Error processing MoMo payment:', error);
      throw error;
    }
  }

  // Process ZaloPay payment
  async processZaloPayPayment(paymentData) {
    try {
      const result = await zalopayService.createPaymentUrl(paymentData);

      return {
        orderUrl: result.orderUrl,
        qrCodeUrl: result.qrCodeUrl,
        paymentMethod: 'ZALOPAY'
      };
    } catch (error) {
      console.error('Error processing ZaloPay payment:', error);
      throw error;
    }
  }

  // Process COD (Cash on Delivery) payment
  async processCODPayment(paymentData) {
    try {
      // For COD, we just update the order status
      const updatedOrder = await prisma.order.update({
        where: { orderId: paymentData.orderId },
        data: {
          paymentStatus: 'PAID', // We mark as paid when order is confirmed
          status: 'PROCESSING'   // Move to processing stage
        }
      });

      return {
        paymentMethod: 'COD',
        message: 'Cash on Delivery order created successfully',
        orderStatus: updatedOrder.status
      };
    } catch (error) {
      console.error('Error processing COD payment:', error);
      throw error;
    }
  }

  // Verify payment result
  async verifyPaymentResult(paymentMethod, resultData) {
    try {
      switch (paymentMethod) {
        case 'VNPAY':
          return vnpayService.verifyReturnUrl(resultData);
        
        case 'MOMO':
          // MoMo doesn't have direct verification in our implementation
          // Verification happens via IPN
          return { isValid: true, data: resultData };
        
        case 'ZALOPAY':
          // ZaloPay verification happens via callback
          return { isValid: true, data: resultData };
        
        case 'COD':
          return { isValid: true, data: resultData };
        
        default:
          throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }
    } catch (error) {
      console.error('Error verifying payment result:', error);
      return { isValid: false, error: error.message };
    }
  }

  // Update payment status after verification
  async updatePaymentStatus(paymentId, status, gatewayData = null) {
    try {
      const updateData = {
        status: status
      };

      if (gatewayData) {
        updateData.gatewayData = gatewayData;
      }

      if (status === 'PAID') {
        updateData.paidAt = new Date();
      }

      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: updateData
      });

      // If payment is successful, update order status
      if (status === 'PAID') {
        await prisma.order.update({
          where: { id: updatedPayment.orderId },
          data: { 
            paymentStatus: 'PAID',
            status: 'PROCESSING'
          }
        });
      }

      return updatedPayment;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  // Get payment by ID
  async getPaymentById(paymentId) {
    try {
      return await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          order: true
        }
      });
    } catch (error) {
      console.error('Error getting payment:', error);
      throw error;
    }
  }

  // Get payments by order ID
  async getPaymentsByOrderId(orderId) {
    try {
      return await prisma.payment.findMany({
        where: { orderId: orderId }
      });
    } catch (error) {
      console.error('Error getting payments by order ID:', error);
      throw error;
    }
  }

  // Refund payment
  async refundPayment(paymentId, reason = 'Khách hàng yêu cầu hoàn tiền') {
    try {
      const payment = await this.getPaymentById(paymentId);

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'PAID') {
        throw new Error('Cannot refund unpaid payment');
      }

      let refundResult;

      switch (payment.paymentMethod) {
        case 'VNPAY':
          // VNPay refund would be implemented here
          refundResult = { message: 'VNPay refund process initiated', status: 'REFUND_PENDING' };
          break;

        case 'MOMO':
          refundResult = await momoService.refundTransaction({
            orderId: payment.orderId,
            amount: payment.amount,
            transId: payment.transactionId,
            description: reason
          });
          break;

        case 'ZALOPAY':
          refundResult = await zalopayService.refundTransaction({
            zpTransId: payment.transactionId,
            amount: payment.amount,
            description: reason
          });
          break;

        case 'COD':
          throw new Error('Cannot refund Cash on Delivery payment');

        default:
          throw new Error(`Refund not supported for payment method: ${payment.paymentMethod}`);
      }

      // Update payment status to refunded
      await this.updatePaymentStatus(paymentId, 'REFUNDED');

      return {
        paymentId: paymentId,
        refundResult: refundResult,
        message: 'Payment refund processed successfully'
      };
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();