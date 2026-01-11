const axios = require('axios');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class GrabExpressService {
  constructor() {
    this.baseUrl = process.env.GRABEXPRESS_BASE_URL || 'https://express-sandbox.grab.com';
    this.clientId = process.env.GRABEXPRESS_CLIENT_ID;
    this.clientSecret = process.env.GRABEXPRESS_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Get access token for Grab Express API
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/oauth/token`, {
        grant_type: 'client_credentials',
        scope: 'grab_express:deliveries_write grab_express:deliveries_read'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));

      return this.accessToken;
    } catch (error) {
      console.error('Error getting Grab Express access token:', error);
      throw error;
    }
  }

  // Get shipping rates
  async getShippingRates(shippingData) {
    const { 
      pickupAddress, 
      deliveryAddress, 
      orderValue, 
      weight,
      serviceType = 'INSTANT'
    } = shippingData;

    // Get access token
    const token = await this.getAccessToken();

    // Note: This is a simplified representation. The actual Grab Express API has more complex requirements
    // including address validation and quotation creation
    try {
      // This is a placeholder implementation - the real API requires more steps
      // including address validation and quote creation
      const response = await axios.post(`${this.baseUrl}/delivery/quote`, {
        pickup_address: pickupAddress,
        delivery_address: deliveryAddress,
        order_value: orderValue || 0,
        weight: weight || 1,
        service_type: serviceType
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting Grab Express shipping rates:', error);
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
      serviceType = 'INSTANT',
      codAmount = 0,
      note = ''
    } = shippingData;

    // Get access token
    const token = await this.getAccessToken();

    try {
      // Create delivery order
      const response = await axios.post(`${this.baseUrl}/delivery/orders`, {
        reference_id: orderId,
        pickup_address: pickupAddress,
        delivery_address: deliveryAddress,
        recipient: {
          name: recipientName,
          phone: recipientPhone
        },
        order_value: orderValue || 0,
        weight: weight || 1,
        service_type: serviceType,
        cod_amount: codAmount,
        special_delivery_instructions: note
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating Grab Express shipping order:', error);
      throw error;
    }
  }

  // Get shipping order status
  async getOrderStatus(deliveryId) {
    // Get access token
    const token = await this.getAccessToken();

    try {
      const response = await axios.get(`${this.baseUrl}/delivery/orders/${deliveryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting Grab Express order status:', error);
      throw error;
    }
  }

  // Cancel shipping order
  async cancelOrder(deliveryId, reason = 'Khách hàng hủy đơn') {
    // Get access token
    const token = await this.getAccessToken();

    try {
      const response = await axios.patch(`${this.baseUrl}/delivery/orders/${deliveryId}/cancel`, {
        cancellation_reason: reason
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error canceling Grab Express order:', error);
      throw error;
    }
  }

  // Get delivery quote
  async getQuote(quoteData) {
    const { 
      pickupAddress, 
      deliveryAddress, 
      orderValue, 
      weight,
      serviceType = 'INSTANT'
    } = quoteData;

    // Get access token
    const token = await this.getAccessToken();

    try {
      const response = await axios.post(`${this.baseUrl}/delivery/quotes`, {
        pickup_address: pickupAddress,
        delivery_address: deliveryAddress,
        order_value: orderValue || 0,
        weight: weight || 1,
        service_type: serviceType
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting Grab Express quote:', error);
      throw error;
    }
  }
}

module.exports = new GrabExpressService();