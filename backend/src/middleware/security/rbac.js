const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// RBAC middleware to check user permissions
const checkPermission = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Unauthorized: No user session found',
          code: 'NO_USER_SESSION'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ 
          error: 'Unauthorized: User not found or inactive',
          code: 'USER_INACTIVE'
        });
      }

      // Check if user has required role
      if (!requiredRoles.includes(user.role)) {
        return res.status(403).json({ 
          error: 'Forbidden: Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          userRole: user.role,
          requiredRoles: requiredRoles
        });
      }

      // Attach user info to request for later use
      req.currentUser = user;
      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

// Specific role checkers
const requireAdmin = checkPermission(['ADMIN']);
const requireManager = checkPermission(['ADMIN', 'MANAGER']);
const requireStaff = checkPermission(['ADMIN', 'MANAGER', 'STAFF']);
const requireAuthenticated = checkPermission(['ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER']);

// Permission-based access control
const checkResourceOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized: No user session found',
        code: 'NO_USER_SESSION'
      });
    }

    // For endpoints that operate on user-owned resources
    const resourceId = req.params.userId || req.body.userId || req.query.userId;
    
    if (resourceId && resourceId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ 
        error: 'Forbidden: Cannot access resources owned by other users',
        code: 'RESOURCE_OWNERSHIP_VIOLATION'
      });
    }

    next();
  } catch (error) {
    console.error('Resource ownership check error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Specific resource access checks
const checkOrderAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized: No user session found',
        code: 'NO_USER_SESSION'
      });
    }

    const orderId = req.params.orderId || req.params.id;
    
    if (!orderId) {
      return next(); // If no order ID specified, continue (for creation endpoints)
    }

    // Admins can access all orders
    if (req.user.role === 'ADMIN' || req.user.role === 'MANAGER') {
      return next();
    }

    // Staff can access all orders
    if (req.user.role === 'STAFF') {
      return next();
    }

    // Customers can only access their own orders
    if (req.user.role === 'CUSTOMER') {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        return res.status(404).json({ 
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      if (order.userId !== req.user.id) {
        return res.status(403).json({ 
          error: 'Forbidden: Cannot access orders owned by other users',
          code: 'ORDER_OWNERSHIP_VIOLATION'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Order access check error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

const checkInventoryAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized: No user session found',
        code: 'NO_USER_SESSION'
      });
    }

    // Only staff and above can access inventory
    if (!['ADMIN', 'MANAGER', 'STAFF'].includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden: Insufficient permissions to access inventory',
        code: 'INVENTORY_ACCESS_DENIED'
      });
    }

    next();
  } catch (error) {
    console.error('Inventory access check error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

const checkSalaryAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized: No user session found',
        code: 'NO_USER_SESSION'
      });
    }

    // Only admins and managers can access salary information
    if (!['ADMIN', 'MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden: Insufficient permissions to access salary information',
        code: 'SALARY_ACCESS_DENIED'
      });
    }

    next();
  } catch (error) {
    console.error('Salary access check error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  checkPermission,
  requireAdmin,
  requireManager,
  requireStaff,
  requireAuthenticated,
  checkResourceOwnership,
  checkOrderAccess,
  checkInventoryAccess,
  checkSalaryAccess
};