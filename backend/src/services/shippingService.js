const { PrismaClient } = require('@prisma/client');
const ahamoveService = require('./ahamoveService');
const grabexpressService = require('./grabexpressService');

const prisma = new PrismaClient();

class ShippingService {
  // Get shipping rates from available providers
  async getShippingRates(shippingData) {
    const { 
      pickupAddress, 
      deliveryAddress, 
      orderValue, 
      weight, 
      shippingMethod = 'AHAMOVE',
      city = 'HCMC',
      codAmount = 0 
    } = shippingData;

    try {
      let rates = [];

      switch (shippingMethod) {
        case 'AHAMOVE':
          const ahamoveRates = await ahamoveService.getShippingRates({
            pickupAddress,
            deliveryAddress,
            orderValue,
            weight,
            city,
            codAmount
          });
          
          // Format Ahamove response
          rates.push({
            provider: 'AHAMOVE',
            fee: ahamoveRates.fee || 0,
            estimatedDeliveryTime: ahamoveRates.estimated_delivery_time || '1-2 hours',
            serviceType: ahamoveRates.service_type || 'INSTANT'
          });
          break;

        case 'GRABEXPRESS':
          const grabRates = await grabexpressService.getShippingRates({
            pickupAddress,
            deliveryAddress,
            orderValue,
            weight
          });
          
          // Format GrabExpress response
          rates.push({
            provider: 'GRABEXPRESS',
            fee: grabRates.fee || 0,
            estimatedDeliveryTime: grabRates.estimated_delivery_time || '1-3 hours',
            serviceType: grabRates.service_type || 'INSTANT'
          });
          break;

        case 'BOTH':
          // Get rates from both providers
          try {
            const [ahamoveRates, grabRates] = await Promise.all([
              ahamoveService.getShippingRates({
                pickupAddress,
                deliveryAddress,
                orderValue,
                weight,
                city,
                codAmount
              }),
              grabexpressService.getShippingRates({
                pickupAddress,
                deliveryAddress,
                orderValue,
                weight
              })
            ]);

            rates.push({
              provider: 'AHAMOVE',
              fee: ahamoveRates.fee || 0,
              estimatedDeliveryTime: ahamoveRates.estimated_delivery_time || '1-2 hours',
              serviceType: ahamoveRates.service_type || 'INSTANT'
            });

            rates.push({
              provider: 'GRABEXPRESS',
              fee: grabRates.fee || 0,
              estimatedDeliveryTime: grabRates.estimated_delivery_time || '1-3 hours',
              serviceType: grabRates.service_type || 'INSTANT'
            });
          } catch (error) {
            // If one service fails, return the other
            console.error('Error getting shipping rates:', error);
            
            // Try to get at least one provider's rates
            try {
              const ahamoveRates = await ahamoveService.getShippingRates({
                pickupAddress,
                deliveryAddress,
                orderValue,
                weight,
                city,
                codAmount
              });
              rates.push({
                provider: 'AHAMOVE',
                fee: ahamoveRates.fee || 0,
                estimatedDeliveryTime: ahamoveRates.estimated_delivery_time || '1-2 hours',
                serviceType: ahamoveRates.service_type || 'INSTANT'
              });
            } catch (ahamoveErr) {
              console.error('Error getting Ahamove rates:', ahamoveErr);
            }

            try {
              const grabRates = await grabexpressService.getShippingRates({
                pickupAddress,
                deliveryAddress,
                orderValue,
                weight
              });
              rates.push({
                provider: 'GRABEXPRESS',
                fee: grabRates.fee || 0,
                estimatedDeliveryTime: grabRates.estimated_delivery_time || '1-3 hours',
                serviceType: grabRates.service_type || 'INSTANT'
              });
            } catch (grabErr) {
              console.error('Error getting GrabExpress rates:', grabErr);
            }
          }
          break;

        default:
          throw new Error(`Unsupported shipping method: ${shippingMethod}`);
      }

      return rates;
    } catch (error) {
      console.error('Error getting shipping rates:', error);
      throw error;
    }
  }

