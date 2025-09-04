const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { authLogger } = require('../utils/logger');
const { User } = require('../models');

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('first_name').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required and must be less than 50 characters'),
  body('last_name').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required and must be less than 50 characters'),
  body('facility_id').isInt({ min: 1 }).withMessage('Valid facility ID is required'),
  body('role_id').optional().isInt({ min: 1 }).withMessage('Role ID must be a valid integer')
];

const loginValidation = [
  body('identifier').trim().notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const changePasswordValidation = [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Helper function to generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

// Helper function to store refresh token
const storeRefreshToken = async (userId, refreshToken, deviceInfo = null, ipAddress = null) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await User.db('user_sessions').insert({
    user_id: userId,
    refresh_token: refreshToken,
    device_info: deviceInfo,
    ip_address: ipAddress,
    expires_at: expiresAt,
    is_active: true
  });
};

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public (but may require admin approval)
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', true, errors.array());
  }

  const { username, email, password, first_name, last_name, facility_id, role_id, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmailOrUsername(email);
  if (existingUser) {
    throw new ApiError(400, 'User already exists with this email or username');
  }

  const existingUsername = await User.findByEmailOrUsername(username);
  if (existingUsername) {
    throw new ApiError(400, 'Username is already taken');
  }

  // Create user
  const userData = {
    username,
    email,
    password,
    first_name,
    last_name,
    facility_id,
    role_id: role_id || null,
    phone: phone || null
  };

  const newUser = await User.create(userData);

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(newUser.id);

  // Store refresh token
  const deviceInfo = req.get('User-Agent');
  const ipAddress = req.ip || req.connection.remoteAddress;
  await storeRefreshToken(newUser.id, refreshToken, deviceInfo, ipAddress);

  authLogger.info('User registered successfully', { 
    userId: newUser.id, 
    username: newUser.username,
    email: newUser.email,
    facilityId: newUser.facility_id
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        facilityId: newUser.facility_id,
        roleId: newUser.role_id,
        isActive: newUser.is_active,
        emailVerified: newUser.email_verified
      },
      accessToken,
      refreshToken
    }
  });
}));

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', true, errors.array());
  }

  const { identifier, password } = req.body;

  // Authenticate user
  const user = await User.authenticate(identifier, password);
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Get user with role information
  const userWithRole = await User.findByIdWithRole(user.id);

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Store refresh token
  const deviceInfo = req.get('User-Agent');
  const ipAddress = req.ip || req.connection.remoteAddress;
  await storeRefreshToken(user.id, refreshToken, deviceInfo, ipAddress);

  authLogger.info('User logged in successfully', { 
    userId: user.id, 
    username: user.username,
    email: user.email 
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: userWithRole.id,
        username: userWithRole.username,
        email: userWithRole.email,
        firstName: userWithRole.first_name,
        lastName: userWithRole.last_name,
        facilityId: userWithRole.facility_id,
        roleId: userWithRole.role_id,
        roleName: userWithRole.role_name,
        roleDisplayName: userWithRole.role_display_name,
        permissions: userWithRole.role_permissions || [],
        isActive: userWithRole.is_active,
        emailVerified: userWithRole.email_verified,
        lastLogin: userWithRole.last_login
      },
      accessToken,
      refreshToken
    }
  });
}));

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh
// @access  Public
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is required');
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
  } catch (error) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  // Check if refresh token exists in database and is active
  const session = await User.db('user_sessions')
    .where({ 
      refresh_token: refreshToken,
      user_id: decoded.userId,
      is_active: true
    })
    .where('expires_at', '>', new Date())
    .first();

  if (!session) {
    throw new ApiError(401, 'Refresh token expired or invalid');
  }

  // Check if user is still active
  const user = await User.findById(decoded.userId);
  if (!user || !user.is_active) {
    throw new ApiError(401, 'User account is inactive');
  }

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

  // Update refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await User.db('user_sessions')
    .where({ id: session.id })
    .update({
      refresh_token: newRefreshToken,
      expires_at: expiresAt,
      updated_at: new Date()
    });

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken,
      refreshToken: newRefreshToken
    }
  });
}));

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
router.post('/logout', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (refreshToken) {
    // Deactivate refresh token
    await User.db('user_sessions')
      .where({ refresh_token: refreshToken })
      .update({ 
        is_active: false,
        updated_at: new Date()
      });
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// @desc    Logout from all devices
// @route   POST /api/v1/auth/logout-all
// @access  Private
router.post('/logout-all', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  // Deactivate all refresh tokens for the user
  await User.db('user_sessions')
    .where({ user_id: userId })
    .update({ 
      is_active: false,
      updated_at: new Date()
    });

  authLogger.info('User logged out from all devices', { userId });

  res.json({
    success: true,
    message: 'Logged out from all devices successfully'
  });
}));

// @desc    Change password
// @route   POST /api/v1/auth/change-password
// @access  Private
router.post('/change-password', changePasswordValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', true, errors.array());
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const { current_password, new_password } = req.body;

  // Get user with password hash
  const user = await User.db('users').where('id', userId).first();
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Verify current password
  const bcrypt = require('bcrypt');
  const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password_hash);
  if (!isCurrentPasswordValid) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  // Update password
  await User.updatePassword(userId, new_password);

  // Deactivate all existing sessions except current one
  const currentRefreshToken = req.body.current_refresh_token;
  let query = User.db('user_sessions').where({ user_id: userId });
  
  if (currentRefreshToken) {
    query = query.whereNot({ refresh_token: currentRefreshToken });
  }
  
  await query.update({ 
    is_active: false,
    updated_at: new Date()
  });

  authLogger.info('User changed password', { userId });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
router.post('/forgot-password', forgotPasswordValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', true, errors.array());
  }

  const { email } = req.body;

  const user = await User.findByEmailOrUsername(email);
  if (!user) {
    // Don't reveal if email exists or not
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpires = new Date();
  resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // 1 hour

  // Store reset token
  await User.setPasswordResetToken(user.id, resetToken, resetTokenExpires);

  // TODO: Send email with reset link
  // For now, we'll just log it
  authLogger.info('Password reset requested', { 
    userId: user.id, 
    email: user.email,
    resetToken // Remove this in production
  });

  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent'
  });
}));

// @desc    Reset password
// @route   POST /api/v1/auth/reset-password
// @access  Public
router.post('/reset-password', resetPasswordValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', true, errors.array());
  }

  const { token, new_password } = req.body;

  // Find user with valid reset token
  const user = await User.db('users')
    .where('password_reset_token', token)
    .where('password_reset_expires', '>', new Date())
    .first();

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  // Update password and clear reset token
  await User.updatePassword(user.id, new_password);

  // Deactivate all sessions for security
  await User.db('user_sessions')
    .where({ user_id: user.id })
    .update({ 
      is_active: false,
      updated_at: new Date()
    });

  authLogger.info('Password reset completed', { userId: user.id });

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
router.get('/me', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const user = await User.findByIdWithRole(userId);
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
}));

module.exports = router;