const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { auth, requirePermission, authorizeFacility, authorizeOwnership, logActivity } = require('../middleware/auth');
const { User } = require('../models');
const { authLogger } = require('../utils/logger');

const router = express.Router();

// Validation middleware
const createUserValidation = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('first_name').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required and must be less than 50 characters'),
  body('last_name').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required and must be less than 50 characters'),
  body('facility_id').isInt({ min: 1 }).withMessage('Valid facility ID is required'),
  body('role_id').optional().isInt({ min: 1 }).withMessage('Role ID must be a valid integer'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number')
];

const updateUserValidation = [
  body('username').optional().trim().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('first_name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be less than 50 characters'),
  body('last_name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be less than 50 characters'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('role_id').optional().isInt({ min: 1 }).withMessage('Role ID must be a valid integer')
];

const updateProfileValidation = [
  body('first_name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be less than 50 characters'),
  body('last_name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be less than 50 characters'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('preferences').optional().isObject().withMessage('Preferences must be an object'),
  body('notification_settings').optional().isObject().withMessage('Notification settings must be an object')
];

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (user.view permission)
router.get('/', 
  auth, 
  requirePermission('user.view'),
  authorizeFacility,
  logActivity('view_users'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, role_id, is_active } = req.query;
    
    const filters = {
      facility_id: req.user.facilityId
    };
    
    if (search) {
      filters.search = search;
    }
    
    if (role_id) {
      filters.role_id = parseInt(role_id);
    }
    
    if (is_active !== undefined) {
      filters.is_active = is_active === 'true';
    }

    const options = {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      orderBy: 'users.created_at',
      orderDirection: 'desc'
    };

    const users = await User.findAllWithRoles(filters, options);
    const totalCount = await User.count(filters);

    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          facilityId: user.facility_id,
          facilityName: user.facility_name,
          roleId: user.role_id,
          roleName: user.role_name,
          roleDisplayName: user.role_display_name,
          isActive: user.is_active,
          emailVerified: user.email_verified,
          lastLogin: user.last_login,
          createdAt: user.created_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  })
);

// @desc    Get current user profile
// @route   GET /api/v1/users/me
// @access  Private
router.get('/me', 
  auth, 
  logActivity('view_profile'),
  asyncHandler(async (req, res) => {
    const user = await User.findByIdWithRole(req.user.id);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      success: true,
      data: {
        user: {
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
          emailVerified: user.email_verified,
          lastLogin: user.last_login,
          createdAt: user.created_at
        }
      }
    });
  })
);

// @desc    Get user by ID
// @route   GET /api/v1/users/:id
// @access  Private (user.view permission)
router.get('/:id',
  [param('id').isInt({ min: 1 }).withMessage('Valid user ID is required')],
  auth,
  requirePermission('user.view'),
  authorizeFacility,
  logActivity('view_user'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const user = await User.findByIdWithRole(parseInt(req.params.id));
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Check if user belongs to the same facility (unless super admin)
    if (req.user.roleName !== 'super_admin' && user.facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to view this user');
    }

    res.json({
      success: true,
      data: {
        user: {
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
          isActive: user.is_active,
          emailVerified: user.email_verified,
          lastLogin: user.last_login,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      }
    });
  })
);

// @desc    Create new user
// @route   POST /api/v1/users
// @access  Private (user.manage permission)
router.post('/',
  createUserValidation,
  auth,
  requirePermission('user.manage'),
  authorizeFacility,
  logActivity('create_user'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const { username, email, first_name, last_name, facility_id, role_id, phone } = req.body;

    // Ensure user can only create users in their facility (unless super admin)
    if (req.user.roleName !== 'super_admin' && facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to create users in this facility');
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';

    const userData = {
      username,
      email,
      password: tempPassword,
      first_name,
      last_name,
      facility_id,
      role_id: role_id || null,
      phone: phone || null
    };

    const newUser = await User.create(userData);

    authLogger.info('User created by admin', {
      createdUserId: newUser.id,
      createdByUserId: req.user.id,
      createdByUsername: req.user.username,
      facilityId: facility_id
    });

    // TODO: Send email with temporary password
    // For now, return it in response (remove in production)
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          facilityId: newUser.facility_id,
          roleId: newUser.role_id,
          isActive: newUser.is_active
        },
        temporaryPassword: tempPassword // Remove in production
      }
    });
  })
);

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private (user.manage permission)
router.put('/:id',
  [param('id').isInt({ min: 1 }).withMessage('Valid user ID is required')],
  updateUserValidation,
  auth,
  requirePermission('user.manage'),
  authorizeFacility,
  logActivity('update_user'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const userId = parseInt(req.params.id);
    const { username, email, first_name, last_name, phone, role_id, is_active } = req.body;

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      throw new ApiError(404, 'User not found');
    }

    // Check if user belongs to the same facility (unless super admin)
    if (req.user.roleName !== 'super_admin' && existingUser.facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to update this user');
    }

    // Check for username/email conflicts
    if (username && username !== existingUser.username) {
      const existingUsername = await User.findByEmailOrUsername(username);
      if (existingUsername && existingUsername.id !== userId) {
        throw new ApiError(400, 'Username is already taken');
      }
    }

    if (email && email !== existingUser.email) {
      const existingEmail = await User.findByEmailOrUsername(email);
      if (existingEmail && existingEmail.id !== userId) {
        throw new ApiError(400, 'Email is already taken');
      }
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone) updateData.phone = phone;
    if (role_id) updateData.role_id = role_id;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updatedUser = await User.update(userId, updateData);

    authLogger.info('User updated by admin', {
      updatedUserId: userId,
      updatedByUserId: req.user.id,
      updatedByUsername: req.user.username,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          phone: updatedUser.phone,
          facilityId: updatedUser.facility_id,
          roleId: updatedUser.role_id,
          isActive: updatedUser.is_active
        }
      }
    });
  })
);

