const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class VoucherService {
  // Create a new voucher
  async createVoucher(voucherData) {
    const {
      code,
      name,
      description,
      type,
      value,
      minOrderValue,
      maxDiscount,
      usageLimit,
      startDate,
      endDate,
      applicableProducts = [],
      applicableCategories = []
    } = voucherData;

    // Validate required fields
    if (!code || !name || !type || value === undefined) {
      throw new Error('Missing required voucher fields: code, name, type, and value are required');
    }

    // Validate voucher type
    const validTypes = ['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid voucher type. Valid types: ${validTypes.join(', ')}`);
    }

    // Check if code already exists
    const existingVoucher = await prisma.voucher.findUnique({
      where: { code: code }
    });

    if (existingVoucher) {
      throw new Error('Voucher code already exists');
    }

    // Create voucher
    const voucher = await prisma.voucher.create({
      data: {
        code: code.toUpperCase(), // Always store codes in uppercase
        name,
        description: description || '',
        type,
        value,
        minOrderValue: minOrderValue || null,
        maxDiscount: maxDiscount || null,
        usageLimit: usageLimit || null,
        usedCount: 0,
        isActive: true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        applicableProducts: applicableProducts || [],
        applicableCategories: applicableCategories || []
      }
    });

    return voucher;
  }

  // Get voucher by code
  async getVoucherByCode(code) {
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!voucher) {
      throw new Error('Voucher not found');
    }

    // Check if voucher is active and within date range
    if (!voucher.isActive) {
      throw new Error('Voucher is not active');
    }

    if (voucher.startDate && new Date() < new Date(voucher.startDate)) {
      throw new Error('Voucher is not yet valid');
    }

    if (voucher.endDate && new Date() > new Date(voucher.endDate)) {
      throw new Error('Voucher has expired');
    }

    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      throw new Error('Voucher usage limit reached');
    }

    return voucher;
  }

  // Apply voucher to order
  async applyVoucherToOrder(voucherCode, orderData) {
    const { orderId, items, subtotal } = orderData;

    // Get voucher
    const voucher = await this.getVoucherByCode(voucherCode);

    // Check minimum order value
    if (voucher.minOrderValue && subtotal < voucher.minOrderValue) {
      throw new Error(`Minimum order value of ${voucher.minOrderValue} ₫ not met`);
    }

    // Check applicable products/categories
    if (voucher.applicableProducts.length > 0) {
      const hasApplicableProduct = items.some(item => 
        voucher.applicableProducts.includes(item.productId)
      );
      
      if (!hasApplicableProduct) {
        throw new Error('Voucher is not applicable to any product in your cart');
      }
    }

    if (voucher.applicableCategories.length > 0) {
      // In a real implementation, you'd need to check product categories
      // For now, we'll assume it passes
    }

    // Calculate discount
    let discount = 0;
    
    switch (voucher.type) {
      case 'PERCENTAGE':
        discount = (subtotal * voucher.value) / 100;
        
        // Apply max discount if set
        if (voucher.maxDiscount && discount > voucher.maxDiscount) {
          discount = voucher.maxDiscount;
        }
        break;
        
      case 'FIXED_AMOUNT':
        discount = Math.min(voucher.value, subtotal); // Can't discount more than the subtotal
        break;
        
      case 'BUY_X_GET_Y':
        // For buy X get Y, the discount would be calculated differently
        // This is a simplified implementation
        discount = voucher.value;
        break;
        
      default:
        throw new Error('Invalid voucher type');
    }

    // Make sure discount doesn't exceed subtotal
    discount = Math.min(discount, subtotal);

    // Create order voucher record
    const orderVoucher = await prisma.orderVoucher.create({
      data: {
        orderId: orderId,
        voucherId: voucher.id,
        code: voucher.code,
        discount: discount
      }
    });

    return {
      voucher: {
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        description: voucher.description,
        type: voucher.type
      },
      discount: discount,
      orderVoucherId: orderVoucher.id
    };
  }

  // Validate voucher for order
  async validateVoucher(voucherCode, orderData) {
    try {
      const { subtotal, items } = orderData;
      
      // Get voucher
      const voucher = await this.getVoucherByCode(voucherCode);

      // Check minimum order value
      if (voucher.minOrderValue && subtotal < voucher.minOrderValue) {
        return {
          isValid: false,
          error: `Minimum order value of ${voucher.minOrderValue} ₫ not met`
        };
      }

      // Check applicable products/categories
      if (voucher.applicableProducts.length > 0) {
        const hasApplicableProduct = items.some(item => 
          voucher.applicableProducts.includes(item.productId)
        );
        
        if (!hasApplicableProduct) {
          return {
            isValid: false,
            error: 'Voucher is not applicable to any product in your cart'
          };
        }
      }

      // Calculate potential discount
      let discount = 0;
      
      switch (voucher.type) {
        case 'PERCENTAGE':
          discount = (subtotal * voucher.value) / 100;
          
          // Apply max discount if set
          if (voucher.maxDiscount && discount > voucher.maxDiscount) {
            discount = voucher.maxDiscount;
          }
          break;
          
        case 'FIXED_AMOUNT':
          discount = Math.min(voucher.value, subtotal);
          break;
          
        case 'BUY_X_GET_Y':
          discount = voucher.value;
          break;
          
        default:
          return {
            isValid: false,
            error: 'Invalid voucher type'
          };
      }

      discount = Math.min(discount, subtotal);

      return {
        isValid: true,
        voucher: {
          id: voucher.id,
          code: voucher.code,
          name: voucher.name,
          description: voucher.description,
          type: voucher.type,
          value: voucher.value,
          maxDiscount: voucher.maxDiscount
        },
        potentialDiscount: discount
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  // Mark voucher as used (increment used count)
  async markVoucherAsUsed(voucherId) {
    const voucher = await prisma.voucher.update({
      where: { id: voucherId },
      data: {
        usedCount: {
          increment: 1
        }
      }
    });

    return voucher;
  }

  // Get all active vouchers
  async getActiveVouchers(filters = {}) {
    const { 
      type, 
      search, 
      limit = 20, 
      offset = 0 
    } = filters;

    const whereClause = {
      isActive: true,
      AND: [
        { usedCount: { lt: prisma.$queryRaw`COALESCE(usage_limit, 999999)` } }
      ]
    };

    // Add type filter if specified
    if (type) {
      whereClause.type = type;
    }

    // Add date filters
    whereClause.OR = [
      { startDate: null },
      { startDate: { lte: new Date() } }
    ];
    
    whereClause.AND.push({
      OR: [
        { endDate: null },
        { endDate: { gte: new Date() } }
      ]
    });

    // Add search filter if specified
    if (search) {
      whereClause.OR.push({
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    const vouchers = await prisma.voucher.findMany({
      where: whereClause,
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { createdAt: 'desc' }
    });

    return vouchers;
  }

  // Update voucher
  async updateVoucher(voucherId, updateData) {
    const existingVoucher = await prisma.voucher.findUnique({
      where: { id: voucherId }
    });

    if (!existingVoucher) {
      throw new Error('Voucher not found');
    }

    // Prepare update data
    const updatePayload = { ...updateData };

    // Handle date fields
    if (updateData.startDate) {
      updatePayload.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updatePayload.endDate = new Date(updateData.endDate);
    }

    const updatedVoucher = await prisma.voucher.update({
      where: { id: voucherId },
      data: updatePayload
    });

    return updatedVoucher;
  }

  // Deactivate voucher
  async deactivateVoucher(voucherId) {
    const updatedVoucher = await prisma.voucher.update({
      where: { id: voucherId },
      data: { isActive: false }
    });

    return updatedVoucher;
  }

  // Get voucher statistics
  async getVoucherStats(voucherId) {
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId }
    });

    if (!voucher) {
      throw new Error('Voucher not found');
    }

    // Get usage statistics
    const usageStats = await prisma.orderVoucher.aggregate({
      where: { voucherId: voucherId },
      _sum: { discount: true },
      _count: true
    });

    return {
      voucher,
      totalUses: usageStats._count,
      totalDiscountGiven: usageStats._sum.discount || 0,
      remainingUses: voucher.usageLimit ? voucher.usageLimit - voucher.usedCount : Infinity
    };
  }
}

module.exports = new VoucherService();