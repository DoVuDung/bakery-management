const axios = require('axios');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AhamoveService {
  constructor() {
    this.baseUrl = process.env.AHAMOVE_BASE_URL || 'https://staging-express-api.ahamove.com';
    this.partnerId = process.env.AHAMOVE_PARTNER_ID;
    this.apiKey = process.env.AHAMOVE_API_KEY;
    this.cityIds = {
      'HCMC': 'SGN',
      'HANOI': 'HAN',
      'DANANG': 'DAD'
    };
  }

  // Generate signature for Ahamove API
  generateSignature(method, path, body, timestamp) {
    const data = `${method}|${path}|${JSON.stringify(body)}|${this.apiKey}|${timestamp}`;
    return crypto.createHmac('sha256', this.apiKey).update(data).digest('hex');
  }

  // Get shipping rates
  async getShippingRates(shippingData) {
    const { 
      pickupAddress, 
      deliveryAddress, 
      orderValue, 
      weight, 
      city = 'HCMC',
      codAmount = 0 
    } = shippingData;

    const timestamp = Date.now();
    const path = '/v2/shipping/rate';
    
    const body = {
      city_id: this.cityIds[city],
      pickup_address: pickupAddress,
      delivery_address: deliveryAddress,
      order_value: orderValue || 0,
      weight: weight || 1, // Default to 1kg if not provided
      cod_amount: codAmount
    };

    const signature = this.generateSignature('POST', path, body, timestamp);

    try {
      const response = await axios.post(`${this.baseUrl}${path}`, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': this.partnerId,
          'X-Timestamp': timestamp,
          'X-Signature': signature
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting Ahamove shipping rates:', error);
      throw error;
    }
  }

  // Create shipping order
  async createShippingOrder(shippingData) {
    const { 
      orderId, 
      pickupAddress, 
      deliveryAddress, 
      recipientName, 
      recipientPhone, 
      orderValue, 
      weight, 
      city = 'HCMC',
      codAmount = 0,
      note = '' 
    } = shippingData;

    const timestamp = Date.now();
    const path = '/v2/shipping/order';

    const body = {
      city_id: this.cityIds[city],
      partner_order_id: orderId,
      pickup_address: pickupAddress,
      delivery_address: deliveryAddress,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      order_value: orderValue || 0,
      weight: weight || 1,
      cod_amount: codAmount,
      note: note
    };

    const signature = this.generateSignature('POST', path, body, timestamp);

    try {
      const response = await axios.post(`${this.baseUrl}${path}`, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': this.partnerId,
          'X-Timestamp': timestamp,
          'X-Signature': signature
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating Ahamove shipping order:', error);
      throw error;
    }
  }

  // Get shipping order status
  async getOrderStatus(partnerOrderId) {
    const timestamp = Date.now();
    const path = `/v2/shipping/order/${partnerOrderId}/status`;

    // For GET requests, body is empty
    const body = {};
    const signature = this.generateSignature('GET', path, body, timestamp);

    try {
      const response = await axios.get(`${this.baseUrl}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': this.partnerId,
          'X-Timestamp': timestamp,
          'X-Signature': signature
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting Ahamove order status:', error);
      throw error;
    }
  }

  // Cancel shipping order
  async cancelOrder(partnerOrderId, reason = 'Khách hàng hủy đơn') {
    const timestamp = Date.now();
    const path = '/v2/shipping/order/cancel';

    const body = {
      partner_order_id: partnerOrderId,
      reason: reason
    };

    const signature = this.generateSignature('POST', path, body, timestamp);

    try {
      const response = await axios.post(`${this.baseUrl}${path}`, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': this.partnerId,
          'X-Timestamp': timestamp,
          'X-Signature': signature
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error canceling Ahamove order:', error);
      throw error;
    }
  }
}

module.exports = new AhamoveService();