  // Create shipping order
  async createShippingOrder(shippingData) {
    const { 
      orderId,
      shippingMethod,
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

    try {
      let shippingResult;

      switch (shippingMethod) {
        case 'AHAMOVE':
          shippingResult = await ahamoveService.createShippingOrder({
            orderId,
            pickupAddress,
            deliveryAddress,
            recipientName,
            recipientPhone,
            orderValue,
            weight,
            city,
            codAmount,
            note
          });
          break;

        case 'GRABEXPRESS':
          shippingResult = await grabexpressService.createShippingOrder({
            orderId,
            pickupAddress,
            deliveryAddress,
            recipientName,
            recipientPhone,
            orderValue,
            weight,
            codAmount,
            note
          });
          break;

        default:
          throw new Error(`Unsupported shipping method: ${shippingMethod}`);
      }

      // Create shipping record in database
      const shippingRecord = await prisma.shipping.create({
        data: {
          orderId: orderId,
          shippingMethod: shippingMethod,
          trackingNumber: shippingResult.tracking_number || shippingResult.delivery_id,
          carrier: shippingMethod,
          fee: shippingResult.fee || 0,
          status: 'PENDING',
          address: {
            pickup: pickupAddress,
            delivery: deliveryAddress
          },
          shippingData: shippingResult
        }
      });

      // Update order status to indicate shipping is arranged
      await prisma.order.update({
        where: { orderId: orderId },
        data: { 
          shippingMethod: shippingMethod,
          shippingStatus: 'PENDING'
        }
      });

      return {
        shippingId: shippingRecord.id,
        trackingNumber: shippingRecord.trackingNumber,
        carrier: shippingRecord.carrier,
        fee: shippingRecord.fee,
        status: shippingRecord.status,
        providerResult: shippingResult
      };
    } catch (error) {
      console.error('Error creating shipping order:', error);
      throw error;
    }
  }

  // Get shipping order status
  async getShippingStatus(shippingId) {
    try {
      const shippingRecord = await prisma.shipping.findUnique({
        where: { id: shippingId }
      });

      if (!shippingRecord) {
        throw new Error('Shipping record not found');
      }

      let statusResult;

      switch (shippingRecord.shippingMethod) {
        case 'AHAMOVE':
          statusResult = await ahamoveService.getOrderStatus(shippingRecord.trackingNumber);
          break;

        case 'GRABEXPRESS':
          statusResult = await grabexpressService.getOrderStatus(shippingRecord.trackingNumber);
          break;

        default:
          throw new Error(`Unsupported shipping method: ${shippingRecord.shippingMethod}`);
      }

      // Update status in database if changed
      if (statusResult.status && statusResult.status !== shippingRecord.status) {
        await prisma.shipping.update({
          where: { id: shippingId },
          data: { 
            status: statusResult.status,
            shippingData: { ...shippingRecord.shippingData, ...statusResult }
          }
        });

        // Update order status if shipping status changed
        await prisma.order.update({
          where: { id: shippingRecord.orderId },
          data: { shippingStatus: statusResult.status }
        });
      }

      return {
        shippingId: shippingId,
        trackingNumber: shippingRecord.trackingNumber,
        carrier: shippingRecord.carrier,
        status: statusResult.status || shippingRecord.status,
        providerResult: statusResult
      };
    } catch (error) {
      console.error('Error getting shipping status:', error);
      throw error;
    }
  }

  // Cancel shipping order
  async cancelShippingOrder(shippingId, reason = 'Khách hàng hủy đơn') {
    try {
      const shippingRecord = await prisma.shipping.findUnique({
        where: { id: shippingId }
      });

      if (!shippingRecord) {
        throw new Error('Shipping record not found');
      }

      let cancelResult;

      switch (shippingRecord.shippingMethod) {
        case 'AHAMOVE':
          cancelResult = await ahamoveService.cancelOrder(shippingRecord.trackingNumber, reason);
          break;

        case 'GRABEXPRESS':
          cancelResult = await grabexpressService.cancelOrder(shippingRecord.trackingNumber, reason);
          break;

        default:
          throw new Error(`Unsupported shipping method: ${shippingRecord.shippingMethod}`);
      }

      // Update shipping record status
      await prisma.shipping.update({
        where: { id: shippingId },
        data: { 
          status: 'RETURNED',
          shippingData: { ...shippingRecord.shippingData, cancellation: cancelResult }
        }
      });

      // Update order status
      await prisma.order.update({
        where: { id: shippingRecord.orderId },
        data: { shippingStatus: 'RETURNED' }
      });

      return {
        shippingId: shippingId,
        status: 'RETURNED',
        providerResult: cancelResult
      };
    } catch (error) {
      console.error('Error canceling shipping order:', error);
      throw error;
    }
  }

  // Update shipping status manually (for webhook handling)
  async updateShippingStatus(trackingNumber, status, providerData = null) {
    try {
      const shippingRecord = await prisma.shipping.findFirst({
        where: { trackingNumber: trackingNumber }
      });

      if (!shippingRecord) {
        throw new Error('Shipping record not found for tracking number');
      }

      const updateData = {
        status: status
      };

      if (providerData) {
        updateData.shippingData = { ...shippingRecord.shippingData, ...providerData };
      }

      const updatedShipping = await prisma.shipping.update({
        where: { id: shippingRecord.id },
        data: updateData
      });

      // Update order status
      await prisma.order.update({
        where: { id: shippingRecord.orderId },
        data: { shippingStatus: status }
      });

      return updatedShipping;
    } catch (error) {
      console.error('Error updating shipping status:', error);
      throw error;
    }
  }
}

module.exports = new ShippingService();