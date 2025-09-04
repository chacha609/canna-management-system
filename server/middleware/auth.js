const jwt = require('jsonwebtoken');
const { asyncHandler, ApiError } = require('./errorHandler');
const { User } = require('../models');
const { authLogger } = require('../utils/logger');

// Authentication middleware
const auth = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    throw new ApiError(401, 'Not authorized to access this route');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ensure it's an access token
    if (decoded.type !== 'access') {
      throw new ApiError(401, 'Invalid token type');
    }
    
    // Get user with role information
    const user = await User.findByIdWithRole(decoded.userId);

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (!user.is_active) {
      throw new ApiError(401, 'User account is deactivated');
    }

    // Add user to request object with all relevant information
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      facilityId: user.facility_id,
      roleId: user.role_id,
      roleName: user.role_name,
      roleDisplayName: user.role_display_name,
      permissions: user.role_permissions || [],
      preferences: user.preferences ? JSON.parse(user.preferences) : {},
      notificationSettings: user.notification_settings ? JSON.parse(user.notification_settings) : {},
      isActive: user.is_active,
      emailVerified: user.email_verified
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired');
    } else {
      throw error;
    }
  }
});

// Permission-based authorization middleware
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    const userPermissions = req.user.permissions || [];
    
    // Check if user has any of the required permissions
    const hasPermission = permissions.some(permission => userPermissions.includes(permission));
    
    if (!hasPermission) {
      authLogger.warn('Unauthorized access attempt - insufficient permissions', {
        userId: req.user.id,
        username: req.user.username,
        userPermissions: userPermissions,
        requiredPermissions: permissions,
        path: req.originalUrl,
        method: req.method
      });
      
      throw new ApiError(403, 'Insufficient permissions to access this resource');
    }

    next();
  };
};

// Role-based authorization middleware (legacy support)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (!roles.includes(req.user.roleName)) {
      authLogger.warn('Unauthorized access attempt - invalid role', {
        userId: req.user.id,
        username: req.user.username,
        userRole: req.user.roleName,
        requiredRoles: roles,
        path: req.originalUrl,
        method: req.method
      });
      
      throw new ApiError(403, 'User role not authorized to access this route');
    }

    next();
  };
};

// Facility-based authorization middleware
const authorizeFacility = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  // Super admin users can access all facilities
  if (req.user.roleName === 'super_admin') {
    return next();
  }

  // Get facility ID from request (params, body, or query)
  const facilityId = req.params.facilityId || req.body.facilityId || req.query.facilityId;

  if (!facilityId) {
    throw new ApiError(400, 'Facility ID is required');
  }

  // Check if user belongs to the facility
  if (req.user.facilityId !== parseInt(facilityId)) {
    authLogger.warn('Unauthorized facility access attempt', {
      userId: req.user.id,
      username: req.user.username,
      userFacilityId: req.user.facilityId,
      requestedFacilityId: facilityId,
      path: req.originalUrl,
      method: req.method
    });
    
    throw new ApiError(403, 'Not authorized to access this facility');
  }

  next();
});

// Resource ownership authorization middleware
const authorizeOwnership = (resourceUserIdField = 'user_id') => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    // Super admin and facility managers can access all resources in their facility
    if (req.user.roleName === 'super_admin' || req.user.roleName === 'facility_manager') {
      return next();
    }

    // Get resource user ID from request body or params
    const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];

    if (resourceUserId && parseInt(resourceUserId) !== req.user.id) {
      authLogger.warn('Unauthorized resource access attempt', {
        userId: req.user.id,
        username: req.user.username,
        resourceUserId: resourceUserId,
        path: req.originalUrl,
        method: req.method
      });
      
      throw new ApiError(403, 'Not authorized to access this resource');
    }

    next();
  });
};

// Optional authentication middleware (for public endpoints that can benefit from user context)
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.type === 'access') {
        // Get user with role information
        const user = await User.findByIdWithRole(decoded.userId);

        if (user && user.is_active) {
          // Add user to request object
          req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            facilityId: user.facility_id,
            roleId: user.role_id,
            roleName: user.role_name,
            roleDisplayName: user.role_display_name,
            permissions: user.role_permissions || [],
            isActive: user.is_active,
            emailVerified: user.email_verified
          };
        }
      }
    } catch (error) {
      // Silently fail for optional auth
      authLogger.debug('Optional auth failed', { error: error.message });
    }
  }

  next();
});

// Middleware to check if user has specific permission
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userPermissions = req.user.permissions || [];
    const hasRequiredPermission = userPermissions.includes(permission);

    // Add permission check result to request for use in routes
    req.hasPermission = hasRequiredPermission;
    
    next();
  };
};

// Middleware to ensure user is active and email is verified (if required)
const requireActiveUser = (requireEmailVerification = false) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (!req.user.isActive) {
      throw new ApiError(403, 'Account is deactivated');
    }

    if (requireEmailVerification && !req.user.emailVerified) {
      throw new ApiError(403, 'Email verification required');
    }

    next();
  };
};

// Middleware to log user activity
const logActivity = (action) => {
  return (req, res, next) => {
    if (req.user) {
      authLogger.info('User activity', {
        userId: req.user.id,
        username: req.user.username,
        action: action,
        path: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    next();
  };
};

module.exports = {
  auth,
  requirePermission,
  authorize, // Legacy role-based auth
  authorizeFacility,
  authorizeOwnership,
  optionalAuth,
  hasPermission,
  requireActiveUser,
  logActivity
};