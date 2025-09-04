const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Base Model Class
 * Provides common database operations and utilities for all models
 */
class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = db;
  }

  /**
   * Get all records with optional filtering and pagination
   */
  async findAll(filters = {}, options = {}) {
    try {
      let query = this.db(this.tableName);

      // Apply filters
      if (filters.facility_id) {
        query = query.where('facility_id', filters.facility_id);
      }
      
      if (filters.is_active !== undefined) {
        query = query.where('is_active', filters.is_active);
      }

      // Apply additional where conditions
      if (filters.where) {
        query = query.where(filters.where);
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.orderBy(options.orderBy, options.orderDirection || 'asc');
      } else {
        query = query.orderBy('created_at', 'desc');
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
        if (options.offset) {
          query = query.offset(options.offset);
        }
      }

      const results = await query;
      logger.info(`Retrieved ${results.length} records from ${this.tableName}`);
      return results;
    } catch (error) {
      logger.error(`Error finding all records in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Find a single record by ID
   */
  async findById(id) {
    try {
      const result = await this.db(this.tableName).where('id', id).first();
      if (result) {
        logger.info(`Found record with ID ${id} in ${this.tableName}`);
      } else {
        logger.warn(`No record found with ID ${id} in ${this.tableName}`);
      }
      return result;
    } catch (error) {
      logger.error(`Error finding record by ID ${id} in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Find a single record by conditions
   */
  async findOne(conditions) {
    try {
      const result = await this.db(this.tableName).where(conditions).first();
      if (result) {
        logger.info(`Found record in ${this.tableName} with conditions:`, conditions);
      }
      return result;
    } catch (error) {
      logger.error(`Error finding record in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Create a new record
   */
  async create(data) {
    try {
      const [result] = await this.db(this.tableName).insert(data).returning('*');
      logger.info(`Created new record in ${this.tableName} with ID ${result.id}`);
      return result;
    } catch (error) {
      logger.error(`Error creating record in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update a record by ID
   */
  async update(id, data) {
    try {
      // Add updated_at timestamp
      data.updated_at = new Date();
      
      const [result] = await this.db(this.tableName)
        .where('id', id)
        .update(data)
        .returning('*');
      
      if (result) {
        logger.info(`Updated record with ID ${id} in ${this.tableName}`);
      } else {
        logger.warn(`No record found to update with ID ${id} in ${this.tableName}`);
      }
      return result;
    } catch (error) {
      logger.error(`Error updating record with ID ${id} in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a record by ID (soft delete if is_active column exists)
   */
  async delete(id) {
    try {
      // Check if table has is_active column for soft delete
      const tableInfo = await this.db.raw(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = ? AND column_name = 'is_active'
      `, [this.tableName]);

      let result;
      if (tableInfo.rows.length > 0) {
        // Soft delete
        [result] = await this.db(this.tableName)
          .where('id', id)
          .update({ is_active: false, updated_at: new Date() })
          .returning('*');
        logger.info(`Soft deleted record with ID ${id} in ${this.tableName}`);
      } else {
        // Hard delete
        result = await this.db(this.tableName).where('id', id).del();
        logger.info(`Hard deleted record with ID ${id} in ${this.tableName}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error deleting record with ID ${id} in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Count records with optional filtering
   */
  async count(filters = {}) {
    try {
      let query = this.db(this.tableName);

      if (filters.facility_id) {
        query = query.where('facility_id', filters.facility_id);
      }
      
      if (filters.is_active !== undefined) {
        query = query.where('is_active', filters.is_active);
      }

      if (filters.where) {
        query = query.where(filters.where);
      }

      const result = await query.count('* as count').first();
      return parseInt(result.count);
    } catch (error) {
      logger.error(`Error counting records in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Execute a raw query
   */
  async raw(query, bindings = []) {
    try {
      const result = await this.db.raw(query, bindings);
      return result.rows;
    } catch (error) {
      logger.error(`Error executing raw query:`, error);
      throw error;
    }
  }

  /**
   * Begin a database transaction
   */
  async transaction(callback) {
    try {
      return await this.db.transaction(callback);
    } catch (error) {
      logger.error(`Transaction error in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Validate required fields
   */
  validateRequired(data, requiredFields) {
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Sanitize data by removing undefined values
   */
  sanitizeData(data) {
    const sanitized = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        sanitized[key] = data[key];
      }
    });
    return sanitized;
  }
}

module.exports = BaseModel;