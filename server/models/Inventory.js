const BaseModel = require('./BaseModel');
const logger = require('../utils/logger');

/**
 * Inventory Model
 * Handles inventory item tracking, movements, and stock management
 */
class Inventory extends BaseModel {
  constructor() {
    super('inventory_items');
  }

  /**
   * Create a new inventory item with validation
   */
  async create(itemData) {
    try {
      this.validateRequired(itemData, [
        'facility_id', 'sku', 'name', 'item_type', 'unit_of_measure'
      ]);

      // Ensure SKU is unique
      const existingItem = await this.findOne({ sku: itemData.sku });
      if (existingItem) {
        throw new Error(`SKU ${itemData.sku} already exists`);
      }

      const item = await super.create({
        ...itemData,
        current_quantity: itemData.current_quantity || 0,
        reserved_quantity: itemData.reserved_quantity || 0,
        available_quantity: itemData.available_quantity || itemData.current_quantity || 0,
        is_active: true
      });

      logger.info(`Created new inventory item: ${item.name} (SKU: ${item.sku})`);
      return item;
    } catch (error) {
      logger.error('Error creating inventory item:', error);
      throw error;
    }
  }

  /**
   * Get inventory item with related data
   */
  async findByIdWithRelations(id) {
    try {
      const item = await this.db(this.tableName)
        .select(
          'inventory_items.*',
          'categories.name as category_name',
          'categories.category_type',
          'suppliers.name as supplier_name'
        )
        .leftJoin('inventory_categories as categories', 'inventory_items.category_id', 'categories.id')
        .leftJoin('suppliers', 'inventory_items.supplier_id', 'suppliers.id')
        .where('inventory_items.id', id)
        .first();

      if (item) {
        // Parse JSON fields
        item.storage_requirements = item.storage_requirements ? JSON.parse(item.storage_requirements) : {};
        item.test_results = item.test_results ? JSON.parse(item.test_results) : {};
        item.certifications = item.certifications ? JSON.parse(item.certifications) : [];
        item.tags = item.tags ? JSON.parse(item.tags) : [];
      }

      return item;
    } catch (error) {
      logger.error(`Error finding inventory item with relations by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all inventory items with related data
   */
  async findAllWithRelations(filters = {}, options = {}) {
    try {
      let query = this.db(this.tableName)
        .select(
          'inventory_items.*',
          'categories.name as category_name',
          'categories.category_type',
          'suppliers.name as supplier_name'
        )
        .leftJoin('inventory_categories as categories', 'inventory_items.category_id', 'categories.id')
        .leftJoin('suppliers', 'inventory_items.supplier_id', 'suppliers.id');

      // Apply filters
      if (filters.facility_id) {
        query = query.where('inventory_items.facility_id', filters.facility_id);
      }
      
      if (filters.category_id) {
        query = query.where('inventory_items.category_id', filters.category_id);
      }
      
      if (filters.supplier_id) {
        query = query.where('inventory_items.supplier_id', filters.supplier_id);
      }
      
      if (filters.item_type) {
        query = query.where('inventory_items.item_type', filters.item_type);
      }
      
      if (filters.is_active !== undefined) {
        query = query.where('inventory_items.is_active', filters.is_active);
      }

      // Low stock filter
      if (filters.low_stock) {
        query = query.whereRaw('inventory_items.current_quantity <= inventory_items.reorder_point');
      }

      // Search by name or SKU
      if (filters.search) {
        query = query.where(function() {
          this.where('inventory_items.name', 'ilike', `%${filters.search}%`)
              .orWhere('inventory_items.sku', 'ilike', `%${filters.search}%`);
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.orderBy(options.orderBy, options.orderDirection || 'asc');
      } else {
        query = query.orderBy('inventory_items.name', 'asc');
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
        if (options.offset) {
          query = query.offset(options.offset);
        }
      }

      const items = await query;

      // Parse JSON fields for each item
      return items.map(item => ({
        ...item,
        storage_requirements: item.storage_requirements ? JSON.parse(item.storage_requirements) : {},
        test_results: item.test_results ? JSON.parse(item.test_results) : {},
        certifications: item.certifications ? JSON.parse(item.certifications) : [],
        tags: item.tags ? JSON.parse(item.tags) : []
      }));
    } catch (error) {
      logger.error('Error finding inventory items with relations:', error);
      throw error;
    }
  }

  /**
   * Update inventory quantities
   */
  async updateQuantities(id, quantityData) {
    try {
      const item = await this.findById(id);
      if (!item) {
        throw new Error(`Inventory item with ID ${id} not found`);
      }

      const updateData = {
        current_quantity: quantityData.current_quantity !== undefined ? quantityData.current_quantity : item.current_quantity,
        reserved_quantity: quantityData.reserved_quantity !== undefined ? quantityData.reserved_quantity : item.reserved_quantity,
        updated_at: new Date()
      };

      // Calculate available quantity
      updateData.available_quantity = updateData.current_quantity - updateData.reserved_quantity;

      const updatedItem = await this.update(id, updateData);
      logger.info(`Updated quantities for item ${item.sku}: current=${updateData.current_quantity}, available=${updateData.available_quantity}`);
      
      return updatedItem;
    } catch (error) {
      logger.error(`Error updating quantities for inventory item ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Record inventory movement
   */
  async recordMovement(itemId, movementData, userId) {
    try {
      return await this.transaction(async (trx) => {
        const item = await trx('inventory_items').where('id', itemId).first();
        if (!item) {
          throw new Error(`Inventory item with ID ${itemId} not found`);
        }

        // Record the movement
        const movement = await trx('inventory_movements').insert({
          item_id: itemId,
          facility_id: item.facility_id,
          user_id: userId,
          movement_type: movementData.movement_type,
          quantity: movementData.quantity,
          unit_cost: movementData.unit_cost,
          from_location: movementData.from_location,
          to_location: movementData.to_location,
          reference_type: movementData.reference_type,
          reference_id: movementData.reference_id,
          reason: movementData.reason,
          notes: movementData.notes,
          metadata: JSON.stringify(movementData.metadata || {}),
          movement_date: movementData.movement_date || new Date()
        }).returning('*');

        // Update item quantities based on movement type
        let newCurrentQuantity = parseFloat(item.current_quantity);
        
        switch (movementData.movement_type) {
          case 'in':
            newCurrentQuantity += parseFloat(movementData.quantity);
            break;
          case 'out':
          case 'waste':
          case 'loss':
            newCurrentQuantity -= parseFloat(movementData.quantity);
            break;
          case 'adjustment':
            newCurrentQuantity = parseFloat(movementData.quantity);
            break;
          case 'transfer':
            // For transfers, quantity represents the amount being moved out
            newCurrentQuantity -= parseFloat(movementData.quantity);
            break;
        }

        // Ensure quantity doesn't go negative
        if (newCurrentQuantity < 0) {
          throw new Error(`Insufficient inventory. Available: ${item.current_quantity}, Requested: ${movementData.quantity}`);
        }

        // Update item quantities
        const availableQuantity = newCurrentQuantity - parseFloat(item.reserved_quantity);
        
        await trx('inventory_items')
          .where('id', itemId)
          .update({
            current_quantity: newCurrentQuantity,
            available_quantity: availableQuantity,
            updated_at: new Date()
          });

        logger.info(`Recorded ${movementData.movement_type} movement for item ${item.sku}: ${movementData.quantity} ${item.unit_of_measure}`);
        return movement[0];
      });
    } catch (error) {
      logger.error(`Error recording movement for inventory item ID ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Get inventory movement history
   */
  async getMovementHistory(itemId, options = {}) {
    try {
      let query = this.db('inventory_movements')
        .select(
          'inventory_movements.*',
          'users.username as user_name'
        )
        .leftJoin('users', 'inventory_movements.user_id', 'users.id')
        .where('item_id', itemId);

      // Apply date filters
      if (options.from_date) {
        query = query.where('movement_date', '>=', options.from_date);
      }
      
      if (options.to_date) {
        query = query.where('movement_date', '<=', options.to_date);
      }

      // Apply movement type filter
      if (options.movement_type) {
        query = query.where('movement_type', options.movement_type);
      }

      query = query.orderBy('movement_date', 'desc');

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
        if (options.offset) {
          query = query.offset(options.offset);
        }
      }

      const movements = await query;

      return movements.map(movement => ({
        ...movement,
        metadata: movement.metadata ? JSON.parse(movement.metadata) : {}
      }));
    } catch (error) {
      logger.error(`Error getting movement history for inventory item ID ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Get low stock items
   */
  async findLowStock(facilityId, options = {}) {
    try {
      return await this.findAllWithRelations({
        facility_id: facilityId,
        low_stock: true,
        is_active: true
      }, options);
    } catch (error) {
      logger.error(`Error finding low stock items for facility ID ${facilityId}:`, error);
      throw error;
    }
  }

  /**
   * Get expired or expiring items
   */
  async findExpiring(facilityId, daysAhead = 30, options = {}) {
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + daysAhead);

      let query = this.db(this.tableName)
        .select(
          'inventory_items.*',
          'categories.name as category_name',
          'suppliers.name as supplier_name'
        )
        .leftJoin('inventory_categories as categories', 'inventory_items.category_id', 'categories.id')
        .leftJoin('suppliers', 'inventory_items.supplier_id', 'suppliers.id')
        .where('inventory_items.facility_id', facilityId)
        .where('inventory_items.is_active', true)
        .whereNotNull('inventory_items.expiration_date')
        .where('inventory_items.expiration_date', '<=', expirationDate);

      // Apply ordering
      query = query.orderBy('inventory_items.expiration_date', 'asc');

      const items = await query;

      return items.map(item => ({
        ...item,
        storage_requirements: item.storage_requirements ? JSON.parse(item.storage_requirements) : {},
        test_results: item.test_results ? JSON.parse(item.test_results) : {},
        certifications: item.certifications ? JSON.parse(item.certifications) : [],
        tags: item.tags ? JSON.parse(item.tags) : []
      }));
    } catch (error) {
      logger.error(`Error finding expiring items for facility ID ${facilityId}:`, error);
      throw error;
    }
  }

  /**
   * Reserve inventory for orders/tasks
   */
  async reserveQuantity(itemId, quantity, reservationData) {
    try {
      return await this.transaction(async (trx) => {
        const item = await trx('inventory_items').where('id', itemId).first();
        if (!item) {
          throw new Error(`Inventory item with ID ${itemId} not found`);
        }

        const availableQuantity = parseFloat(item.current_quantity) - parseFloat(item.reserved_quantity);
        
        if (availableQuantity < parseFloat(quantity)) {
          throw new Error(`Insufficient available inventory. Available: ${availableQuantity}, Requested: ${quantity}`);
        }

        const newReservedQuantity = parseFloat(item.reserved_quantity) + parseFloat(quantity);
        const newAvailableQuantity = parseFloat(item.current_quantity) - newReservedQuantity;

        await trx('inventory_items')
          .where('id', itemId)
          .update({
            reserved_quantity: newReservedQuantity,
            available_quantity: newAvailableQuantity,
            updated_at: new Date()
          });

        // Record the reservation movement
        await trx('inventory_movements').insert({
          item_id: itemId,
          facility_id: item.facility_id,
          user_id: reservationData.user_id,
          movement_type: 'reservation',
          quantity: quantity,
          reference_type: reservationData.reference_type,
          reference_id: reservationData.reference_id,
          reason: reservationData.reason || 'Inventory reserved',
          notes: reservationData.notes,
          metadata: JSON.stringify(reservationData.metadata || {}),
          movement_date: new Date()
        });

        logger.info(`Reserved ${quantity} ${item.unit_of_measure} of item ${item.sku}`);
        return { reserved_quantity: quantity, available_quantity: newAvailableQuantity };
      });
    } catch (error) {
      logger.error(`Error reserving quantity for inventory item ID ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Release reserved inventory
   */
  async releaseReservation(itemId, quantity, releaseData) {
    try {
      return await this.transaction(async (trx) => {
        const item = await trx('inventory_items').where('id', itemId).first();
        if (!item) {
          throw new Error(`Inventory item with ID ${itemId} not found`);
        }

        if (parseFloat(item.reserved_quantity) < parseFloat(quantity)) {
          throw new Error(`Cannot release more than reserved. Reserved: ${item.reserved_quantity}, Requested: ${quantity}`);
        }

        const newReservedQuantity = parseFloat(item.reserved_quantity) - parseFloat(quantity);
        const newAvailableQuantity = parseFloat(item.current_quantity) - newReservedQuantity;

        await trx('inventory_items')
          .where('id', itemId)
          .update({
            reserved_quantity: newReservedQuantity,
            available_quantity: newAvailableQuantity,
            updated_at: new Date()
          });

        // Record the release movement
        await trx('inventory_movements').insert({
          item_id: itemId,
          facility_id: item.facility_id,
          user_id: releaseData.user_id,
          movement_type: 'release',
          quantity: quantity,
          reference_type: releaseData.reference_type,
          reference_id: releaseData.reference_id,
          reason: releaseData.reason || 'Reservation released',
          notes: releaseData.notes,
          metadata: JSON.stringify(releaseData.metadata || {}),
          movement_date: new Date()
        });

        logger.info(`Released ${quantity} ${item.unit_of_measure} reservation for item ${item.sku}`);
        return { released_quantity: quantity, available_quantity: newAvailableQuantity };
      });
    } catch (error) {
      logger.error(`Error releasing reservation for inventory item ID ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats(facilityId) {
    try {
      // Total items count
      const totalItems = await this.db(this.tableName)
        .where('facility_id', facilityId)
        .where('is_active', true)
        .count('* as count')
        .first();

      // Low stock items count
      const lowStockItems = await this.db(this.tableName)
        .where('facility_id', facilityId)
        .where('is_active', true)
        .whereRaw('current_quantity <= reorder_point')
        .count('* as count')
        .first();

      // Total inventory value
      const inventoryValue = await this.db(this.tableName)
        .where('facility_id', facilityId)
        .where('is_active', true)
        .sum(this.db.raw('current_quantity * unit_cost'))
        .first();

      // Items by category
      const categoryStats = await this.db(this.tableName)
        .select('categories.name as category_name')
        .count('inventory_items.id as count')
        .leftJoin('inventory_categories as categories', 'inventory_items.category_id', 'categories.id')
        .where('inventory_items.facility_id', facilityId)
        .where('inventory_items.is_active', true)
        .groupBy('categories.name');

      // Recent movements (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentMovements = await this.db('inventory_movements')
        .join('inventory_items', 'inventory_movements.item_id', 'inventory_items.id')
        .where('inventory_items.facility_id', facilityId)
        .where('inventory_movements.movement_date', '>=', sevenDaysAgo)
        .count('* as count')
        .first();

      return {
        total_items: parseInt(totalItems.count),
        low_stock_items: parseInt(lowStockItems.count),
        total_value: parseFloat(inventoryValue.sum) || 0,
        category_stats: categoryStats.reduce((acc, stat) => {
          acc[stat.category_name || 'Uncategorized'] = parseInt(stat.count);
          return acc;
        }, {}),
        recent_movements: parseInt(recentMovements.count)
      };
    } catch (error) {
      logger.error(`Error getting inventory stats for facility ID ${facilityId}:`, error);
      throw error;
    }
  }
}

module.exports = new Inventory();