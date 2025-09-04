const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { auth, requirePermission, authorizeFacility } = require('../middleware/auth');
const Inventory = require('../models/Inventory');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Get all inventory items with filtering and pagination
 * GET /api/inventory
 */
router.get('/', auth, requirePermission('inventory:read'), asyncHandler(async (req, res) => {
  const {
    facility_id,
    category_id,
    supplier_id,
    item_type,
    is_active,
    low_stock,
    search,
    page = 1,
    limit = 50,
    order_by = 'name',
    order_direction = 'asc'
  } = req.query;

  // Authorize facility access
  if (facility_id) {
    await authorizeFacility(req, facility_id);
  }

  const filters = {
    facility_id: facility_id || req.user.facility_id,
    category_id,
    supplier_id,
    item_type,
    is_active: is_active !== undefined ? is_active === 'true' : undefined,
    low_stock: low_stock === 'true',
    search
  };

  const options = {
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
    orderBy: order_by,
    orderDirection: order_direction
  };

  const items = await Inventory.findAllWithRelations(filters, options);

  res.json({
    success: true,
    data: items,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: items.length
    }
  });
}));

/**
 * Get inventory item by ID
 * GET /api/inventory/:id
 */
router.get('/:id', auth, requirePermission('inventory:read'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const item = await Inventory.findByIdWithRelations(id);
  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, item.facility_id);

  res.json({
    success: true,
    data: item
  });
}));

/**
 * Create new inventory item
 * POST /api/inventory
 */
router.post('/', auth, requirePermission('inventory:create'), asyncHandler(async (req, res) => {
  const itemData = {
    ...req.body,
    facility_id: req.body.facility_id || req.user.facility_id
  };

  // Authorize facility access
  await authorizeFacility(req, itemData.facility_id);

  const item = await Inventory.create(itemData);

  logger.info(`User ${req.user.username} created inventory item: ${item.name} (SKU: ${item.sku})`);

  res.status(201).json({
    success: true,
    data: item,
    message: 'Inventory item created successfully'
  });
}));

/**
 * Update inventory item
 * PUT /api/inventory/:id
 */
router.put('/:id', auth, requirePermission('inventory:update'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const existingItem = await Inventory.findById(id);
  if (!existingItem) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, existingItem.facility_id);

  const updatedItem = await Inventory.update(id, req.body);

  logger.info(`User ${req.user.username} updated inventory item: ${updatedItem.name} (SKU: ${updatedItem.sku})`);

  res.json({
    success: true,
    data: updatedItem,
    message: 'Inventory item updated successfully'
  });
}));

/**
 * Update inventory quantities
 * PUT /api/inventory/:id/quantities
 */
router.put('/:id/quantities', auth, requirePermission('inventory:update'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { current_quantity, reserved_quantity } = req.body;

  const existingItem = await Inventory.findById(id);
  if (!existingItem) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, existingItem.facility_id);

  const updatedItem = await Inventory.updateQuantities(id, {
    current_quantity,
    reserved_quantity
  });

  logger.info(`User ${req.user.username} updated quantities for inventory item: ${existingItem.sku}`);

  res.json({
    success: true,
    data: updatedItem,
    message: 'Inventory quantities updated successfully'
  });
}));

/**
 * Record inventory movement
 * POST /api/inventory/:id/movements
 */
router.post('/:id/movements', auth, requirePermission('inventory:update'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const existingItem = await Inventory.findById(id);
  if (!existingItem) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, existingItem.facility_id);

  const movement = await Inventory.recordMovement(id, req.body, req.user.id);

  logger.info(`User ${req.user.username} recorded ${req.body.movement_type} movement for inventory item: ${existingItem.sku}`);

  res.status(201).json({
    success: true,
    data: movement,
    message: 'Inventory movement recorded successfully'
  });
}));

/**
 * Get inventory movement history
 * GET /api/inventory/:id/movements
 */
