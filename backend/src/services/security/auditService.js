const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AuditService {
  // Log an action
  async logAction(userId, action, resource, resourceId = null, oldValue = null, newValue = null, req = null) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: userId,
          action: action,
          resource: resource,
          resourceId: resourceId,
          oldValue: oldValue,
          newValue: newValue,
          ipAddress: this.getClientIP(req),
          userAgent: req ? req.get('User-Agent') : null
        }
      });
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't throw error as this shouldn't break the main functionality
    }
  }

  // Log sensitive actions
  async logSensitiveAction(userId, action, resource, resourceId = null, details = null, req = null) {
    await this.logAction(userId, action, resource, resourceId, null, details, req);
  }

  // Log salary changes
  async logSalaryChange(userId, staffId, action, oldValue, newValue, req = null) {
    await this.logAction(
      userId,
      action,
      'SALARY',
      staffId,
      oldValue,
      newValue,
      req
    );
  }

  // Log inventory changes
  async logInventoryChange(userId, ingredientId, action, oldValue, newValue, req = null) {
    await this.logAction(
      userId,
      action,
      'INVENTORY',
      ingredientId,
      oldValue,
      newValue,
      req
    );
  }

  // Log user role changes
  async logRoleChange(userId, targetUserId, action, oldValue, newValue, req = null) {
    await this.logAction(
      userId,
      action,
      'USER_ROLE',
      targetUserId,
      oldValue,
      newValue,
      req
    );
  }

  // Get audit logs for a specific resource
  async getAuditLogsForResource(resource, resourceId, limit = 50, offset = 0) {
    return await prisma.auditLog.findMany({
      where: {
        resource: resource,
        resourceId: resourceId
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    });
  }

  // Get audit logs for a specific user
  async getUserAuditLogs(userId, limit = 50, offset = 0) {
    return await prisma.auditLog.findMany({
      where: {
        userId: userId
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    });
  }

  // Get all audit logs (admin only)
  async getAllAuditLogs(filters = {}, limit = 50, offset = 0) {
    const whereClause = {};

    if (filters.action) {
      whereClause.action = filters.action;
    }
    if (filters.resource) {
      whereClause.resource = filters.resource;
    }
    if (filters.userId) {
      whereClause.userId = filters.userId;
    }
    if (filters.startDate) {
      whereClause.timestamp = {
        ...(whereClause.timestamp || {}),
        gte: new Date(filters.startDate)
      };
    }
    if (filters.endDate) {
      whereClause.timestamp = {
        ...(whereClause.timestamp || {}),
        lte: new Date(filters.endDate)
      };
    }

    return await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    });
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

  // Mask sensitive information in logs
  maskSensitiveData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const maskedData = { ...data };
    const sensitiveFields = ['password', 'cccd', 'idNumber', 'phoneNumber', 'email', 'address'];

    for (const field of sensitiveFields) {
      if (maskedData[field]) {
        if (typeof maskedData[field] === 'string') {
          maskedData[field] = this.maskField(maskedData[field]);
        }
      }
    }

    return maskedData;
  }

  // Helper to mask a field
  maskField(value) {
    if (value.length < 4) {
      return '*'.repeat(value.length);
    }
    return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
  }

  // Check for suspicious activities
  async checkSuspiciousActivity(userId, timeWindowMinutes = 60) {
    const timeAgo = new Date();
    timeAgo.setMinutes(timeAgo.getMinutes() - timeWindowMinutes);

    // Count actions in the time window
    const actionsCount = await prisma.auditLog.count({
      where: {
        userId: userId,
        timestamp: {
          gte: timeAgo
        }
      }
    });

    // Define suspicious thresholds
    const suspiciousThresholds = {
      'DELETE': 5,  // More than 5 deletions in an hour
      'ROLE_CHANGE': 2,  // More than 2 role changes in an hour
      'SALARY_CHANGE': 3  // More than 3 salary changes in an hour
    };

    // Check for specific suspicious action counts
    for (const [action, threshold] of Object.entries(suspiciousThresholds)) {
      const actionCount = await prisma.auditLog.count({
        where: {
          userId: userId,
          action: action,
          timestamp: {
            gte: timeAgo
          }
        }
      });

      if (actionCount > threshold) {
        console.warn(`Suspicious activity detected for user ${userId}: ${actionCount} ${action} actions in ${timeWindowMinutes} minutes`);
        return {
          suspicious: true,
          action: action,
          count: actionCount,
          threshold: threshold
        };
      }
    }

    return {
      suspicious: false
    };
  }
}

module.exports = new AuditService();