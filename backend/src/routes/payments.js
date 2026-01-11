const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { sensitiveEndpointsLimiter } = require('../middleware/security/sessionSecurity');
const paymentService = require('../services/paymentService');
const vnpayService = require('../services/vnpayService');
const momoService = require('../services/momoService');
const zalopayService = require('../services/zalopayService');
const paymentVerificationService = require('../services/security/paymentVerification');

// @route   POST api/payments/process
// @desc    Process payment
// @access  Private
router.post('/process', auth, sensitiveEndpointsLimiter, async (req, res) => {
  try {
    const { orderId, amount, paymentMethod, orderInfo, ipAddress } = req.body;

    // Validation
    if (!orderId || !amount || !paymentMethod) {
      return res.status(400).json({ 
        error: 'Missing required payment fields',
        code: 'MISSING_PAYMENT_FIELDS'
      });
    }

    const validMethods = ['VNPAY', 'MOMO', 'ZALOPAY', 'COD'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ 
        error: `Invalid payment method. Valid methods: ${validMethods.join(', ')}`,
        code: 'INVALID_PAYMENT_METHOD'
      });
    }

    // Process payment
    const result = await paymentService.processPayment({
      orderId,
      amount,
      paymentMethod,
      orderInfo,
      ipAddress: ipAddress || req.ip
    });

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      error: 'Payment processing failed',
      code: 'PAYMENT_PROCESSING_ERROR'
    });
  }
});

// @route   GET api/payments/:paymentId
// @desc    Get payment by ID
// @access  Private
router.get('/:paymentId', auth, async (req, res) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ 
        error: 'Payment not found',
        code: 'PAYMENT_NOT_FOUND'
      });
    }

    res.json(payment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      error: 'Error retrieving payment',
      code: 'PAYMENT_RETRIEVAL_ERROR'
    });
  }
});

// @route   GET api/payments/order/:orderId
// @desc    Get payments by order ID
// @access  Private
router.get('/order/:orderId', auth, async (req, res) => {
  try {
    const payments = await paymentService.getPaymentsByOrderId(req.params.orderId);
    res.json(payments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      error: 'Error retrieving payments',
      code: 'PAYMENTS_RETRIEVAL_ERROR'
    });
  }
});

// @route   POST api/payments/refund/:paymentId
// @desc    Refund payment
// @access  Private (Admin only)
router.post('/refund/:paymentId', auth, sensitiveEndpointsLimiter, async (req, res) => {
  try {
    // TODO: Implement admin auth check
    const { reason } = req.body;
    
    const result = await paymentService.refundPayment(req.params.paymentId, reason);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      error: 'Refund processing failed',
      code: 'REFUND_PROCESSING_ERROR'
    });
  }
});

// @route   POST api/payments/vnpay-return
// @desc    Handle VNPay return
// @access  Public (webhook)
router.post('/vnpay-return', async (req, res) => {
  try {
    const queryParams = req.query; // VNPay returns data as query parameters
    
    // Verify the return data using HMAC-SHA512
    const verification = vnpayService.verifyReturnUrl(queryParams);
    
    if (verification.isValid) {
      const vnpResponse = verification.data;
      const orderId = vnpResponse.vnp_TxnRef;
      const vnpCode = vnpResponse.vnp_ResponseCode;
      const transactionId = vnpResponse.vnp_TransactionNo;
      
      // Update payment status based on VNPay response
      const payment = await paymentService.getPaymentById(paymentId); // Note: This should be updated
      
      if (payment) {
        const status = vnpCode === '00' ? 'PAID' : 'FAILED';
        
        await paymentService.updatePaymentStatus(payment.id, status, {
          ...vnpResponse,
          verifiedAt: new Date()
        });
        
        // Return success response to VNPay
        res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
      } else {
        res.status(404).json({ 
          error: 'Payment record not found',
          code: 'PAYMENT_RECORD_NOT_FOUND' 
        });
      }
    } else {
      res.status(400).json({ 
        error: 'Invalid VNPay response',
        code: 'INVALID_VNPAY_RESPONSE' 
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      error: 'VNPay return processing failed',
      code: 'VNPAY_RETURN_ERROR'
    });
  }
});

// @route   POST api/payments/momo-ipn
// @desc    Handle MoMo IPN (Instant Payment Notification)
// @access  Public (webhook)
router.post('/momo-ipn', async (req, res) => {
  try {
    const ipnData = req.body;
    
    // Process the IPN data with verification
    const result = await paymentVerificationService.processPaymentConfirmation('momo', ipnData, req);
    
    if (result.success) {
      // Return success response to MoMo
      res.status(200).json({ 
        resultCode: 0, 
        message: 'IPN processed successfully' 
      });
    } else {
      res.status(200).json({ 
        resultCode: -1, 
        message: result.error 
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      error: 'MoMo IPN processing failed',
      code: 'MOMO_IPN_ERROR'
    });
  }
});

// @route   POST api/payments/zalopay-callback
// @desc    Handle ZaloPay callback
// @access  Public (webhook)
router.post('/zalopay-callback', async (req, res) => {
  try {
    const callbackData = req.body;
    
    // Process the callback data with verification
    const result = await paymentVerificationService.processPaymentConfirmation('zalopay', callbackData, req);
    
    if (result.success) {
      // Return success response to ZaloPay
      res.status(200).json({ 
        return_code: 1, 
        return_message: 'success' 
      });
    } else {
      res.status(200).json({ 
        return_code: 0, 
        return_message: result.error 
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      error: 'ZaloPay callback processing failed',
      code: 'ZALOPAY_CALLBACK_ERROR'
    });
  }
});

// @route   GET api/payments/status/:paymentMethod/:referenceId
// @desc    Query payment status
// @access  Private
router.get('/status/:paymentMethod/:referenceId', auth, async (req, res) => {
  try {
    const { paymentMethod, referenceId } = req.params;
    
    let statusResult;
    
    switch (paymentMethod.toUpperCase()) {
      case 'VNPAY':
        statusResult = await vnpayService.queryPaymentStatus(referenceId);
        break;
        
      case 'MOMO':
        statusResult = await momoService.queryTransactionStatus(referenceId);
        break;
        
      case 'ZALOPAY':
        statusResult = await zalopayService.queryTransactionStatus(referenceId);
        break;
        
      default:
        return res.status(400).json({ 
          error: 'Invalid payment method for status query',
          code: 'INVALID_PAYMENT_METHOD_STATUS_QUERY'
        });
    }
    
    res.json(statusResult);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      error: 'Payment status query failed',
      code: 'PAYMENT_STATUS_QUERY_ERROR'
    });
  }
});

module.exports = router;