// @desc    Update current user profile
// @route   PUT /api/v1/users/me
// @access  Private
router.put('/me',
  updateProfileValidation,
  auth,
  logActivity('update_profile'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const { first_name, last_name, phone, preferences, notification_settings } = req.body;

    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone) updateData.phone = phone;
    if (preferences) updateData.preferences = JSON.stringify(preferences);
    if (notification_settings) updateData.notification_settings = JSON.stringify(notification_settings);

    const updatedUser = await User.update(req.user.id, updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          phone: updatedUser.phone,
          preferences: updatedUser.preferences ? JSON.parse(updatedUser.preferences) : {},
          notificationSettings: updatedUser.notification_settings ? JSON.parse(updatedUser.notification_settings) : {}
        }
      }
    });
  })
);

// @desc    Deactivate user
// @route   DELETE /api/v1/users/:id
// @access  Private (user.manage permission)
router.delete('/:id',
  [param('id').isInt({ min: 1 }).withMessage('Valid user ID is required')],
  auth,
  requirePermission('user.manage'),
  authorizeFacility,
  logActivity('deactivate_user'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const userId = parseInt(req.params.id);

    // Prevent self-deactivation
    if (userId === req.user.id) {
      throw new ApiError(400, 'Cannot deactivate your own account');
    }

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      throw new ApiError(404, 'User not found');
    }

    // Check if user belongs to the same facility (unless super admin)
    if (req.user.roleName !== 'super_admin' && existingUser.facility_id !== req.user.facilityId) {
      throw new ApiError(403, 'Not authorized to deactivate this user');
    }

    await User.delete(userId); // This performs soft delete

    // Deactivate all user sessions
    await User.db('user_sessions')
      .where({ user_id: userId })
      .update({ 
        is_active: false,
        updated_at: new Date()
      });

    authLogger.info('User deactivated by admin', {
      deactivatedUserId: userId,
      deactivatedByUserId: req.user.id,
      deactivatedByUsername: req.user.username
    });

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  })
);

// @desc    Get all roles
// @route   GET /api/v1/users/roles
// @access  Private (user.view permission)
router.get('/roles/list',
  auth,
  requirePermission('user.view'),
  logActivity('view_roles'),
  asyncHandler(async (req, res) => {
    const roles = await User.db('roles')
      .select('id', 'name', 'display_name', 'description', 'permissions', 'is_active')
      .where('is_active', true)
      .orderBy('display_name', 'asc');

    res.json({
      success: true,
      data: {
        roles: roles.map(role => ({
          id: role.id,
          name: role.name,
          displayName: role.display_name,
          description: role.description,
          permissions: role.permissions ? JSON.parse(role.permissions) : [],
          isActive: role.is_active
        }))
      }
    });
  })
);

// @desc    Get users by facility
// @route   GET /api/v1/users/facility/:facilityId
// @access  Private (user.view permission)
router.get('/facility/:facilityId',
  [param('facilityId').isInt({ min: 1 }).withMessage('Valid facility ID is required')],
  auth,
  requirePermission('user.view'),
  authorizeFacility,
  logActivity('view_facility_users'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', true, errors.array());
    }

    const facilityId = parseInt(req.params.facilityId);
    const { is_active = true } = req.query;

    const users = await User.findByFacility(facilityId, {
      orderBy: 'users.first_name',
      orderDirection: 'asc'
    });

    const filteredUsers = is_active !== undefined 
      ? users.filter(user => user.is_active === (is_active === 'true'))
      : users;

    res.json({
      success: true,
      data: {
        users: filteredUsers.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          roleName: user.role_name,
          roleDisplayName: user.role_display_name,
          isActive: user.is_active
        }))
      }
    });
  })
);

module.exports = router;