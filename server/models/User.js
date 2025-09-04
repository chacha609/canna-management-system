const BaseModel = require('./BaseModel');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

/**
 * User Model
 * Handles user authentication, profile management, and role-based access
 */
class User extends BaseModel {
  constructor() {
    super('users');
  }

  /**
   * Create a new user with hashed password
   */
  async create(userData) {
    try {
      this.validateRequired(userData, ['username', 'email', 'password', 'first_name', 'last_name']);
      
      // Hash password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(userData.password, saltRounds);
      
      // Remove plain password and add hash
      const { password, ...userDataWithoutPassword } = userData;
      const userWithHash = {
        ...userDataWithoutPassword,
        password_hash,
        email_verified: false,
        is_active: true
      };

      const user = await super.create(userWithHash);
      
      // Remove password hash from returned user
      const { password_hash: _, ...userWithoutHash } = user;
      
      logger.info(`Created new user: ${user.username} (${user.email})`);
      return userWithoutHash;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find user by email or username
   */
  async findByEmailOrUsername(identifier) {
    try {
      const user = await this.db(this.tableName)
        .where('email', identifier)
        .orWhere('username', identifier)
        .first();
      
      return user;
    } catch (error) {
      logger.error('Error finding user by email/username:', error);
      throw error;
    }
  }

  /**
   * Authenticate user with password
   */
  async authenticate(identifier, password) {
    try {
      const user = await this.findByEmailOrUsername(identifier);
      
      if (!user) {
        logger.warn(`Authentication failed: User not found for identifier: ${identifier}`);
        return null;
      }

      if (!user.is_active) {
        logger.warn(`Authentication failed: User account inactive: ${identifier}`);
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        logger.warn(`Authentication failed: Invalid password for user: ${identifier}`);
        return null;
      }

      // Update last login
      await this.update(user.id, { last_login: new Date() });

      // Remove password hash from returned user
      const { password_hash, ...userWithoutHash } = user;
      
      logger.info(`User authenticated successfully: ${user.username}`);
      return userWithoutHash;
    } catch (error) {
      logger.error('Error authenticating user:', error);
      throw error;
    }
  }

  /**
   * Get user with role information
   */
  async findByIdWithRole(id) {
    try {
      const user = await this.db(this.tableName)
        .select(
          'users.*',
          'roles.name as role_name',
          'roles.display_name as role_display_name',
          'roles.permissions as role_permissions'
        )
        .leftJoin('roles', 'users.role_id', 'roles.id')
        .where('users.id', id)
        .first();

      if (user) {
        // Remove password hash
        const { password_hash, ...userWithoutHash } = user;
        
        // Parse permissions if they exist
        if (user.role_permissions) {
          userWithoutHash.role_permissions = JSON.parse(user.role_permissions);
        }
        
        return userWithoutHash;
      }
      
      return null;
    } catch (error) {
      logger.error(`Error finding user with role by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all users with role information
   */
  async findAllWithRoles(filters = {}, options = {}) {
    try {
      let query = this.db(this.tableName)
        .select(
          'users.*',
          'roles.name as role_name',
          'roles.display_name as role_display_name',
          'facilities.name as facility_name'
        )
        .leftJoin('roles', 'users.role_id', 'roles.id')
        .leftJoin('facilities', 'users.facility_id', 'facilities.id');

      // Apply filters
      if (filters.facility_id) {
        query = query.where('users.facility_id', filters.facility_id);
      }
      
      if (filters.role_id) {
        query = query.where('users.role_id', filters.role_id);
      }
      
      if (filters.is_active !== undefined) {
        query = query.where('users.is_active', filters.is_active);
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.orderBy(options.orderBy, options.orderDirection || 'asc');
      } else {
        query = query.orderBy('users.created_at', 'desc');
      }

      const users = await query;
      
      // Remove password hashes
      return users.map(user => {
        const { password_hash, ...userWithoutHash } = user;
        return userWithoutHash;
      });
    } catch (error) {
      logger.error('Error finding users with roles:', error);
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(id, newPassword) {
    try {
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(newPassword, saltRounds);
      
      const result = await this.update(id, { 
        password_hash,
        password_reset_token: null,
        password_reset_expires: null
      });
      
      logger.info(`Password updated for user ID: ${id}`);
      return result;
    } catch (error) {
      logger.error(`Error updating password for user ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Set password reset token
   */
  async setPasswordResetToken(id, token, expiresAt) {
    try {
      const result = await this.update(id, {
        password_reset_token: token,
        password_reset_expires: expiresAt
      });
      
      logger.info(`Password reset token set for user ID: ${id}`);
      return result;
    } catch (error) {
      logger.error(`Error setting password reset token for user ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(id) {
    try {
      const result = await this.update(id, {
        email_verified: true,
        email_verification_token: null,
        email_verification_expires: null
      });
      
      logger.info(`Email verified for user ID: ${id}`);
      return result;
    } catch (error) {
      logger.error(`Error verifying email for user ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Check if user has permission
   */
  async hasPermission(userId, permission) {
    try {
      const user = await this.findByIdWithRole(userId);
      
      if (!user || !user.role_permissions) {
        return false;
      }
      
      return user.role_permissions.includes(permission);
    } catch (error) {
      logger.error(`Error checking permission for user ID ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get users by facility
   */
  async findByFacility(facilityId, options = {}) {
    try {
      return await this.findAllWithRoles({ facility_id: facilityId }, options);
    } catch (error) {
      logger.error(`Error finding users by facility ID ${facilityId}:`, error);
      throw error;
    }
  }
}

module.exports = new User();