router.get('/:id/movements', auth, requirePermission('inventory:read'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    from_date,
    to_date,
    movement_type,
    page = 1,
    limit = 50
  } = req.query;

  const existingItem = await Inventory.findById(id);
  if (!existingItem) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, existingItem.facility_id);

  const options = {
    from_date,
    to_date,
    movement_type,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  };

  const movements = await Inventory.getMovementHistory(id, options);

  res.json({
    success: true,
    data: movements,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: movements.length
    }
  });
}));

/**
 * Get low stock items
 * GET /api/inventory/low-stock
 */
router.get('/low-stock', auth, requirePermission('inventory:read'), asyncHandler(async (req, res) => {
  const { facility_id } = req.query;
  const facilityId = facility_id || req.user.facility_id;

  // Authorize facility access
  await authorizeFacility(req, facilityId);

  const lowStockItems = await Inventory.findLowStock(facilityId);

  res.json({
    success: true,
    data: lowStockItems
  });
}));

/**
 * Get expiring items
 * GET /api/inventory/expiring
 */
router.get('/expiring', auth, requirePermission('inventory:read'), asyncHandler(async (req, res) => {
  const { facility_id, days_ahead = 30 } = req.query;
  const facilityId = facility_id || req.user.facility_id;

  // Authorize facility access
  await authorizeFacility(req, facilityId);

  const expiringItems = await Inventory.findExpiring(facilityId, parseInt(days_ahead));

  res.json({
    success: true,
    data: expiringItems
  });
}));

/**
 * Reserve inventory quantity
 * POST /api/inventory/:id/reserve
 */
router.post('/:id/reserve', auth, requirePermission('inventory:update'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, reference_type, reference_id, reason, notes, metadata } = req.body;

  const existingItem = await Inventory.findById(id);
  if (!existingItem) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, existingItem.facility_id);

  const reservation = await Inventory.reserveQuantity(id, quantity, {
    user_id: req.user.id,
    reference_type,
    reference_id,
    reason,
    notes,
    metadata
  });

  logger.info(`User ${req.user.username} reserved ${quantity} ${existingItem.unit_of_measure} of inventory item: ${existingItem.sku}`);

  res.json({
    success: true,
    data: reservation,
    message: 'Inventory reserved successfully'
  });
}));

/**
 * Release inventory reservation
 * POST /api/inventory/:id/release
 */
router.post('/:id/release', auth, requirePermission('inventory:update'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, reference_type, reference_id, reason, notes, metadata } = req.body;

  const existingItem = await Inventory.findById(id);
  if (!existingItem) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, existingItem.facility_id);

  const release = await Inventory.releaseReservation(id, quantity, {
    user_id: req.user.id,
    reference_type,
    reference_id,
    reason,
    notes,
    metadata
  });

  logger.info(`User ${req.user.username} released ${quantity} ${existingItem.unit_of_measure} reservation for inventory item: ${existingItem.sku}`);

  res.json({
    success: true,
    data: release,
    message: 'Inventory reservation released successfully'
  });
}));

/**
 * Get inventory statistics
 * GET /api/inventory/stats
 */
router.get('/stats', auth, requirePermission('inventory:read'), asyncHandler(async (req, res) => {
  const { facility_id } = req.query;
  const facilityId = facility_id || req.user.facility_id;

  // Authorize facility access
  await authorizeFacility(req, facilityId);

  const stats = await Inventory.getInventoryStats(facilityId);

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * Delete inventory item (soft delete)
 * DELETE /api/inventory/:id
 */
router.delete('/:id', auth, requirePermission('inventory:delete'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const existingItem = await Inventory.findById(id);
  if (!existingItem) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, existingItem.facility_id);

  await Inventory.update(id, { is_active: false });

  logger.info(`User ${req.user.username} deactivated inventory item: ${existingItem.name} (SKU: ${existingItem.sku})`);

  res.json({
    success: true,
    message: 'Inventory item deactivated successfully'
  });
}));

module.exports = router;